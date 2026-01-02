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
    
    // New endpoints for enhanced reporting
    getEmployeeActivity: (days = 30) => api.get(`/reports/employee-activity?days=${days}`),
    getDailyLoginStats: (days = 30) => api.get(`/reports/daily-logins?days=${days}`),
    getOnlineUsers: () => api.get('/reports/online-users'),
    getStockFlow: (beverageId = null, days = 30) => {
        const params = new URLSearchParams({ days: days.toString() });
        if (beverageId) params.append('beverage_id', beverageId);
        return api.get(`/reports/stock-flow?${params.toString()}`);
    },
    getInventoryTurnover: (days = 30) => api.get(`/reports/inventory-turnover?days=${days}`),
    getComprehensiveAnalytics: (days = 30) => api.get(`/reports/analytics?days=${days}`),
    
    // Export methods
    exportPDF: (date) => `${EXPORT_BASE_URL}/reports/export/pdf?date=${date}`,
    exportExcel: (date) => `${EXPORT_BASE_URL}/reports/export/excel?date=${date}`,
};

// Rating endpoints
export const ratingAPI = {
    // Submit or update rating
    upsertRating: (ratingData) => api.post('/ratings', ratingData),

    // Get my rating for a beverage
    getMyRating: (beverageId) => api.get(`/ratings/beverage/${beverageId}/my-rating`),

    // Get all ratings for a beverage
    getBeverageRatings: (beverageId) => api.get(`/ratings/beverage/${beverageId}`),

    // Get my all ratings
    getMyRatings: () => api.get('/ratings/my-ratings'),

    // Delete my rating
    deleteRating: (beverageId) => api.delete(`/ratings/beverage/${beverageId}`),

    // Get top rated beverages
    getTopRated: (limit = 10) => api.get(`/ratings/top-rated?limit=${limit}`),

    // Get rating statistics
    getStatistics: () => api.get('/ratings/statistics'),

    // Get beverage with rating info
    getBeverageWithRating: (beverageId) => api.get(`/ratings/beverage/${beverageId}/details`),
};

// Favorite endpoints
export const favoriteAPI = {
    // Get my favorites
    getMyFavorites: () => api.get('/favorites'),

    // Toggle favorite
    toggleFavorite: (beverageId) => api.post('/favorites/toggle', { beverageId }),

    // Add to favorites
    addFavorite: (beverageId) => api.post('/favorites', { beverageId }),

    // Remove from favorites
    removeFavorite: (beverageId) => api.delete(`/favorites/${beverageId}`),

    // Check if favorited
    checkFavoriteStatus: (beverageId) => api.get(`/favorites/check/${beverageId}`),

    // Get favorites count
    getFavoritesCount: () => api.get('/favorites/count'),

    // Get favorite beverage IDs
    getFavoriteBeverageIds: () => api.get('/favorites/beverage-ids'),

    // Get most favorited
    getMostFavorited: (limit = 10) => api.get(`/favorites/most-favorited?limit=${limit}`),
};

export default api;
