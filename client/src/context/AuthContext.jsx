/**
 * Auth Context
 * Manages authentication state across the application
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        const storedToken = localStorage.getItem('auth_token');

        if (userData && storedToken) {
            setUser(JSON.parse(userData));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await authAPI.login(username, password);
        const { token: newToken, user: userData } = response;

        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
        setToken(newToken);

        return userData;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setUser(null);
            setToken(null);
        }
    };

    const isAuthenticated = () => !!user;

    const hasRole = (...roles) => user && roles.includes(user.role);

    const getDashboardPath = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin': return '/admin';
            case 'employee': return '/employee';
            case 'office_boy': return '/office-boy';
            default: return '/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isAuthenticated,
            hasRole,
            getDashboardPath
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
