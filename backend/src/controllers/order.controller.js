/**
 * Order Controller
 * Handles order management requests
 */

const orderService = require('../services/order.service');
const response = require('../utils/response.util');

class OrderController {
    async getAllOrders(req, res, next) {
        try {
            const orders = await orderService.getAllOrders(req.query);
            return response.success(res, { orders }, 'Orders retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            return response.success(res, { order }, 'Order retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createOrder(req, res, next) {
        try {
            // Add employee_id from authenticated user
            const orderData = {
                ...req.body,
                employee_id: req.userId,
            };
            const order = await orderService.createOrder(orderData);
            return response.created(res, { order }, 'Order created successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const order = await orderService.updateOrderStatus(
                req.params.id,
                req.body.status,
                req.userId
            );
            return response.success(res, { order }, 'Order status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async fulfillOrder(req, res, next) {
        try {
            const order = await orderService.updateOrderStatus(
                req.params.id,
                'fulfilled',
                req.userId
            );
            return response.success(res, { order }, 'Order fulfilled successfully');
        } catch (error) {
            next(error);
        }
    }

    async cancelOrder(req, res, next) {
        try {
            const order = await orderService.updateOrderStatus(
                req.params.id,
                'cancelled',
                req.userId
            );
            return response.success(res, { order }, 'Order cancelled successfully');
        } catch (error) {
            next(error);
        }
    }

    async getTodayOrders(req, res, next) {
        try {
            const orders = await orderService.getTodayOrders();
            return response.success(res, { orders }, 'Today orders retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMyOrderHistory(req, res, next) {
        try {
            const orders = await orderService.getEmployeeOrders(req.userId);
            return response.success(res, { orders }, 'Order history retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMyTodayOrders(req, res, next) {
        try {
            const orders = await orderService.getEmployeeTodayOrders(req.userId);
            return response.success(res, { orders }, 'Today orders retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();

