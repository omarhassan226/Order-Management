/**
 * Employee Dashboard Page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { beverageAPI, orderAPI } from '../services/api';
import { Toast } from '../components/common/Toast';
import NotificationPanel from '../components/common/NotificationPanel';
import '../styles/employee.css';

const CATEGORIES = {
    all: 'الكل',
    coffee: 'قهوة',
    tea: 'شاي',
    juice: 'عصير',
    other: 'أخرى',
};

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

const MAX_ORDERS_PER_DAY = 3;

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const { notifications } = useNotifications();
    const [beverages, setBeverages] = useState([]);
    const [todayOrders, setTodayOrders] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [remainingOrders, setRemainingOrders] = useState(MAX_ORDERS_PER_DAY);
    const [loading, setLoading] = useState(true);
    const [orderModal, setOrderModal] = useState({ open: false, beverage: null });
    const [historyModal, setHistoryModal] = useState(false);
    const lastNotificationRef = useRef(null);
    const [orderForm, setOrderForm] = useState({
        cup_size: 'small',
        sugar_quantity: 'none',
        remarks: '',
    });

    const loadData = useCallback(async () => {
        try {
            const [beveragesRes, todayOrdersRes] = await Promise.all([
                beverageAPI.getAll(true),
                orderAPI.getMyToday(),
            ]);

            setBeverages(beveragesRes.beverages || []);
            setTodayOrders(todayOrdersRes.orders || []);

            // Calculate remaining orders from today's orders
            const activeOrders = (todayOrdersRes.orders || []).filter(
                o => o.status !== 'cancelled'
            );
            setRemainingOrders(MAX_ORDERS_PER_DAY - activeOrders.length);
        } catch (error) {
            Toast.error('فشل تحميل البيانات');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh when order status changes (fulfilled/cancelled)
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            if (lastNotificationRef.current !== latestNotification.timestamp &&
                (latestNotification.type === 'order_fulfilled' ||
                    latestNotification.type === 'order_cancelled')) {
                lastNotificationRef.current = latestNotification.timestamp;
                loadData();
            }
        }
    }, [notifications, loadData]);

    const filteredBeverages = beverages.filter(
        b => selectedCategory === 'all' || b.category === selectedCategory
    );

    const openOrderModal = (beverage) => {
        if (remainingOrders <= 0) {
            Toast.warning('لقد استنفذت جميع طلباتك اليوم (3 طلبات)');
            return;
        }
        if (beverage.stock_quantity === 0) {
            Toast.error('هذا المشروب غير متوفر حالياً');
            return;
        }
        setOrderModal({ open: true, beverage });
    };

    const closeOrderModal = () => {
        setOrderModal({ open: false, beverage: null });
        setOrderForm({ cup_size: 'small', sugar_quantity: 'none', remarks: '' });
    };

    const handleOrder = async () => {
        try {
            await orderAPI.create({
                beverage_id: orderModal.beverage._id,
                ...orderForm,
            });
            Toast.success('تم إرسال طلبك بنجاح!');
            closeOrderModal();
            loadData();
        } catch (error) {
            Toast.error(error.message || 'فشل إرسال الطلب');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: 'قيد الانتظار', icon: '⏳' },
            fulfilled: { class: 'badge-success', text: 'تم التنفيذ', icon: '✅' },
            cancelled: { class: 'badge-danger', text: 'ملغى', icon: '❌' },
        };
        return badges[status] || badges.pending;
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div></div>;
    }

    return (
        <div className="employee-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="user-info">
                        <span className="user-icon">👤</span>
                        <div>
                            <h2>{user.full_name}</h2>
                            <p>{user.department || 'لا يوجد قسم'}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-history"
                            onClick={() => setHistoryModal(true)}
                        >
                            📋 طلباتي اليوم ({todayOrders.length})
                        </button>
                        <button className="btn-logout" onClick={logout}>
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </header>

            {/* Order Status */}
            <div className={`order-status ${remainingOrders > 0 ? 'status-success' : 'status-warning'}`}>
                {remainingOrders > 0
                    ? `يمكنك طلب ${remainingOrders} مشروب${remainingOrders > 1 ? 'ات' : ''} اليوم`
                    : 'لقد استنفذت جميع طلباتك اليوم (3 طلبات)'
                }
            </div>

            {/* Category Filter */}
            <div className="category-filter">
                {Object.entries(CATEGORIES).map(([key, label]) => (
                    <button
                        key={key}
                        className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Beverages Grid */}
            <section className="beverages-section">
                <h3>🍵 المشروبات المتاحة</h3>
                <div className="beverages-grid">
                    {filteredBeverages.map(beverage => (
                        <div
                            key={beverage._id}
                            className={`beverage-card ${beverage.stock_quantity === 0 ? 'out-of-stock' : ''}`}
                            onClick={() => openOrderModal(beverage)}
                        >
                            <div className="beverage-icon">☕</div>
                            <h4>{beverage.name}</h4>
                            <p className="category-tag">{CATEGORIES[beverage.category]}</p>
                            {beverage.stock_quantity === 0 && (
                                <span className="stock-badge out">غير متوفر</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Order Modal */}
            {orderModal.open && (
                <div className="modal-overlay" onClick={closeOrderModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>طلب {orderModal.beverage?.name}</h3>
                            <button className="btn-close" onClick={closeOrderModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>حجم الكوب</label>
                                <select
                                    value={orderForm.cup_size}
                                    onChange={e => setOrderForm({ ...orderForm, cup_size: e.target.value })}
                                >
                                    {Object.entries(CUP_SIZES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>كمية السكر</label>
                                <select
                                    value={orderForm.sugar_quantity}
                                    onChange={e => setOrderForm({ ...orderForm, sugar_quantity: e.target.value })}
                                >
                                    {Object.entries(SUGAR_QUANTITIES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>ملاحظات</label>
                                <textarea
                                    value={orderForm.remarks}
                                    onChange={e => setOrderForm({ ...orderForm, remarks: e.target.value })}
                                    placeholder="أي ملاحظات إضافية..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeOrderModal}>إلغاء</button>
                            <button className="btn-primary" onClick={handleOrder}>تأكيد الطلب</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModal && (
                <div className="modal-overlay" onClick={() => setHistoryModal(false)}>
                    <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📋 طلباتي اليوم</h3>
                            <button className="btn-close" onClick={() => setHistoryModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {todayOrders.length === 0 ? (
                                <div className="empty-orders">
                                    <span className="empty-icon">📭</span>
                                    <p>لم تقم بأي طلبات اليوم</p>
                                </div>
                            ) : (
                                <div className="orders-timeline">
                                    {todayOrders.map(order => {
                                        const statusInfo = getStatusBadge(order.status);
                                        return (
                                            <div key={order._id} className={`timeline-item ${order.status}`}>
                                                <div className="timeline-icon">{statusInfo.icon}</div>
                                                <div className="timeline-content">
                                                    <div className="order-header">
                                                        <span className="beverage-name">{order.beverage_id?.name || 'مشروب'}</span>
                                                        <span className={`badge ${statusInfo.class}`}>
                                                            {statusInfo.text}
                                                        </span>
                                                    </div>
                                                    <div className="order-details">
                                                        <span>🥤 {CUP_SIZES[order.cup_size] || order.cup_size}</span>
                                                        <span>🍬 {SUGAR_QUANTITIES[order.sugar_quantity] || order.sugar_quantity}</span>
                                                    </div>
                                                    <div className="order-time">
                                                        {new Date(order.createdAt).toLocaleTimeString('ar-EG', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                    {order.remarks && (
                                                        <div className="order-remarks">
                                                            💬 {order.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <div className="orders-summary">
                                <span>إجمالي الطلبات: {todayOrders.length}</span>
                                <span className="remaining">
                                    المتبقي: {remainingOrders} من {MAX_ORDERS_PER_DAY}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
