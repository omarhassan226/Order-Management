/**
 * Office Boy Dashboard Page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { Toast } from '../components/common/Toast';
import '../styles/office-boy.css';

const CUP_SIZES = {
    small: 'صغير',
    medium: 'وسط',
    large: 'كبير',
};

const SUGAR_QUANTITIES = {
    none: 'بدون سكر',
    little: 'قليل',
    medium: 'متوسط',
    much: 'كثير',
};

const OfficeBoyDashboard = () => {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fulfillingId, setFulfillingId] = useState(null);
    const lastPendingCount = useRef(0);

    const loadOrders = useCallback(async (showNewOrderNotification = false) => {
        try {
            const data = await orderAPI.getToday();
            const newOrders = data.orders || [];

            // Check for new pending orders (for notifications)
            const newPendingCount = newOrders.filter(o => o.status === 'pending').length;
            if (showNewOrderNotification && newPendingCount > lastPendingCount.current && lastPendingCount.current > 0) {
                const diff = newPendingCount - lastPendingCount.current;
                Toast.info(`🔔 لديك ${diff} طلب${diff > 1 ? 'ات' : ''} جديد${diff > 1 ? 'ة' : ''}`);

                // Browser notification
                if (Notification.permission === 'granted' && document.hidden) {
                    new Notification('🔔 طلب جديد!', {
                        body: `لديك ${diff} طلب${diff > 1 ? 'ات' : ''} جديد${diff > 1 ? 'ة' : ''}`,
                    });
                }
            }

            lastPendingCount.current = newPendingCount;
            setOrders(newOrders);
        } catch (error) {
            Toast.error('فشل تحميل الطلبات');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        loadOrders(false);

        // Poll for new orders
        const interval = setInterval(() => loadOrders(true), 30000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const fulfilledOrders = orders.filter(o => o.status === 'fulfilled');

    const handleFulfill = async (orderId) => {
        confirm('هل أنت متأكد من تنفيذ هذا الطلب؟\nسيتم خصم المشروب من المخزون تلقائياً.')


        setFulfillingId(orderId);
        try {
            await orderAPI.fulfill(orderId);
            Toast.success('تم تنفيذ الطلب بنجاح');
            loadOrders(false);
        } catch (error) {
            Toast.error(error.message || 'فشل تنفيذ الطلب');
        } finally {
            setFulfillingId(null);
        }
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div></div>;
    }

    return (
        <div className="office-boy-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="user-info">
                        <span className="user-icon">☕</span>
                        <div>
                            <h2>{user.full_name}</h2>
                            <p>مسؤول تنفيذ الطلبات</p>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={logout}>
                        تسجيل الخروج
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="stats-cards">
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <h3>{pendingOrders.length}</h3>
                        <p>طلبات قيد الانتظار</p>
                    </div>
                </div>
                <div className="stat-card fulfilled">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>{fulfilledOrders.length}</h3>
                        <p>تم تنفيذها اليوم</p>
                    </div>
                </div>
            </div>

            {/* Pending Orders */}
            <section className="orders-section">
                <h3>📋 الطلبات قيد الانتظار</h3>
                {pendingOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎉</div>
                        <p>لا توجد طلبات قيد الانتظار!</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {pendingOrders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <span className="employee-name">
                                        👤 {order.employee_id?.full_name || 'موظف'}
                                    </span>
                                    <span className="order-time">
                                        {new Date(order.createdAt).toLocaleTimeString('ar-EG', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="order-details">
                                    <h4>☕ {order.beverage_id?.name || 'مشروب'}</h4>
                                    <div className="order-specs">
                                        <span>📏 {CUP_SIZES[order.cup_size]}</span>
                                        <span>🍬 {SUGAR_QUANTITIES[order.sugar_quantity]}</span>
                                    </div>
                                    {order.remarks && (
                                        <p className="order-remarks">💬 {order.remarks}</p>
                                    )}
                                </div>

                                <button
                                    className="btn-fulfill"
                                    onClick={() => handleFulfill(order._id)}
                                    disabled={fulfillingId === order._id}
                                >
                                    {fulfillingId === order._id ? 'جاري التنفيذ...' : 'تنفيذ الطلب'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Fulfilled Orders */}
            <section className="orders-section fulfilled-section">
                <h3>✅ الطلبات المنفذة اليوم</h3>
                {fulfilledOrders.length === 0 ? (
                    <p className="empty-message">لا توجد طلبات منفذة اليوم</p>
                ) : (
                    <div className="fulfilled-list">
                        {fulfilledOrders.map(order => (
                            <div key={order._id} className="fulfilled-item">
                                <span className="employee-name">{order.employee_id?.full_name || 'موظف'}</span>
                                <span className="beverage-name">{order.beverage_id?.name || 'مشروب'}</span>
                                <span className="fulfilled-time">
                                    {order.fulfilled_at && new Date(order.fulfilled_at).toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default OfficeBoyDashboard;
