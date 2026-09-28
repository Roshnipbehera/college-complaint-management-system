/**
 * College Complaint Management System - Interactive Frontend Application
 */

const state = {
    user: null,
    categories: [],
    complaints: [],
    stats: { total: 0, submitted: 0, progress: 0, resolved: 0 },
    currentView: 'dashboard',
    activeFilters: {
        status: '',
        category_id: '',
        priority: '',
        search: ''
    },
    selectedComplaint: null
};

// ==============================================================================
// Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await checkAuth();
    await loadCategories();
    await loadComplaints();
});

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `<span style="font-weight:bold; font-size:1.1rem">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==============================================================================
// Authentication & User Session
// ==============================================================================
async function checkAuth() {
    try {
        const res = await api.getMe();
        if (res.success && res.data) {
            state.user = res.data;
            updateUserUI();
        }
    } catch (err) {
        state.user = null;
        updateUserUI();
    }
}

function updateUserUI() {
    const userContainer = document.getElementById('userNavSection');
    const staffTab = document.getElementById('navStaff');
    const newComplaintTab = document.getElementById('navNewComplaint');

    if (state.user) {
        userContainer.innerHTML = `
            <div class="user-badge">
                <div class="user-avatar">${state.user.full_name.charAt(0)}</div>
                <div class="user-info">
                    <span class="user-name">${state.user.full_name}</span>
                    <span class="user-role">${state.user.role_name}</span>
                </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
        `;

        if (state.user.role_name === 'STAFF' || state.user.role_name === 'ADMIN') {
            staffTab.style.display = 'inline-block';
        } else {
            staffTab.style.display = 'none';
        }

        newComplaintTab.style.display = 'inline-block';
    } else {
        userContainer.innerHTML = `
            <button class="btn btn-secondary btn-sm" onclick="openAuthModal('login')">Sign In</button>
            <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">Register</button>
        `;
        staffTab.style.display = 'none';
        newComplaintTab.style.display = 'none';
    }
}

async function handleLogout() {
    try {
        await api.logout();
        state.user = null;
        updateUserUI();
        showToast('Logged out successfully', 'info');
        loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==============================================================================
// Modals: Authentication
// ==============================================================================
function openAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');

    if (mode === 'login') {
        modalTitle.textContent = 'Welcome Back — Sign In';
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
    } else {
        modalTitle.textContent = 'Create Student Account';
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
    }

    modal.classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function fillDemo(email, password) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
}

async function submitLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await api.login(email, password);
        state.user = res.user;
        updateUserUI();
        closeAuthModal();
        showToast(`Welcome back, ${res.user.full_name}!`, 'success');
        loadComplaints();
    } catch (err) {
        showToast(err.message || 'Invalid email or password', 'error');
    }
}

async function submitRegister(e) {
    e.preventDefault();
    const full_name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();

    try {
        const res = await api.register({ full_name, email, password, phone, role_name: 'STUDENT' });
        state.user = res.user;
        updateUserUI();
        closeAuthModal();
        showToast('Registration successful! Welcome.', 'success');
        loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==============================================================================
// Data Loading: Categories & Complaints
// ==============================================================================
async function loadCategories() {
    try {
        const res = await api.getCategories();
        if (res.success) {
            state.categories = res.data;
            populateCategoryDropdowns();
        }
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

function populateCategoryDropdowns() {
    const filterCat = document.getElementById('filterCategory');
    const formCat = document.getElementById('complaintCategory');

    filterCat.innerHTML = '<option value="">All Categories</option>';
    formCat.innerHTML = '<option value="">Select a Category</option>';

    state.categories.forEach(cat => {
        filterCat.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
        formCat.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
    });
}

async function loadComplaints() {
    const listEl = document.getElementById('complaintsList');
    listEl.innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--text-muted)">
            <div style="font-size:2rem; margin-bottom:1rem">⏳</div>
            Loading complaints...
        </div>
    `;

    try {
        const res = await api.getComplaints(state.activeFilters);
        state.complaints = res.data || [];
        updateStats();
        renderComplaints();
    } catch (err) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:3rem; color:#f87171">
                Failed to load complaints: ${err.message}
            </div>
        `;
    }
}

function updateStats() {
    // Count stats across complaints
    let submitted = 0;
    let inProgress = 0;
    let resolved = 0;

    state.complaints.forEach(c => {
        if (c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW') submitted++;
        else if (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') inProgress++;
        else if (c.status === 'RESOLVED' || c.status === 'CLOSED') resolved++;
    });

    document.getElementById('statTotal').textContent = state.complaints.length;
    document.getElementById('statPending').textContent = submitted;
    document.getElementById('statProgress').textContent = inProgress;
    document.getElementById('statResolved').textContent = resolved;
}

function renderComplaints() {
    const listEl = document.getElementById('complaintsList');

    if (state.complaints.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding: 4rem 2rem; background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-color)">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem">📂</div>
                <h3 style="color:var(--text-primary); margin-bottom:0.25rem">No complaints found</h3>
                <p style="color:var(--text-muted); font-size:0.9rem">Try adjusting your filters or search keywords.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = state.complaints.map(c => `
        <div class="complaint-card" onclick="openDetailsModal(${c.complaint_id})">
            <div class="card-header">
                <div>
                    <span class="card-code">${c.complaint_code}</span>
                    <h3 class="card-title">${c.title}</h3>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center">
                    <span class="badge priority-${c.priority}">${c.priority}</span>
                    <span class="badge status-${c.status}">${c.status.replace('_', ' ')}</span>
                </div>
            </div>
            <p class="card-description">${c.description}</p>
            <div class="card-footer">
                <div class="meta-group">
                    <span class="category-tag">📁 ${c.category_name}</span>
                    <span>👤 ${c.student_name}</span>
                    <span>🕒 ${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                    ${c.assigned_staff_name ? `<span style="color:var(--accent-blue)">👨‍💼 Assigned: ${c.assigned_staff_name}</span>` : '<span style="color:var(--text-muted)">Unassigned</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

// ==============================================================================
// Complaint Details Modal & Lifecycle Management
// ==============================================================================
async function openDetailsModal(id) {
    const modal = document.getElementById('detailsModal');
    const body = document.getElementById('detailsModalBody');
    body.innerHTML = '<div style="text-align:center; padding:2rem">Loading details...</div>';
    modal.classList.add('active');

    try {
        const res = await api.getComplaintById(id);
        state.selectedComplaint = res.data;
        const c = state.selectedComplaint;

        const isOwner = state.user && state.user.user_id === c.student_id;
        const isStaff = state.user && (state.user.role_name === 'STAFF' || state.user.role_name === 'ADMIN');
        const canDelete = isOwner && c.status === 'SUBMITTED';

        body.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem">
                <div>
                    <span class="card-code" style="font-size:0.85rem">${c.complaint_code}</span>
                    <h2 style="margin-top:0.4rem; font-size:1.35rem">${c.title}</h2>
                </div>
                <div style="display:flex; gap:0.5rem">
                    <span class="badge priority-${c.priority}">${c.priority}</span>
                    <span class="badge status-${c.status}">${c.status.replace('_', ' ')}</span>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.03); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:1.5rem">
                <p style="font-size:0.95rem; line-height:1.6; white-space:pre-wrap">${c.description}</p>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; font-size:0.85rem; margin-bottom:1.5rem">
                <div><span style="color:var(--text-muted)">Category:</span> <strong>${c.category_name}</strong></div>
                <div><span style="color:var(--text-muted)">Student:</span> <strong>${c.student_name}</strong></div>
                <div><span style="color:var(--text-muted)">Submitted:</span> <strong>${new Date(c.created_at).toLocaleString()}</strong></div>
                <div><span style="color:var(--text-muted)">Assigned Staff:</span> <strong>${c.assigned_staff_name || 'None'}</strong></div>
            </div>

            ${isStaff ? `
                <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1.5rem">
                    <h4 style="color:#a5b4fc; margin-bottom:0.75rem">⚡ Staff Actions</h4>
                    <div style="display:flex; gap:0.75rem; flex-wrap:wrap">
                        <select id="updateStatusSelect" class="form-control" style="flex:1; min-width:180px">
                            <option value="">Update Status...</option>
                            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CLOSED">CLOSED</option>
                        </select>
                        <input id="updateRemarksInput" type="text" class="form-control" placeholder="Optional remarks..." style="flex:2; min-width:200px">
                        <button class="btn btn-primary" onclick="handleStatusUpdate(${c.complaint_id})">Update Status</button>
                    </div>
                </div>
            ` : ''}

            <!-- Comments & Discussion -->
            <div class="comments-section">
                <h4 style="margin-bottom:1rem">💬 Discussion & Activity Log (${(c.comments || []).length})</h4>
                <div id="commentsList">
                    ${(c.comments && c.comments.length) ? c.comments.map(com => `
                        <div class="comment-item">
                            <div class="comment-author">
                                <span>${com.full_name} <span class="badge" style="font-size:0.65rem">${com.role_name}</span></span>
                                <span class="comment-date">${new Date(com.created_at).toLocaleString()}</span>
                            </div>
                            <div class="comment-text">${com.comment_text}</div>
                        </div>
                    `).join('') : '<p style="color:var(--text-muted); font-size:0.85rem">No comments yet.</p>'}
                </div>

                ${state.user ? `
                    <div style="margin-top:1rem; display:flex; gap:0.5rem">
                        <input id="newCommentInput" type="text" class="form-control" placeholder="Write a comment or update...">
                        <button class="btn btn-secondary" onclick="handleCommentSubmit(${c.complaint_id})">Post</button>
                    </div>
                ` : '<p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.75rem"><em>Sign in to leave a comment.</em></p>'}
            </div>

            ${canDelete ? `
                <div style="margin-top:1.5rem; text-align:right">
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteComplaint(${c.complaint_id})">🗑️ Delete My Complaint</button>
                </div>
            ` : ''}
        `;
    } catch (err) {
        body.innerHTML = `<div style="color:#f87171">Failed to load details: ${err.message}</div>`;
    }
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

async function handleStatusUpdate(id) {
    const status = document.getElementById('updateStatusSelect').value;
    const remarks = document.getElementById('updateRemarksInput').value.trim();

    if (!status) {
        showToast('Please select a status', 'error');
        return;
    }

    try {
        await api.updateStatus(id, status, remarks);
        showToast(`Status updated to ${status}`, 'success');
        openDetailsModal(id);
        loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleCommentSubmit(id) {
    const input = document.getElementById('newCommentInput');
    const text = input.value.trim();
    if (!text) return;

    try {
        await api.addComment(id, text);
        showToast('Comment added', 'success');
        openDetailsModal(id);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleDeleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
        await api.deleteComplaint(id);
        closeDetailsModal();
        showToast('Complaint deleted successfully', 'success');
        loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==============================================================================
// Complaint Creation
// ==============================================================================
async function handleCreateComplaint(e) {
    e.preventDefault();
    if (!state.user) {
        openAuthModal('login');
        return;
    }

    const title = document.getElementById('complaintTitle').value.trim();
    const category_id = document.getElementById('complaintCategory').value;
    const priority = document.getElementById('complaintPriority').value;
    const description = document.getElementById('complaintDescription').value.trim();

    try {
        const res = await api.createComplaint({ title, category_id, priority, description });
        showToast(`Complaint ${res.data.complaint_code} filed successfully!`, 'success');
        document.getElementById('newComplaintForm').reset();
        switchTab('dashboard');
        loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==============================================================================
// Tab Navigation & Event Listeners
// ==============================================================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');

    const navItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    state.currentView = tabName;
}

function setupEventListeners() {
    // Nav Tabs
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    // Search Debounce
    let searchTimer;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.activeFilters.search = e.target.value.trim();
            loadComplaints();
        }, 300);
    });

    // Filters
    document.getElementById('filterStatus').addEventListener('change', (e) => {
        state.activeFilters.status = e.target.value;
        loadComplaints();
    });

    document.getElementById('filterCategory').addEventListener('change', (e) => {
        state.activeFilters.category_id = e.target.value;
        loadComplaints();
    });

    document.getElementById('filterPriority').addEventListener('change', (e) => {
        state.activeFilters.priority = e.target.value;
        loadComplaints();
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', submitLogin);
    document.getElementById('registerForm').addEventListener('submit', submitRegister);
    document.getElementById('newComplaintForm').addEventListener('submit', handleCreateComplaint);
}
