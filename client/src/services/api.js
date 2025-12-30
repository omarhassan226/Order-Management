/**
 * API Service
 * Handles all API calls to the backend
 */

import axios from 'axios';
import { VITE_API_URL } from '../environment/development';

// Use proxy in development, direct URL in production
const API_BASE_URL = `${VITE_API_URL}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response.data.data || response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        throw error.response?.data || error;
    }
);

// Auth endpoints
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

// User endpoints
export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
};

// Beverage endpoints
export const beverageAPI = {
    getAll: (activeOnly = false) => api.get(`/beverages${activeOnly ? '?active_only=true' : ''}`),
    getById: (id) => api.get(`/beverages/${id}`),
    create: (data) => api.post('/beverages', data),
    update: (id, data) => api.put(`/beverages/${id}`, data),
    updateStock: (id, quantity, transactionType, reason) =>
        api.patch(`/beverages/${id}/stock`, { quantity, transaction_type: transactionType, reason }),
    delete: (id) => api.delete(`/beverages/${id}`),
    getLowStock: () => api.get('/beverages/alerts/low-stock'),
    getOutOfStock: () => api.get('/beverages/alerts/out-of-stock'),
};

// Order endpoints
export const orderAPI = {
    getAll: (filters = {}) => api.get('/orders', { params: filters }),
    getToday: () => api.get('/orders/today'),
    getMyHistory: () => api.get('/orders/my-history'),
    getMyToday: () => api.get('/orders/my-today'),
    create: (orderData) => api.post('/orders', orderData),
    fulfill: (id) => api.patch(`/orders/${id}/fulfill`),
    cancel: (id) => api.patch(`/orders/${id}/cancel`),
};

// Report endpoints
const EXPORT_BASE_URL = 'http://localhost:3000/api'; // Full URL for exports (new window)
export const reportAPI = {
    getDashboardStats: () => api.get('/reports/dashboard'),
    getPopularBeverages: () => api.get('/reports/popular'),
    getInventoryStatus: () => api.get('/reports/inventory'),
    getConsumptionTrends: (period = 'week') => api.get(`/reports/consumption?period=${period}`),
    getEmployeeStats: () => api.get('/reports/employee-stats'),
    getTopConsumers: (limit = 10) => api.get(`/reports/top-consumers?limit=${limit}`),
    getFastMovingItems: () => api.get('/reports/fast-moving'),
    exportPDF: (date) => `${EXPORT_BASE_URL}/reports/export/pdf?date=${date}`,
    exportExcel: (date) => `${EXPORT_BASE_URL}/reports/export/excel?date=${date}`,
};

export default api;
