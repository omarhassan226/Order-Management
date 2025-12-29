/**
 * Protected Route Component
 * Restricts access based on authentication and roles
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = user.role === 'admin' ? '/admin' :
            user.role === 'employee' ? '/employee' : '/office-boy';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
