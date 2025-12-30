/**
 * Order Repository
 * Data access layer for Order model using Mongoose
 */

const BaseRepository = require('./base.repository');
const { Order } = require('../models');

class OrderRepository extends BaseRepository {
    constructor() {
        super(Order);
    }

    /**
     * Find orders with employee and beverage details
     */
    async findOrdersWithDetails(filter = {}, options = {}) {
        return await this.model.find(filter, null, options)
            .populate('employee_id', 'id full_name email department')
            .populate('beverage_id', 'id name category');
    }

    /**
     * Find orders by status
     */
    async findByStatus(status) {
        return await this.findOrdersWithDetails({ status });
    }

    /**
     * Find orders by date range
     */
    async findByDateRange(startDate, endDate) {
        return await this.findOrdersWithDetails({
            order_date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        });
    }

    /**
     * Find orders by employee
     */
    async findByEmployee(employeeId) {
        return await this.findOrdersWithDetails({ employee_id: employeeId });
    }

    /**
     * Find today's orders for a specific employee
     */
    async findEmployeeTodayOrders(employeeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await this.findOrdersWithDetails({
            employee_id: employeeId,
            order_date: {
                $gte: today,
                $lt: tomorrow
            }
        });
    }

    /**
     * Find today's orders
     */
    async findTodayOrders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await this.findOrdersWithDetails({
            order_date: {
                $gte: today,
                $lt: tomorrow
            }
        });
    }

    /**
     * Get orders with pagination and filters
     */
    async getOrdersPaginated(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (filters.status) {
            filter.status = filters.status;
        }
        if (filters.employee_id) {
            filter.employee_id = filters.employee_id;
        }
        if (filters.date) {
            const date = new Date(filters.date);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.order_date = {
                $gte: date,
                $lt: nextDay
            };
        }
        if (filters.startDate && filters.endDate) {
            filter.order_date = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate),
            };
        }

        const [rows, count] = await Promise.all([
            this.model.find(filter)
                .populate('employee_id', 'id full_name email department')
                .populate('beverage_id', 'id name category')
                .limit(limit)
                .skip(skip)
                .sort({ order_date: -1, createdAt: -1 }),
            this.model.countDocuments(filter)
        ]);

        return { rows, count };
    }

    /**
     * Get popular beverages statistics
     */
    async getPopularBeverages(limit = 10, startDate = null, endDate = null) {
        try {
            const match = {};
            if (startDate && endDate) {
                match.order_date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            const result = await this.model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$beverage_id',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'beverages',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'beverage'
                    }
                },
                { $unwind: { path: '$beverage', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        beverage_id: '$_id',
                        count: 1,
                        'beverage.id': '$beverage._id',
                        'beverage.name': { $ifNull: ['$beverage.name', 'Unknown'] },
                        'beverage.category': { $ifNull: ['$beverage.category', 'other'] }
                    }
                }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getPopularBeverages:', error);
            return [];
        }
    }

    /**
     * Get consumption trends by date
     */
    async getConsumptionTrends(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const result = await this.model.aggregate([
                {
                    $match: {
                        order_date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$order_date',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        order_date: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getConsumptionTrends:', error);
            return [];
        }
    }

    /**
     * Get daily order count
     */
    async getDailyOrderCount(date = null) {
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        return await this.count({
            order_date: {
                $gte: targetDate,
                $lt: nextDay
            }
        });
    }

    /**
     * Check if employee can order today
     */
    async canEmployeeOrderToday(employeeId) {
        return await Order.canEmployeeOrderToday(employeeId);
    }

    /**
     * Get employee statistics with order counts and history
     */
    async getEmployeeStats() {
        try {
            const result = await this.model.aggregate([
                {
                    $group: {
                        _id: '$employee_id',
                        totalOrders: { $sum: 1 },
                        fulfilledOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
                        },
                        cancelledOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        pendingOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        lastOrderDate: { $max: '$order_date' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employee'
                    }
                },
                { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        employee_id: '$_id',
                        'employee.full_name': 1,
                        'employee.email': 1,
                        'employee.department': 1,
                        totalOrders: 1,
                        fulfilledOrders: 1,
                        cancelledOrders: 1,
                        pendingOrders: 1,
                        lastOrderDate: 1
                    }
                },
                { $sort: { totalOrders: -1 } }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getEmployeeStats:', error);
            return [];
        }
    }

    /**
     * Get top consumers (employees with most orders)
     */
    async getTopConsumers(limit = 10) {
        try {
            // Get orders from last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);

            const result = await this.model.aggregate([
                {
                    $match: {
                        order_date: { $gte: thirtyDaysAgo },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: '$employee_id',
                        orderCount: { $sum: 1 },
                        beverages: { $push: '$beverage_id' }
                    }
                },
                { $sort: { orderCount: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employee'
                    }
                },
                { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        employee_id: '$_id',
                        'employee.full_name': 1,
                        'employee.email': 1,
                        'employee.department': 1,
                        orderCount: 1
                    }
                }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getTopConsumers:', error);
            return [];
        }
    }

    /**
     * Get fast moving items (beverages that run out quickly)
     */
    async getFastMovingItems() {
        try {
            // Get orders from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const result = await this.model.aggregate([
                {
                    $match: {
                        order_date: { $gte: sevenDaysAgo },
                        status: 'fulfilled'
                    }
                },
                {
                    $group: {
                        _id: '$beverage_id',
                        orderCount: { $sum: 1 },
                        avgDailyOrders: { $avg: 1 }
                    }
                },
                { $sort: { orderCount: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'beverages',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'beverage'
                    }
                },
                { $unwind: { path: '$beverage', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        beverage_id: '$_id',
                        'beverage.name': 1,
                        'beverage.category': 1,
                        'beverage.stock_quantity': 1,
                        'beverage.min_stock_alert': 1,
                        orderCount: 1,
                        dailyAverage: { $divide: ['$orderCount', 7] }
                    }
                }
            ]);

            return result || [];
        } catch (error) {
            console.error('Error in getFastMovingItems:', error);
            return [];
        }
    }
}

module.exports = new OrderRepository();
