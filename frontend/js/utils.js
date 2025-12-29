// API Configuration - dynamically use current port
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`;


// Token Management
const TokenManager = {
    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(token) {
        localStorage.setItem('auth_token', token);
    },

    removeToken() {
        localStorage.removeItem('auth_token');
    },

    getUserData() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    setUserData(user) {
        localStorage.setItem('user_data', JSON.stringify(user));
    },

    clearUserData() {
        localStorage.removeItem('user_data');
    },

    isAuthenticated() {
        return !!this.getToken();
    },
};

// API Client
const API = {
    async request(endpoint, options = {}) {
        const token = TokenManager.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    TokenManager.removeToken();
                    TokenManager.clearUserData();
                    window.location.href = '/login.html';
                }
                throw new Error(data.message || data.error || 'Request failed');
            }

            // Return data directly from the new backend response format
            return data.data || data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },

    async getCurrentUser() {
        return this.request('/auth/me');
    },

    // User endpoints
    async getUsers() {
        return this.request('/users');
    },

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    async deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    },

    // Beverage endpoints
    async getBeverages(activeOnly = false) {
        const query = activeOnly ? '?active_only=true' : '';
        return this.request(`/beverages${query}`);
    },

    async getBeverage(id) {
        return this.request(`/beverages/${id}`);
    },

    async createBeverage(beverageData) {
        return this.request('/beverages', {
            method: 'POST',
            body: JSON.stringify(beverageData),
        });
    },

    async updateBeverage(id, beverageData) {
        return this.request(`/beverages/${id}`, {
            method: 'PUT',
            body: JSON.stringify(beverageData),
        });
    },

    async updateStock(id, quantity, transactionType, reason) {
        return this.request(`/beverages/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity, transaction_type: transactionType, reason }),
        });
    },

    async deleteBeverage(id) {
        return this.request(`/beverages/${id}`, { method: 'DELETE' });
    },

    async getLowStock() {
        return this.request('/beverages/alerts/low-stock');
    },

    async getOutOfStock() {
        return this.request('/beverages/alerts/out-of-stock');
    },

    // Order endpoints
    async getOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/orders?${params}`);
    },

    async getTodayOrders() {
        return this.request('/orders/today');
    },

    async getMyOrderHistory() {
        return this.request('/orders/my-history');
    },

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    },

    async fulfillOrder(id) {
        return this.request(`/orders/${id}/fulfill`, { method: 'PATCH' });
    },

    async cancelOrder(id) {
        return this.request(`/orders/${id}/cancel`, { method: 'PATCH' });
    },


    // Reports endpoints
    async getDashboardStats() {
        return this.request('/reports/dashboard');
    },

    async getConsumptionTrends(period = 'week') {
        return this.request(`/reports/consumption?period=${period}`);
    },

    async getPopularBeverages() {
        return this.request('/reports/popular');
    },

    async getInventoryStatus() {
        return this.request('/reports/inventory');
    },

    async getActivityReport() {
        return this.request('/reports/activity');
    },

    async getDailyReport(date) {
        return this.request(`/reports/daily?date=${date}`);
    },

    async getMonthlyReport(year, month) {
        return this.request(`/reports/monthly?year=${year}&month=${month}`);
    },

    async getDepartmentReport(department) {
        return this.request(`/reports/by-department?department=${encodeURIComponent(department)}`);
    },

    exportPDF(date) {
        window.open(`${API_BASE_URL}/reports/export/pdf?date=${date}`, '_blank');
    },

    exportExcel(date) {
        window.open(`${API_BASE_URL}/reports/export/excel?date=${date}`, '_blank');
    },
};

// Toast Notifications
const Toast = {
    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    info(message) {
        this.show(message, 'info');
    },
};

// Format helpers
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (date) => {
    return new Date(date).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Role redirect helper
const redirectToDashboard = (role) => {
    const dashboards = {
        admin: '/admin.html',
        employee: '/employee.html',
        office_boy: '/office-boy.html',
    };
    window.location.href = dashboards[role] || '/login.html';
};

// Check authentication and redirect if needed
const requireAuth = (allowedRoles = []) => {
    if (!TokenManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }

    const user = TokenManager.getUserData();
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        Toast.error('You do not have permission to access this page');
        redirectToDashboard(user?.role);
        return false;
    }

    return true;
};
