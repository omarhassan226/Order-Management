/**
 * Beverage Repository
 * Data access layer for Beverage model using Mongoose
 */

const BaseRepository = require('./base.repository');
const { Beverage } = require('../models');
const { STOCK_STATUS } = require('../config/constants');

class BeverageRepository extends BaseRepository {
    constructor() {
        super(Beverage);
    }

    /**
     * Find beverages by category
     */
    async findByCategory(category) {
        return await this.findAll({ category });
    }

    /**
     * Find active beverages
     */
    async findActiveBeverages() {
        return await this.findAll({ is_active: true });
    }

    /**
     * Find low stock beverages
     */
    async findLowStock() {
        // Use $expr to compare two fields
        return await this.model.find({
            $expr: {
                $and: [
                    { $lte: ["$stock_quantity", "$min_stock_alert"] },
                    { $gt: ["$stock_quantity", 0] }
                ]
            }
        });
    }

    /**
     * Find out of stock beverages
     */
    async findOutOfStock() {
        return await this.findAll({ stock_quantity: 0 });
    }

    /**
     * Get inventory status with stock levels
     */
    async getInventoryStatus() {
        const beverages = await this.model.find(
            {},
            {
                id: 1,
                name: 1,
                category: 1,
                stock_quantity: 1,
                min_stock_alert: 1,
                unit: 1
            }
        );

        return beverages.map(beverage => ({
            ...beverage.toJSON(),
            status: beverage.getStockStatus(),
        }));
    }

    /**
     * Update beverage stock
     */
    async updateStock(id, quantity) {
        const beverage = await this.findById(id);
        return await beverage.updateStock(quantity);
    }

    /**
     * Search beverages by name
     */
    async searchBeverages(searchTerm) {
        return await this.findAll({
            name: { $regex: searchTerm, $options: 'i' },
        });
    }

    /**
     * Get beverages with pagination and filters
     */
    async getBeveragesPaginated(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (filters.category) {
            filter.category = filters.category;
        }
        if (filters.is_active !== undefined) {
            filter.is_active = filters.is_active;
        }
        if (filters.caffeine_level) {
            filter.caffeine_level = filters.caffeine_level;
        }
        if (filters.stock_status) {
            if (filters.stock_status === STOCK_STATUS.OUT_OF_STOCK) {
                filter.stock_quantity = 0;
            } else if (filters.stock_status === STOCK_STATUS.LOW_STOCK) {
                filter.$expr = {
                    $and: [
                        { $lte: ["$stock_quantity", "$min_stock_alert"] },
                        { $gt: ["$stock_quantity", 0] }
                    ]
                };
            }
        }

        return await this.findAndCountAll(filter, {
            limit,
            skip,
            sort: { name: 1 },
        });
    }

    /**
     * Get stock count by status
     */
    async getStockCounts() {
        const outOfStockCount = await this.count({ stock_quantity: 0 });

        const lowStockCount = await this.model.countDocuments({
            $expr: {
                $and: [
                    { $lte: ["$stock_quantity", "$min_stock_alert"] },
                    { $gt: ["$stock_quantity", 0] }
                ]
            }
        });

        const totalCount = await this.count();

        return {
            total: totalCount,
            outOfStock: outOfStockCount,
            lowStock: lowStockCount,
            inStock: totalCount - outOfStockCount - lowStockCount,
        };
    }
}

module.exports = new BeverageRepository();
