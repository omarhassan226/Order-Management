/**
 * Login Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import BackgroundSlider from '../components/BackgroundSlider';
import '../styles/login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            Toast.error('من فضلك أدخل اسم المستخدم وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const userData = await login(username, password);
            Toast.success('تم تسجيل الدخول بنجاح');

            // Use the returned userData directly instead of getDashboardPath()
            // because React state update is async and user might still be null
            const dashboardPath = userData.role === 'admin' ? '/admin' :
                userData.role === 'employee' ? '/employee' : '/office-boy';
            navigate(dashboardPath);
        } catch (error) {
            Toast.error(error.message || 'فشل تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <BackgroundSlider />
            <div className="login-card">
                <div className="login-header">
                    <div className="logo">☕</div>
                    <h1>نظام إدارة المشروبات</h1>
                    <p>قم بتسجيل الدخول للمتابعة</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">اسم المستخدم</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="أدخل اسم المستخدم"
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">كلمة المرور</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>حسابات تجريبية:</p>
                    <ul>
                        <li><strong>مدير:</strong> admin / admin123</li>
                        <li><strong>موظف:</strong> omar2 / password</li>
                        <li><strong>Office Boy:</strong> officeBoy / office123</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
