/**
 * Socket.IO Service
 * Handles real-time WebSocket connections and notifications
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger.util');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // Maps socket.id to user info
    }

    /**
     * Initialize Socket.IO with the HTTP server
     */
    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        // Authentication middleware
        this.io.use(this.authenticateSocket.bind(this));

        // Connection handler
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        logger.info('🔌 Socket.IO initialized successfully');
        return this.io;
    }

    /**
     * Authenticate socket connection using JWT token
     */
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            socket.userName = decoded.full_name || decoded.username;

            next();
        } catch (error) {
            logger.error('Socket authentication error:', error.message);
            next(new Error('Invalid token'));
        }
    }

    /**
     * Handle new socket connection
     */
    handleConnection(socket) {
        logger.info(`📱 User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`);

        // Store user info
        this.connectedUsers.set(socket.id, {
            id: socket.userId,
            role: socket.userRole,
            name: socket.userName,
        });

        // Join role-based rooms for targeted notifications
        if (socket.userRole === 'admin') {
            socket.join('admins');
            socket.join('office_boys'); // Admin also receives office boy notifications
            logger.info(`👑 Admin ${socket.userName} joined 'admins' and 'office_boys' rooms`);
        } else if (socket.userRole === 'office_boy') {
            socket.join('office_boys');
            logger.info(`☕ Office Boy ${socket.userName} joined 'office_boys' room`);
        } else if (socket.userRole === 'employee') {
            // Employees join their own room for personal notifications
            socket.join(`user_${socket.userId}`);
            logger.info(`👤 Employee ${socket.userName} joined personal room`);
        }

        // Send connection confirmation
        socket.emit('connected', {
            message: 'Connected to notification service',
            userId: socket.userId,
            role: socket.userRole,
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            logger.info(`📴 User disconnected: ${socket.userName}`);
            this.connectedUsers.delete(socket.id);
        });

        // Handle manual room join (for re-joins)
        socket.on('join_room', (room) => {
            socket.join(room);
            logger.info(`User ${socket.userName} joined room: ${room}`);
        });
    }

    /**
     * Emit new order notification to office boys and admins
     */
    emitNewOrder(order) {
        if (!this.io) return;

        const notification = {
            type: 'new_order',
            title: '🔔 طلب جديد!',
            message: `${order.employee?.full_name || 'موظف'} طلب ${order.beverage?.name || 'مشروب'}`,
            order: {
                _id: order._id,
                employee_name: order.employee?.full_name,
                beverage_name: order.beverage?.name,
                cup_size: order.cup_size,
                sugar_quantity: order.sugar_quantity,
                remarks: order.remarks,
                createdAt: order.createdAt,
            },
            timestamp: new Date().toISOString(),
        };

        // Send to office boys and admins
        this.io.to('office_boys').emit('notification', notification);
        logger.info(`📤 New order notification sent to office_boys room`);
    }

    /**
     * Emit order fulfilled notification to the employee
     */
    emitOrderFulfilled(order) {
        if (!this.io) return;

        const employeeId = order.employee_id?._id || order.employee_id;

        const notification = {
            type: 'order_fulfilled',
            title: '✅ تم تنفيذ طلبك!',
            message: `طلبك ${order.beverage?.name || 'المشروب'} جاهز الآن`,
            order: {
                _id: order._id,
                beverage_name: order.beverage?.name,
                fulfilled_at: order.fulfilled_at,
            },
            timestamp: new Date().toISOString(),
        };

        // Send to the specific employee
        this.io.to(`user_${employeeId}`).emit('notification', notification);
        logger.info(`📤 Order fulfilled notification sent to employee: ${employeeId}`);
    }

    /**
     * Emit order cancelled notification
     */
    emitOrderCancelled(order, cancelledBy) {
        if (!this.io) return;

        const employeeId = order.employee_id?._id || order.employee_id;

        const notification = {
            type: 'order_cancelled',
            title: '❌ تم إلغاء طلب',
            message: `تم إلغاء طلب ${order.beverage?.name || 'المشروب'}`,
            order: {
                _id: order._id,
                beverage_name: order.beverage?.name,
            },
            timestamp: new Date().toISOString(),
        };

        // Send to employee who made the order
        this.io.to(`user_${employeeId}`).emit('notification', notification);

        // Also notify office boys if cancelled by someone else
        if (cancelledBy !== employeeId) {
            this.io.to('office_boys').emit('notification', {
                ...notification,
                title: '❌ تم إلغاء طلب',
                message: `${order.employee?.full_name || 'موظف'} ألغى طلبه`,
            });
        }
    }

    /**
     * Emit low stock alert to admins
     */
    emitLowStockAlert(beverage) {
        if (!this.io) return;

        const notification = {
            type: 'low_stock',
            title: '⚠️ تنبيه المخزون!',
            message: `المخزون منخفض: ${beverage.name} (${beverage.current_stock} متبقي)`,
            beverage: {
                _id: beverage._id,
                name: beverage.name,
                current_stock: beverage.current_stock,
                min_stock: beverage.min_stock,
            },
            timestamp: new Date().toISOString(),
        };

        this.io.to('admins').emit('notification', notification);
        logger.info(`📤 Low stock alert sent to admins: ${beverage.name}`);
    }

    /**
     * Get count of connected users by role
     */
    getConnectedUsersByRole(role) {
        let count = 0;
        this.connectedUsers.forEach(user => {
            if (user.role === role) count++;
        });
        return count;
    }

    /**
     * Get instance of Socket.IO
     */
    getIO() {
        return this.io;
    }
}

// Export singleton instance
module.exports = new SocketService();
