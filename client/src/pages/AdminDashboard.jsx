/**
 * Admin Dashboard Page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { reportAPI, beverageAPI, orderAPI, userAPI } from '../services/api';
import { Toast } from '../components/common/Toast';
import NotificationPanel from '../components/common/NotificationPanel';
import '../styles/admin.css';

const TABS = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: '📊' },
    { id: 'beverages', label: 'إدارة المشروبات', icon: '☕' },
    { id: 'orders', label: 'إدارة الطلبات', icon: '📋' },
    { id: 'users', label: 'إدارة المستخدمين', icon: '👥' },
    { id: 'reports', label: 'التقارير', icon: '📈' },
];

const CATEGORIES = {
    coffee: 'قهوة',
    tea: 'شاي',
    juice: 'عصير',
    other: 'أخرى',
};

const ROLES = {
    admin: 'مدير',
    employee: 'موظف',
    office_boy: 'Office Boy',
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { notifications } = useNotifications();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const lastNotificationRef = useRef(null);

    // Close sidebar when tab changes on mobile
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSidebarOpen(false);
    };

    // Dashboard state
    const [stats, setStats] = useState({ dailyOrdersCount: 0, lowStockCount: 0, outOfStockCount: 0, totalBeverages: 0 });
    const [popularBeverages, setPopularBeverages] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);

    // Beverages state
    const [beverages, setBeverages] = useState([]);
    const [beverageModal, setBeverageModal] = useState({ open: false, beverage: null });

    // Orders state
    const [orders, setOrders] = useState([]);

    // Users state
    const [users, setUsers] = useState([]);
    const [userModal, setUserModal] = useState({ open: false, user: null });

    // Load dashboard data
    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, popularRes, inventoryRes] = await Promise.allSettled([
                reportAPI.getDashboardStats(),
                reportAPI.getPopularBeverages(),
                reportAPI.getInventoryStatus(),
            ]);

            if (statsRes.status === 'fulfilled') setStats(statsRes.value);
            if (popularRes.status === 'fulfilled') setPopularBeverages(popularRes.value.popularBeverages || []);
            if (inventoryRes.status === 'fulfilled') setInventoryData(inventoryRes.value.inventoryData || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load beverages
    const loadBeverages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await beverageAPI.getAll();
            setBeverages(res.beverages || []);
        } catch (error) {
            Toast.error('فشل تحميل المشروبات');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load orders
    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getToday();
            setOrders(res.orders || []);
        } catch (error) {
            Toast.error('فشل تحميل الطلبات');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load users
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userAPI.getAll();
            setUsers(res.users || []);
        } catch (error) {
            Toast.error('فشل تحميل المستخدمين');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        switch (activeTab) {
            case 'dashboard': loadDashboard(); break;
            case 'beverages': loadBeverages(); break;
            case 'orders': loadOrders(); break;
            case 'users': loadUsers(); break;
            default: break;
        }
    }, [activeTab, loadDashboard, loadBeverages, loadOrders, loadUsers]);

    // Auto-refresh when new order notifications arrive
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            if (lastNotificationRef.current !== latestNotification.timestamp &&
                (latestNotification.type === 'new_order' ||
                    latestNotification.type === 'order_fulfilled' ||
                    latestNotification.type === 'order_cancelled')) {
                lastNotificationRef.current = latestNotification.timestamp;
                // Refresh current tab data
                if (activeTab === 'orders') loadOrders();
                if (activeTab === 'dashboard') loadDashboard();
            }
        }
    }, [notifications, activeTab, loadOrders, loadDashboard]);

    // Beverage handlers
    const handleSaveBeverage = async (formData) => {
        try {
            if (beverageModal.beverage) {
                await beverageAPI.update(beverageModal.beverage._id, formData);
                Toast.success('تم تحديث المشروب بنجاح');
            } else {
                await beverageAPI.create(formData);
                Toast.success('تم إضافة المشروب بنجاح');
            }
            setBeverageModal({ open: false, beverage: null });
            loadBeverages();
        } catch (error) {
            Toast.error(error.message || 'فشلت العملية');
        }
    };

    const handleDeleteBeverage = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المشروب؟')) return;
        try {
            await beverageAPI.delete(id);
            Toast.success('تم حذف المشروب');
            loadBeverages();
        } catch (error) {
            Toast.error(error.message || 'فشل الحذف');
        }
    };

    // User handlers
    const handleSaveUser = async (formData) => {
        try {
            if (userModal.user) {
                await userAPI.update(userModal.user._id, formData);
                Toast.success('تم تحديث المستخدم بنجاح');
            } else {
                await userAPI.create(formData);
                Toast.success('تم إضافة المستخدم بنجاح');
            }
            setUserModal({ open: false, user: null });
            loadUsers();
        } catch (error) {
            Toast.error(error.message || 'فشلت العملية');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await userAPI.delete(id);
            Toast.success('تم حذف المستخدم');
            loadUsers();
        } catch (error) {
            Toast.error(error.message || 'فشل الحذف');
        }
    };

    // Order handlers
    const handleFulfillOrder = async (id) => {
        try {
            await orderAPI.fulfill(id);
            Toast.success('تم تنفيذ الطلب');
            loadOrders();
        } catch (error) {
            Toast.error(error.message || 'فشل تنفيذ الطلب');
        }
    };

    const handleCancelOrder = async (id) => {
        if (!window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
        try {
            await orderAPI.cancel(id);
            Toast.success('تم إلغاء الطلب');
            loadOrders();
        } catch (error) {
            Toast.error(error.message || 'فشل إلغاء الطلب');
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Mobile Header with Hamburger */}
            <header className="mobile-header">
                <button
                    className="hamburger-btn"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="فتح القائمة"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
                <h1 className="mobile-title">☕ لوحة التحكم</h1>
                <div className="mobile-user">👤</div>
            </header>

            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span className="logo">☕</span>
                    <h2>لوحة التحكم</h2>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="إغلاق القائمة"
                    >
                        ✕
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <span className="nav-icon">{tab.icon}</span>
                            <span className="nav-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <span>👤 {user.full_name}</span>
                        {/* <NotificationPanel /> */}
                    </div>
                    <button className="btn-logout" onClick={logout}>خروج</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="tab-content">
                        <h2>📊 لوحة المعلومات</h2>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">☕</div>
                                <div className="stat-value">{inventoryData.length || stats.totalBeverages}</div>
                                <div className="stat-label">إجمالي المشروبات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📋</div>
                                <div className="stat-value">{stats.dailyOrdersCount}</div>
                                <div className="stat-label">طلبات اليوم</div>
                            </div>
                            <div className="stat-card warning">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-value">{stats.lowStockCount}</div>
                                <div className="stat-label">مخزون منخفض</div>
                            </div>
                            <div className="stat-card danger">
                                <div className="stat-icon">🚫</div>
                                <div className="stat-value">{stats.outOfStockCount}</div>
                                <div className="stat-label">غير متوفر</div>
                            </div>
                        </div>

                        <div className="charts-row">
                            <div className="chart-card">
                                <h3>🏆 المشروبات الأكثر طلباً</h3>
                                <div className="popular-list">
                                    {popularBeverages.length === 0 ? (
                                        <p className="empty-message">لا توجد بيانات</p>
                                    ) : (
                                        popularBeverages.map((item, index) => (
                                            <div key={index} className="popular-item">
                                                <span className="rank">#{index + 1}</span>
                                                <span className="name">{item.beverage?.name || 'مشروب'}</span>
                                                <span className="count">{item.count} طلب</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>📦 حالة المخزون</h3>
                                <div className="inventory-list">
                                    {inventoryData.slice(0, 5).map(item => (
                                        <div key={item._id} className="inventory-item">
                                            <span className="name">{item.name}</span>
                                            <span className={`stock ${item.stock_quantity <= item.min_stock_alert ? 'low' : ''}`}>
                                                {item.stock_quantity} {item.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Beverages Tab */}
                {activeTab === 'beverages' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>☕ إدارة المشروبات</h2>
                            <button className="btn-primary" onClick={() => setBeverageModal({ open: true, beverage: null })}>
                                + إضافة مشروب
                            </button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>الفئة</th>
                                        <th>المخزون</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beverages.map(beverage => (
                                        <tr key={beverage._id}>
                                            <td>{beverage.name}</td>
                                            <td>{CATEGORIES[beverage.category]}</td>
                                            <td>{beverage.stock_quantity} {beverage.unit}</td>
                                            <td>
                                                <span className={`badge ${beverage.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                    {beverage.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-sm btn-edit" onClick={() => setBeverageModal({ open: true, beverage })}>
                                                    تعديل
                                                </button>
                                                <button className="btn-sm btn-delete" onClick={() => handleDeleteBeverage(beverage._id)}>
                                                    حذف
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>📋 طلبات اليوم</h2>
                            <button className="btn-secondary" onClick={loadOrders}>🔄 تحديث</button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>المشروب</th>
                                        <th>الحجم</th>
                                        <th>الحالة</th>
                                        <th>الوقت</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.employee_id?.full_name || 'موظف'}</td>
                                            <td>{order.beverage_id?.name || 'مشروب'}</td>
                                            <td>{order.cup_size}</td>
                                            <td>
                                                <span className={`badge badge-${order.status === 'fulfilled' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                                                    {order.status === 'fulfilled' ? 'منفذ' : order.status === 'cancelled' ? 'ملغى' : 'قيد الانتظار'}
                                                </span>
                                            </td>
                                            <td>{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button className="btn-sm btn-success" onClick={() => handleFulfillOrder(order._id)}>تنفيذ</button>
                                                        <button className="btn-sm btn-danger" onClick={() => handleCancelOrder(order._id)}>إلغاء</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>👥 إدارة المستخدمين</h2>
                            <button className="btn-primary" onClick={() => setUserModal({ open: true, user: null })}>
                                + إضافة مستخدم
                            </button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>اسم المستخدم</th>
                                        <th>البريد</th>
                                        <th>الدور</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td>{u.full_name}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{ROLES[u.role]}</td>
                                            <td>
                                                <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                    {u.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-sm btn-edit" onClick={() => setUserModal({ open: true, user: u })}>
                                                    تعديل
                                                </button>
                                                <button className="btn-sm btn-delete" onClick={() => handleDeleteUser(u._id)}>
                                                    حذف
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="tab-content">
                        <h2>📈 التقارير</h2>

                        <div className="reports-grid">
                            <div className="report-card">
                                <h3>📄 تصدير تقرير اليوم</h3>
                                <p>تصدير تقرير شامل بجميع طلبات اليوم</p>
                                <div className="report-actions">
                                    <a
                                        href={reportAPI.exportPDF(new Date().toISOString().split('T')[0])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary"
                                    >
                                        📥 تحميل PDF
                                    </a>
                                    <a
                                        href={reportAPI.exportExcel(new Date().toISOString().split('T')[0])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary"
                                    >
                                        📊 تحميل Excel
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Beverage Modal */}
            {beverageModal.open && (
                <BeverageModal
                    beverage={beverageModal.beverage}
                    onClose={() => setBeverageModal({ open: false, beverage: null })}
                    onSave={handleSaveBeverage}
                />
            )}

            {/* User Modal */}
            {userModal.open && (
                <UserModal
                    user={userModal.user}
                    onClose={() => setUserModal({ open: false, user: null })}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

// Beverage Modal Component
const BeverageModal = ({ beverage, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: beverage?.name || '',
        category: beverage?.category || 'coffee',
        description: beverage?.description || '',
        stock_quantity: beverage?.stock_quantity || 0,
        min_stock_alert: beverage?.min_stock_alert || 10,
        is_active: beverage?.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{beverage ? 'تعديل مشروب' : 'إضافة مشروب'}</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>اسم المشروب</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>الفئة</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>الكمية</label>
                            <input
                                type="number"
                                value={formData.stock_quantity}
                                onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>حد التنبيه</label>
                            <input
                                type="number"
                                value={formData.min_stock_alert}
                                onChange={e => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value) || 0 })}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            نشط
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
                        <button type="submit" className="btn-primary">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// User Modal Component
const UserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'employee',
        department: user?.department || '',
        is_active: user?.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = { ...formData };
        if (!dataToSend.password) delete dataToSend.password;
        onSave(dataToSend);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{user ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>الاسم الكامل</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>اسم المستخدم</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>كلمة المرور {user && '(اتركها فارغة للاحتفاظ بالحالية)'}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!user}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>الدور</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                {Object.entries(ROLES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>القسم</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            نشط
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
                        <button type="submit" className="btn-primary">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
