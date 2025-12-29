/**
 * Notification Context
 * Provides real-time WebSocket notifications throughout the app
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// Notification sound URL (using a simple beep sound)
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4, ... (truncated)';

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const audioRef = useRef(null);

    // Initialize audio for notification sounds
    useEffect(() => {
        // Create audio element for notification sound
        audioRef.current = new Audio();
        audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1pbmqJmZWDbWB0foGUl42Ac29+i5OQiYF3cnt/g4aOkIx+c3JzdHmAh4+RjIR6dHd4e4CGi5CLhoB7eXl7foGFiYqIhYJ/fHt7fH6BhIaGhYSCf317e3t8foGDhYWFg4F/fXt7e3x+gIKEhYSEgoB+fHt7e3x+gIKEhISEgoB+fHt7e32Xmo6Ac2pvbG+Cho+Ui4N7dHJ0d32EjJGNh4F7d3Z3e4CHj5CMhX99enh5e4CDioyLiIR/fXp5eXt+gYWIiYiGg398e3p5e32Ag4aHhoWDgH17enp6fH+ChIaGhYSBfnt6enp7fYCChYWFhIN/fHt6ent9gIKFhYWEgoB9e3p6e32AgYSFhYSDgH17enp6e32AgYSEhISDgH17enp7fH6BgoSEhIOAfnx7enp6fH6Bg4SEhIOAfXx6enp7fX+BgoSEg4OAfXx6enp7fX+BgoODg4OAfXx6enp7fH+Bg4ODg4KAfXx6e3t8foGCg4ODgoGAfXt7e3t9f4GCg4OCgoF/fXt7e3t9f4GCgoOCgoF/fXt7e3t8foGCgoKCgoB+fHt7e3x9f4GCgoKCgX9+fHt7fH1/gIGCgoKBgH59e3t8fH1/gIGCgoKBgH59e3t8fH5/gIGBgoGBf359e3x8fX5/gIGBgYGAfn59fHx8fX5/gIGBgYF/fn58fHx9fn+AgIGBgIB/fn18fHx9fn+AgIGBgIB/fn18fHx9fX+AgICAgIB+fn18fHx9fX6AgICAgH9+fn18fHx9fX6AgICAgH9+fn18fH19fX6AgIB/f39+fn18fH19fX5/gIB/f39+fn18fX19fX5/f4B/f35+fn18fX19fX5/f39/f35+fn19fX19fX5/f39/fn5+fX19fX19fn5/f39+fn5+fX19fX19fn5/f39+fn5+fX19fX59fn5/fn5+fn5+fX19fX59fn5/fn5+fn5+fX19fn59fn5+fn5+fn5+fX19fn59fn5+fn5+fn5+fX19fn59fn5+fn5+fn5+fX19fn59fn5+';
        return () => {
            if (audioRef.current) {
                audioRef.current = null;
            }
        };
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {
                    // Autoplay might be blocked by browser
                    console.log('Audio autoplay blocked');
                });
            }
        } catch (error) {
            console.log('Error playing notification sound:', error);
        }
    }, []);

    // Initialize socket connection when user is authenticated
    useEffect(() => {
        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        // Connect to WebSocket server
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('🔌 Connected to notification server');
            setConnected(true);
        });

        newSocket.on('connected', (data) => {
            console.log('✅ Notification service ready:', data);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('📴 Disconnected from notification server:', reason);
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            setConnected(false);
        });

        // Handle incoming notifications
        newSocket.on('notification', (notification) => {
            console.log('📬 Notification received:', notification);

            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
            setUnreadCount(prev => prev + 1);

            // Play sound
            playNotificationSound();

            // Show browser notification if permitted and window is not focused
            if (Notification.permission === 'granted' && document.hidden) {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '☕',
                    tag: notification.order?._id || Date.now().toString(),
                });
            }
        });

        setSocket(newSocket);

        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            newSocket.disconnect();
        };
    }, [user, token, playNotificationSound]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Remove a specific notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.order?._id !== id));
    }, []);

    const value = {
        socket,
        connected,
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;
