/**
 * Order Routes
 * Order management endpoints
 */

const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrOfficeBoy } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createOrderValidator, updateOrderStatusValidator, orderIdValidator } = require('../validators/order.validator');

const router = express.Router();

// GET /api/orders - Get all orders (admin and office boy)
router.get('/', authenticate, isAdminOrOfficeBoy, orderController.getAllOrders);

// GET /api/orders/today - Get today's orders (admin and office boy)
router.get('/today', authenticate, isAdminOrOfficeBoy, orderController.getTodayOrders);

// GET /api/orders/my-history - Get current user's order history (all authenticated users)
router.get('/my-history', authenticate, orderController.getMyOrderHistory);

// GET /api/orders/my-today - Get current user's today orders (all authenticated users)
router.get('/my-today', authenticate, orderController.getMyTodayOrders);

// GET /api/orders/:id - Get order by ID (all authenticated users)
router.get('/:id', authenticate, orderIdValidator, validate, orderController.getOrderById);

// POST /api/orders - Create order (all authenticated users)
router.post('/', authenticate, createOrderValidator, validate, orderController.createOrder);

// PUT /api/orders/:id - Update order status (admin and office boy)
router.put('/:id', authenticate, isAdminOrOfficeBoy, updateOrderStatusValidator, validate, orderController.updateOrderStatus);

// PATCH /api/orders/:id/fulfill - Fulfill order (admin and office boy)
router.patch('/:id/fulfill', authenticate, isAdminOrOfficeBoy, orderIdValidator, validate, orderController.fulfillOrder);

// PATCH /api/orders/:id/cancel - Cancel order (admin and office boy)
router.patch('/:id/cancel', authenticate, isAdminOrOfficeBoy, orderIdValidator, validate, orderController.cancelOrder);

module.exports = router;

