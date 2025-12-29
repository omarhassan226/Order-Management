/**
 * Employee Dashboard Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { beverageAPI, orderAPI } from '../services/api';
import { Toast } from '../components/common/Toast';
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
    const [beverages, setBeverages] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [remainingOrders, setRemainingOrders] = useState(MAX_ORDERS_PER_DAY);
    const [loading, setLoading] = useState(true);
    const [orderModal, setOrderModal] = useState({ open: false, beverage: null });
    const [orderForm, setOrderForm] = useState({
        cup_size: 'small',
        sugar_quantity: 'none',
        remarks: '',
    });

    const loadData = useCallback(async () => {
        try {
            const [beveragesRes, ordersRes] = await Promise.all([
                beverageAPI.getAll(true),
                orderAPI.getMyHistory(),
            ]);

            setBeverages(beveragesRes.beverages || []);
            setOrders(ordersRes.orders || []);

            // Calculate remaining orders
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = (ordersRes.orders || []).filter(
                o => o.order_date?.split('T')[0] === today && o.status !== 'cancelled'
            );
            setRemainingOrders(MAX_ORDERS_PER_DAY - todayOrders.length);
        } catch (error) {
            Toast.error('فشل تحميل البيانات');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        // Poll for order status updates
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

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
            pending: { class: 'badge-warning', text: 'قيد الانتظار' },
            fulfilled: { class: 'badge-success', text: 'تم التنفيذ' },
            cancelled: { class: 'badge-danger', text: 'ملغى' },
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
                    <button className="btn-logout" onClick={logout}>
                        تسجيل الخروج
                    </button>
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

            {/* Order History */}
            <section className="history-section">
                <h3>📋 سجل الطلبات</h3>
                {orders.length === 0 ? (
                    <p className="empty-message">لا توجد طلبات سابقة</p>
                ) : (
                    <div className="orders-list">
                        {orders.slice(0, 10).map(order => (
                            <div key={order._id} className="order-item">
                                <div className="order-info">
                                    <span className="beverage-name">{order.beverage_id?.name || 'مشروب'}</span>
                                    <span className="order-date">
                                        {new Date(order.order_date).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                                <span className={`badge ${getStatusBadge(order.status).class}`}>
                                    {getStatusBadge(order.status).text}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
        </div>
    );
};

export default EmployeeDashboard;
