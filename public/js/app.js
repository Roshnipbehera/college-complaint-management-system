/**
 * College Complaint Management System - Interactive Frontend Application (v2.0)
 * Features: Dark/Light Mode, Instant Code Tracker, Lifecycle Stepper,
 * Filter Pills, Printable Grievance Receipts, and Threaded Triage.
 */

const state = {
    user: null,
    categories: [],
    complaints: [],
    stats: { total: 0, submitted: 0, progress: 0, resolved: 0 },
    currentView: 'home',
    activeFilters: {
        status: '',
        category_id: '',
        priority: '',
        search: ''
    },
    selectedComplaint: null
};

// ==============================================================================
// Theme Toggle (Dark & Light Theme)
// ==============================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('portal_theme') || 'dark';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (toggleBtn) toggleBtn.textContent = '🌙';
    } else {
        document.body.classList.remove('light-theme');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    }
    localStorage.setItem('portal_theme', theme);
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
    showToast(`Switched to ${isLight ? 'Dark' : 'Light'} Mode`, 'info');
}

// ==============================================================================
// Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEventListeners();
    await checkAuth();
    await loadCategories();
    await loadComplaints();
});

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
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
                <div class="user-avatar">${state.user.full_name.charAt(0).toUpperCase()}</div>
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

    if (filterCat) filterCat.innerHTML = '<option value="">All Categories</option>';
    if (formCat) formCat.innerHTML = '<option value="">Select a Category</option>';

    state.categories.forEach(cat => {
        if (filterCat) filterCat.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
        if (formCat) formCat.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
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
                <p style="color:var(--text-muted); font-size:0.9rem">Try adjusting your filters, search keywords, or clear active pills.</p>
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
                    ${c.assigned_staff_name ? `<span style="color:var(--primary)">👨‍💼 Assigned: ${c.assigned_staff_name}</span>` : '<span style="color:var(--text-muted)">Unassigned</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

// ==============================================================================
// Instant Grievance Tracker
// ==============================================================================
async function handleQuickTrack(e) {
    if (e) e.preventDefault();
    const homeInput = document.getElementById('homeQuickTrackInput');
    const dashInput = document.getElementById('quickTrackInput');
    const input = (homeInput && homeInput.value.trim()) ? homeInput : dashInput;
    const code = input ? input.value.trim().toUpperCase() : '';
    if (!code) return;

    showToast(`Searching for tracking code ${code}...`, 'info');

    // 1. Check loaded complaints in state
    const localMatch = state.complaints.find(c => c.complaint_code && c.complaint_code.toUpperCase() === code);
    if (localMatch) {
        openDetailsModal(localMatch.complaint_id);
        if (homeInput) homeInput.value = '';
        if (dashInput) dashInput.value = '';
        return;
    }

    // 2. Query API search
    try {
        const res = await api.getComplaints({ search: code });
        const list = res.data || [];
        const exactMatch = list.find(c => c.complaint_code && c.complaint_code.toUpperCase() === code) || list[0];

        if (exactMatch) {
            openDetailsModal(exactMatch.complaint_id);
            if (homeInput) homeInput.value = '';
            if (dashInput) dashInput.value = '';
        } else {
            showToast(`No grievance found with tracking code "${code}"`, 'error');
        }
    } catch (err) {
        showToast(`Tracking lookup failed: ${err.message}`, 'error');
    }
}

// Quick Department Filtering from Homepage Cards
function filterByCategoryName(keyword) {
    const match = state.categories.find(c => c.category_name.toLowerCase().includes(keyword.toLowerCase()));
    if (match) {
        state.activeFilters.category_id = match.category_id;
        const filterCat = document.getElementById('filterCategory');
        if (filterCat) filterCat.value = match.category_id;
    } else {
        state.activeFilters.search = keyword;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = keyword;
    }
    switchTab('dashboard');
    loadComplaints();
}

// Staff Triage Shortcut
function filterByStaffTriage() {
    state.activeFilters.status = 'ASSIGNED';
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.value = 'ASSIGNED';
    syncPillsUI('ASSIGNED');
    switchTab('dashboard');
    loadComplaints();
}

// ==============================================================================
// Filter Pills Handler
// ==============================================================================
function handlePillFilter(status) {
    state.activeFilters.status = status;
    const filterStatusSelect = document.getElementById('filterStatus');
    if (filterStatusSelect) filterStatusSelect.value = status;
    syncPillsUI(status);
    loadComplaints();
}

function syncPillsUI(status) {
    document.querySelectorAll('#statusPillsBar .pill-btn').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        let isActive = false;
        if (status === '' && text.includes('all')) isActive = true;
        else if (status === 'SUBMITTED' && text.includes('submitted')) isActive = true;
        else if (status === 'UNDER_REVIEW' && text.includes('under review')) isActive = true;
        else if (status === 'ASSIGNED' && text.includes('assigned')) isActive = true;
        else if (status === 'IN_PROGRESS' && text.includes('in progress')) isActive = true;
        else if (status === 'RESOLVED' && text.includes('resolved')) isActive = true;
        else if (status === 'CLOSED' && text.includes('closed')) isActive = true;

        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ==============================================================================
// Visual Lifecycle Stepper
// ==============================================================================
function renderLifecycleStepper(status) {
    if (status === 'REJECTED') {
        return `
            <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:0.9rem 1.25rem; margin:1rem 0; display:flex; align-items:center; gap:0.75rem; color:#f87171">
                <span style="font-size:1.6rem">🚫</span>
                <div>
                    <strong style="display:block; font-size:0.95rem">Grievance Marked as Rejected</strong>
                    <span style="font-size:0.82rem; color:var(--text-secondary)">This complaint could not be validated or is outside portal jurisdiction. Check staff notes below.</span>
                </div>
            </div>
        `;
    }

    const steps = [
        { key: 'SUBMITTED', label: 'Submitted', num: 1 },
        { key: 'UNDER_REVIEW', label: 'Under Review', num: 2 },
        { key: 'ASSIGNED', label: 'Assigned', num: 3 },
        { key: 'IN_PROGRESS', label: 'In Progress', num: 4 },
        { key: 'RESOLVED', label: 'Resolved', num: 5 }
    ];

    const statusRanks = {
        'SUBMITTED': 1,
        'UNDER_REVIEW': 2,
        'ASSIGNED': 3,
        'IN_PROGRESS': 4,
        'RESOLVED': 5,
        'CLOSED': 6
    };

    const currentRank = statusRanks[status] || 1;

    return `
        <div class="lifecycle-stepper">
            ${steps.map(step => {
                let cls = '';
                let nodeContent = step.num;
                if (step.num < currentRank || currentRank === 6) {
                    cls = 'completed';
                    nodeContent = '✓';
                } else if (step.num === currentRank) {
                    cls = 'active';
                }
                return `
                    <div class="step-item ${cls}">
                        <div class="step-node">${nodeContent}</div>
                        <div class="step-label">${step.label}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==============================================================================
// Complaint Details Modal & Lifecycle Management
// ==============================================================================
async function openDetailsModal(id) {
    const modal = document.getElementById('detailsModal');
    const body = document.getElementById('detailsModalBody');
    body.innerHTML = '<div style="text-align:center; padding:2rem">Loading grievance details...</div>';
    modal.classList.add('active');

    try {
        const res = await api.getComplaintById(id);
        state.selectedComplaint = res.data;
        const c = state.selectedComplaint;

        const isOwner = state.user && state.user.user_id === c.student_id;
        const isStaff = state.user && (state.user.role_name === 'STAFF' || state.user.role_name === 'ADMIN');
        const canDelete = isOwner && c.status === 'SUBMITTED';

        body.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem">
                <div>
                    <span class="card-code" style="font-size:0.85rem; cursor:pointer" title="Click to copy tracking code" onclick="navigator.clipboard && navigator.clipboard.writeText('${c.complaint_code}'); showToast('Tracking code copied: ${c.complaint_code}', 'success')">${c.complaint_code} 📋</span>
                    <h2 style="margin-top:0.4rem; font-size:1.35rem; color:var(--text-primary)">${c.title}</h2>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center">
                    <span class="badge priority-${c.priority}">${c.priority}</span>
                    <span class="badge status-${c.status}">${c.status.replace('_', ' ')}</span>
                </div>
            </div>

            <!-- Visual Stepper Progress Bar -->
            ${renderLifecycleStepper(c.status)}

            <div style="background:var(--bg-glass); padding:1.15rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:1.25rem">
                <p style="font-size:0.95rem; line-height:1.65; white-space:pre-wrap; color:var(--text-primary)">${c.description}</p>
            </div>

            <!-- Metadata Details Grid -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; font-size:0.85rem; margin-bottom:1.5rem; padding:1rem; background:rgba(0,0,0,0.1); border-radius:var(--radius-sm); border:1px solid var(--border-subtle)">
                <div><span style="color:var(--text-muted)">Category:</span> <strong style="color:var(--text-primary)">📁 ${c.category_name}</strong></div>
                <div><span style="color:var(--text-muted)">Filing Student:</span> <strong style="color:var(--text-primary)">👤 ${c.student_name}</strong></div>
                <div><span style="color:var(--text-muted)">Submitted On:</span> <strong style="color:var(--text-primary)">🕒 ${new Date(c.created_at).toLocaleString()}</strong></div>
                <div><span style="color:var(--text-muted)">Assigned Staff:</span> <strong style="color:var(--text-primary)">👨‍💼 ${c.assigned_staff_name || 'Unassigned'}</strong></div>
            </div>

            ${isStaff ? `
                <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1.5rem">
                    <h4 style="color:var(--accent-indigo); margin-bottom:0.75rem">⚡ Staff Actions & Resolution Controls</h4>
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
                        <input id="updateRemarksInput" type="text" class="form-control" placeholder="Audit remarks / resolution summary..." style="flex:2; min-width:200px">
                        <button class="btn btn-primary" onclick="handleStatusUpdate(${c.complaint_id})">Apply Status</button>
                    </div>
                </div>
            ` : ''}

            <!-- Discussion & Activity Log -->
            <div class="comments-section">
                <h4 style="margin-bottom:1rem; color:var(--text-primary)">💬 Discussion & Investigation Log (${(c.comments || []).length})</h4>
                <div id="commentsList">
                    ${(c.comments && c.comments.length) ? c.comments.map(com => `
                        <div class="comment-item">
                            <div class="comment-author">
                                <span>${com.full_name} <span class="badge" style="font-size:0.65rem">${com.role_name}</span></span>
                                <span class="comment-date">${new Date(com.created_at).toLocaleString()}</span>
                            </div>
                            <div class="comment-text">${com.comment_text}</div>
                        </div>
                    `).join('') : '<p style="color:var(--text-muted); font-size:0.85rem">No discussion remarks yet.</p>'}
                </div>

                ${state.user ? `
                    <div style="margin-top:1rem; display:flex; gap:0.5rem">
                        <input id="newCommentInput" type="text" class="form-control" placeholder="Write a resolution note or inquiry...">
                        <button class="btn btn-secondary" onclick="handleCommentSubmit(${c.complaint_id})">Post</button>
                    </div>
                ` : '<p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.75rem"><em>Sign in to post replies or notes.</em></p>'}
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
        showToast('Please select a valid status', 'error');
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
        showToast('Comment posted', 'success');
        openDetailsModal(id);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleDeleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this grievance? This cannot be undone.')) return;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                state.activeFilters.search = e.target.value.trim();
                loadComplaints();
            }, 300);
        });
    }

    // Filter Dropdowns
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            state.activeFilters.status = e.target.value;
            syncPillsUI(e.target.value);
            loadComplaints();
        });
    }

    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            state.activeFilters.category_id = e.target.value;
            loadComplaints();
        });
    }

    const filterPriority = document.getElementById('filterPriority');
    if (filterPriority) {
        filterPriority.addEventListener('change', (e) => {
            state.activeFilters.priority = e.target.value;
            loadComplaints();
        });
    }

    // Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', submitLogin);

    const regForm = document.getElementById('registerForm');
    if (regForm) regForm.addEventListener('submit', submitRegister);

    const newComplaintForm = document.getElementById('newComplaintForm');
    if (newComplaintForm) newComplaintForm.addEventListener('submit', handleCreateComplaint);
}
