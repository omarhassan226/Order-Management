/**
 * Beverage Service
 * Business logic for beverage management
 */

const beverageRepository = require('../repositories/beverage.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const { ValidationError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

class BeverageService {
    async getAllBeverages(filters = {}) {
        try {
            if (filters.category) {
                return await beverageRepository.findByCategory(filters.category);
            }
            if (filters.active_only) {
                return await beverageRepository.findActiveBeverages();
            }
            return await beverageRepository.findAll();
        } catch (error) {
            logger.error('Error getting beverages:', error);
            throw error;
        }
    }

    async getBeverageById(id) {
        return await beverageRepository.findById(id);
    }

    async createBeverage(data) {
        try {
            const beverage = await beverageRepository.create(data);
            logger.info(`Beverage created: ${beverage.name}`);
            return beverage;
        } catch (error) {
            logger.error('Error creating beverage:', error);
            throw error;
        }
    }

    async updateBeverage(id, data) {
        try {
            const beverage = await beverageRepository.update(id, data);
            logger.info(`Beverage updated: ${beverage.name}`);
            return beverage;
        } catch (error) {
            logger.error(`Error updating beverage ${id}:`, error);
            throw error;
        }
    }

    async deleteBeverage(id) {
        try {
            await beverageRepository.delete(id);
            logger.info(`Beverage deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting beverage ${id}:`, error);
            throw error;
        }
    }

    async getBeveragesPaginated(page, limit, filters = {}) {
        try {
            const result = await beverageRepository.getBeveragesPaginated(page, limit, filters);
            return {
                beverages: result.rows,
                pagination: {
                    page,
                    limit,
                    totalItems: result.count,
                },
            };
        } catch (error) {
            logger.error('Error getting paginated beverages:', error);
            throw error;
        }
    }

    async getInventoryStatus() {
        return await beverageRepository.getInventoryStatus();
    }

    async getLowStockBeverages() {
        return await beverageRepository.findLowStock();
    }

    async getOutOfStockBeverages() {
        return await beverageRepository.findOutOfStock();
    }

    async adjustStock(beverageId, quantity, reason, performedBy) {
        try {
            // Update beverage stock
            const beverage = await beverageRepository.updateStock(beverageId, quantity);

            // Log transaction
            await inventoryRepository.createAdjustment(beverageId, quantity, reason, performedBy);

            logger.info(`Stock adjusted for beverage ${beverageId}: ${quantity}`);
            return beverage;
        } catch (error) {
            logger.error('Error adjusting stock:', error);
            throw error;
        }
    }
}

module.exports = new BeverageService();
