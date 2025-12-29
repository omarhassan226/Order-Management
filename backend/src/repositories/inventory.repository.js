/**
 * Inventory Transaction Repository
 * Data access layer for InventoryTransaction model using Mongoose
 */

const BaseRepository = require('./base.repository');
const { InventoryTransaction } = require('../models');

class InventoryTransactionRepository extends BaseRepository {
    constructor() {
        super(InventoryTransaction);
    }

    /**
     * Find transactions with details
     */
    async findTransactionsWithDetails(filter = {}, options = {}) {
        return await this.model.find(filter, null, options)
            .populate('beverage_id', 'id name')
            .populate('performed_by', 'id full_name');
    }

    /**
     * Find transactions by beverage
     */
    async findByBeverage(beverageId) {
        return await this.findTransactionsWithDetails(
            { beverage_id: beverageId },
            { sort: { createdAt: -1 } }
        );
    }

    /**
     * Find transactions by type
     */
    async findByType(transactionType) {
        return await this.findTransactionsWithDetails(
            { transaction_type: transactionType },
            { sort: { createdAt: -1 } }
        );
    }

    /**
     * Find transactions by date range
     */
    async findByDateRange(startDate, endDate) {
        return await this.findTransactionsWithDetails(
            {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            },
            { sort: { createdAt: -1 } }
        );
    }

    /**
     * Create transaction for order
     */
    async createOrderTransaction(beverageId, orderId, performedBy) {
        return await this.create({
            beverage_id: beverageId,
            transaction_type: 'order_deduction',
            quantity: -1,
            order_id: orderId,
            reason: 'Order fulfillment',
            performed_by: performedBy,
        });
    }

    /**
     * Create stock adjustment transaction
     */
    async createAdjustment(beverageId, quantity, reason, performedBy) {
        const transactionType = quantity > 0 ? 'stock_in' : 'stock_out';
        return await this.create({
            beverage_id: beverageId,
            transaction_type: transactionType,
            quantity,
            reason,
            performed_by: performedBy,
        });
    }

    /**
     * Get transactions with pagination
     */
    async getTransactionsPaginated(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (filters.beverage_id) {
            filter.beverage_id = filters.beverage_id;
        }
        if (filters.transaction_type) {
            filter.transaction_type = filters.transaction_type;
        }
        if (filters.performed_by) {
            filter.performed_by = filters.performed_by;
        }

        const [rows, count] = await Promise.all([
            this.model.find(filter)
                .populate('beverage_id', 'id name')
                .populate('performed_by', 'id full_name')
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 }),
            this.model.countDocuments(filter)
        ]);

        return { rows, count };
    }
}

module.exports = new InventoryTransactionRepository();
