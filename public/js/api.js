/**
 * College Complaint Management System - API Client
 */

const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include' // Transmit HTTP-only cookies
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || `Request failed with status ${response.status}`);
                error.status = response.status;
                error.errors = data.errors || null;
                throw error;
            }

            return data;
        } catch (err) {
            console.error(`API Error on ${endpoint}:`, err);
            throw err;
        }
    }

    // --- Authentication ---
    async login(email, password) {
        const res = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (res.token) {
            this.setToken(res.token);
        }
        return res;
    }

    async register(userData) {
        const res = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (res.token) {
            this.setToken(res.token);
        }
        return res;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async getMe() {
        return this.request('/auth/me');
    }

    async getStaff() {
        return this.request('/auth/staff');
    }

    // --- Categories ---
    async getCategories() {
        return this.request('/categories');
    }

    // --- Complaints ---
    async getComplaints(filters = {}) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/complaints${qs}`);
    }

    async getComplaintById(id) {
        return this.request(`/complaints/${id}`);
    }

    async createComplaint(complaintData) {
        return this.request('/complaints', {
            method: 'POST',
            body: JSON.stringify(complaintData)
        });
    }

    async updateComplaint(id, updateData) {
        return this.request(`/complaints/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async deleteComplaint(id) {
        return this.request(`/complaints/${id}`, {
            method: 'DELETE'
        });
    }

    async assignComplaint(id, staff_id) {
        return this.request(`/complaints/${id}/assign`, {
            method: 'POST',
            body: JSON.stringify({ staff_id })
        });
    }

    async updateStatus(id, status, remarks) {
        return this.request(`/complaints/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status, remarks })
        });
    }

    async addComment(id, comment_text) {
        return this.request(`/complaints/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment_text })
        });
    }
}

const api = new ApiClient();
window.api = api;
