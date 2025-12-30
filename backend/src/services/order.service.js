/**
 * Order Service
 * Business logic for order management
 */

const orderRepository = require('../repositories/order.repository');
const beverageRepository = require('../repositories/beverage.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const { ValidationError, ConflictError } = require('../utils/error.util');
const logger = require('../utils/logger.util');
const { ORDER_STATUS } = require('../config/constants');
const socketService = require('./socket.service');

class OrderService {
    async getAllOrders(filters = {}) {
        try {
            if (filters.status) {
                return await orderRepository.findByStatus(filters.status);
            }
            if (filters.date) {
                return await orderRepository.findOrdersWithDetails({
                    where: { order_date: filters.date },
                });
            }
            return await orderRepository.findOrdersWithDetails();
        } catch (error) {
            logger.error('Error getting orders:', error);
            throw error;
        }
    }

    async getOrderById(id) {
        return await orderRepository.findById(id, {
            include: ['employee', 'beverage'],
        });
    }

    async createOrder(orderData) {
        try {
            // Check if employee can order today
            const canOrder = await orderRepository.canEmployeeOrderToday(orderData.employee_id);
            if (!canOrder) {
                throw new ConflictError('You have reached your daily order limit (3 orders per day)');
            }

            // Check beverage stock
            const beverage = await beverageRepository.findById(orderData.beverage_id);
            if (beverage.stock_quantity === 0) {
                throw new ValidationError('Beverage is out of stock');
            }

            // Create order
            const order = await orderRepository.create(orderData);
            logger.info(`Order created: ${order._id}`);

            // Get full order with details for notification
            const fullOrder = await this.getOrderById(order._id);

            // Emit real-time notification to office boys and admins
            socketService.emitNewOrder({
                _id: fullOrder._id,
                employee: fullOrder.employee_id,
                beverage: fullOrder.beverage_id,
                cup_size: fullOrder.cup_size,
                sugar_quantity: fullOrder.sugar_quantity,
                remarks: fullOrder.remarks,
                createdAt: fullOrder.createdAt,
            });

            return fullOrder;
        } catch (error) {
            if (error instanceof ConflictError || error instanceof ValidationError) throw error;
            logger.error('Error creating order:', error);
            throw error;
        }
    }

    async updateOrderStatus(id, status, userId) {
        try {
            const order = await orderRepository.findById(id);

            if (status === ORDER_STATUS.FULFILLED) {
                // Deduct stock
                await beverageRepository.updateStock(order.beverage_id, -1);

                // Log transaction
                await inventoryRepository.createOrderTransaction(
                    order.beverage_id,
                    order._id,
                    userId
                );

                // Update order
                await order.fulfill(userId);

                // Get full order details and emit notification to employee
                const fulfilledOrder = await this.getOrderById(id);
                socketService.emitOrderFulfilled({
                    _id: fulfilledOrder._id,
                    employee_id: fulfilledOrder.employee_id,
                    beverage: fulfilledOrder.beverage_id,
                    fulfilled_at: fulfilledOrder.fulfilled_at,
                });
            } else if (status === ORDER_STATUS.CANCELLED) {
                await order.cancel();

                // Emit cancellation notification
                const cancelledOrder = await this.getOrderById(id);
                socketService.emitOrderCancelled({
                    _id: cancelledOrder._id,
                    employee_id: cancelledOrder.employee_id,
                    beverage: cancelledOrder.beverage_id,
                    employee: cancelledOrder.employee_id,
                }, userId);
            }

            logger.info(`Order ${id} status updated to ${status}`);
            return await this.getOrderById(id);
        } catch (error) {
            logger.error(`Error updating order ${id}:`, error);
            throw error;
        }
    }

    async getOrdersPaginated(page, limit, filters = {}) {
        try {
            const result = await orderRepository.getOrdersPaginated(page, limit, filters);
            return {
                orders: result.rows,
                pagination: {
                    page,
                    limit,
                    totalItems: result.count,
                },
            };
        } catch (error) {
            logger.error('Error getting paginated orders:', error);
            throw error;
        }
    }

    async getTodayOrders() {
        return await orderRepository.findTodayOrders();
    }

    async getEmployeeOrders(employeeId) {
        return await orderRepository.findByEmployee(employeeId);
    }

    async getEmployeeTodayOrders(employeeId) {
        return await orderRepository.findEmployeeTodayOrders(employeeId);
    }
}

module.exports = new OrderService();
