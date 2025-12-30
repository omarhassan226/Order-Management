/**
 * Favorite Repository
 * Handles database operations for favorites
 */

const BaseRepository = require('./base.repository');
const { Favorite } = require('../models');

class FavoriteRepository extends BaseRepository {
    constructor() {
        super(Favorite);
    }

    /**
     * Find favorite by employee and beverage
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object|null>}
     */
    async findByEmployeeAndBeverage(employeeId, beverageId) {
        return await this.model.findOne({
            employee_id: employeeId,
            beverage_id: beverageId,
        });
    }

    /**
     * Get all favorites for an employee
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async findByEmployee(employeeId) {
        return await this.model.find({ employee_id: employeeId })
            .populate('beverage_id')
            .sort({ createdAt: -1 });
    }

    /**
     * Add beverage to favorites
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async addFavorite(employeeId, beverageId) {
        // Check if already exists
        const existing = await this.findByEmployeeAndBeverage(employeeId, beverageId);
        if (existing) {
            return existing;
        }

        return await this.create({
            employee_id: employeeId,
            beverage_id: beverageId,
        });
    }

    /**
     * Remove beverage from favorites
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object|null>}
     */
    async removeFavorite(employeeId, beverageId) {
        return await this.model.findOneAndDelete({
            employee_id: employeeId,
            beverage_id: beverageId,
        });
    }

    /**
     * Toggle favorite status
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async toggleFavorite(employeeId, beverageId) {
        const existing = await this.findByEmployeeAndBeverage(employeeId, beverageId);

        if (existing) {
            await this.removeFavorite(employeeId, beverageId);
            return { isFavorite: false, message: 'Removed from favorites' };
        } else {
            await this.addFavorite(employeeId, beverageId);
            return { isFavorite: true, message: 'Added to favorites' };
        }
    }

    /**
     * Check if beverage is favorited
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<boolean>}
     */
    async isFavorite(employeeId, beverageId) {
        return await this.model.isFavorite(employeeId, beverageId);
    }

    /**
     * Get favorites count for employee
     * @param {string} employeeId
     * @returns {Promise<number>}
     */
    async getFavoritesCount(employeeId) {
        return await this.model.getFavoritesCount(employeeId);
    }

    /**
     * Get most favorited beverages
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getMostFavorited(limit = 10) {
        return await this.model.getMostFavorited(limit);
    }

    /**
     * Get favorites with beverage details
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async getFavoritesWithDetails(employeeId) {
        const favorites = await this.model.find({ employee_id: employeeId })
            .populate({
                path: 'beverage_id',
                select: 'name category description image_url stock_quantity is_active',
            })
            .sort({ createdAt: -1 });

        return favorites.map(fav => ({
            id: fav._id,
            beverage: fav.beverage_id,
            addedAt: fav.createdAt,
        }));
    }

    /**
     * Get favorite beverages IDs for employee
     * @param {string} employeeId
     * @returns {Promise<Array<string>>}
     */
    async getFavoriteBeverageIds(employeeId) {
        const favorites = await this.model.find({ employee_id: employeeId })
            .select('beverage_id');

        return favorites.map(fav => fav.beverage_id.toString());
    }
}

module.exports = new FavoriteRepository();
