/**
 * Notification Panel Component
 * Displays real-time notifications with beautiful UI
 */

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
    const {
        notifications,
        unreadCount,
        connected,
        markAllAsRead,
        clearNotifications,
        removeNotification
    } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Toggle panel
    const togglePanel = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };

    // Format time
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;

        return date.toLocaleDateString('ar-EG');
    };

    // Get notification icon
    const getIcon = (type) => {
        switch (type) {
            case 'new_order': return '🔔';
            case 'order_fulfilled': return '✅';
            case 'order_cancelled': return '❌';
            case 'low_stock': return '⚠️';
            default: return '📬';
        }
    };

    // Get notification color class
    const getColorClass = (type) => {
        switch (type) {
            case 'new_order': return 'notification-new';
            case 'order_fulfilled': return 'notification-success';
            case 'order_cancelled': return 'notification-error';
            case 'low_stock': return 'notification-warning';
            default: return '';
        }
    };

    return (
        <div className="notification-container" ref={panelRef}>
            {/* Bell Icon with Badge */}
            <button
                className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={togglePanel}
                aria-label="الإشعارات"
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="notification-panel">
                    <div className="panel-header">
                        <h3>الإشعارات</h3>
                        <div className="header-actions">
                            {notifications.length > 0 && (
                                <button
                                    className="clear-btn"
                                    onClick={clearNotifications}
                                    title="مسح الكل"
                                >
                                    🗑️
                                </button>
                            )}
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="panel-body">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">
                                <span className="empty-icon">🔕</span>
                                <p>لا توجد إشعارات</p>
                            </div>
                        ) : (
                            <div className="notification-list">
                                {notifications.map((notification, index) => (
                                    <div
                                        key={notification.order?._id || index}
                                        className={`notification-item ${getColorClass(notification.type)}`}
                                    >
                                        <div className="notification-icon">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <p className="notification-title">
                                                {notification.title}
                                            </p>
                                            <p className="notification-message">
                                                {notification.message}
                                            </p>
                                            {notification.order && (
                                                <div className="notification-details">
                                                    {notification.order.beverage_name && (
                                                        <span>☕ {notification.order.beverage_name}</span>
                                                    )}
                                                    {notification.order.cup_size && (
                                                        <span>📏 {notification.order.cup_size}</span>
                                                    )}
                                                </div>
                                            )}
                                            <span className="notification-time">
                                                {formatTime(notification.timestamp)}
                                            </span>
                                        </div>
                                        <button
                                            className="dismiss-btn"
                                            onClick={() => removeNotification(notification.order?._id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="panel-footer">
                        <span className={`status ${connected ? 'online' : 'offline'}`}>
                            {connected ? '● متصل' : '○ غير متصل'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
