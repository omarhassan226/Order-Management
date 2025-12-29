/**
 * Toast Component
 * Custom toast notifications
 */

import toast from 'react-hot-toast';

export const Toast = {
    success: (message) => toast.success(message, {
        duration: 3000,
        position: 'top-center',
        style: {
            background: '#10b981',
            color: '#fff',
            fontFamily: 'Tajawal, sans-serif',
        },
    }),

    error: (message) => toast.error(message, {
        duration: 4000,
        position: 'top-center',
        style: {
            background: '#ef4444',
            color: '#fff',
            fontFamily: 'Tajawal, sans-serif',
        },
    }),

    info: (message) => toast(message, {
        duration: 3000,
        position: 'top-center',
        icon: 'ℹ️',
        style: {
            background: '#3b82f6',
            color: '#fff',
            fontFamily: 'Tajawal, sans-serif',
        },
    }),

    warning: (message) => toast(message, {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
        style: {
            background: '#f59e0b',
            color: '#fff',
            fontFamily: 'Tajawal, sans-serif',
        },
    }),
};

export default Toast;
