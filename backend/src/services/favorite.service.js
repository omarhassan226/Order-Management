/**
 * Favorite Service
 * Business logic for favorite beverages
 */

const favoriteRepository = require('../repositories/favorite.repository');
const beverageRepository = require('../repositories/beverage.repository');
const { AppError } = require('../utils/error.util');

class FavoriteService {
    /**
     * Toggle favorite status
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async toggleFavorite(employeeId, beverageId) {
        // Check if beverage exists
        const beverage = await beverageRepository.findById(beverageId);
        if (!beverage) {
            throw new AppError('Beverage not found', 404);
        }

        const result = await favoriteRepository.toggleFavorite(employeeId, beverageId);

        return {
            ...result,
            beverage: {
                id: beverage._id,
                name: beverage.name,
                category: beverage.category,
            },
        };
    }

    /**
     * Add beverage to favorites
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async addFavorite(employeeId, beverageId) {
        // Check if beverage exists
        const beverage = await beverageRepository.findById(beverageId);
        if (!beverage) {
            throw new AppError('Beverage not found', 404);
        }

        const favorite = await favoriteRepository.addFavorite(employeeId, beverageId);

        return {
            message: 'Added to favorites',
            favorite,
        };
    }

    /**
     * Remove beverage from favorites
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async removeFavorite(employeeId, beverageId) {
        const deleted = await favoriteRepository.removeFavorite(employeeId, beverageId);

        if (!deleted) {
            throw new AppError('Favorite not found', 404);
        }

        return {
            message: 'Removed from favorites',
        };
    }

    /**
     * Get employee's favorites
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async getEmployeeFavorites(employeeId) {
        return await favoriteRepository.getFavoritesWithDetails(employeeId);
    }

    /**
     * Check if beverage is favorited
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async checkFavoriteStatus(employeeId, beverageId) {
        const isFavorite = await favoriteRepository.isFavorite(employeeId, beverageId);

        return {
            isFavorite,
            beverageId,
        };
    }

    /**
     * Get favorite beverages IDs for employee
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async getFavoriteBeverageIds(employeeId) {
        return await favoriteRepository.getFavoriteBeverageIds(employeeId);
    }

    /**
     * Get favorites count
     * @param {string} employeeId
     * @returns {Promise<Object>}
     */
    async getFavoritesCount(employeeId) {
        const count = await favoriteRepository.getFavoritesCount(employeeId);

        return {
            count,
            employeeId,
        };
    }

    /**
     * Get most favorited beverages
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getMostFavorited(limit = 10) {
        return await favoriteRepository.getMostFavorited(limit);
    }

    /**
     * Get employee's favorites with full beverage details
     * @param {string} employeeId
     * @returns {Promise<Object>}
     */
    async getEmployeeFavoritesWithDetails(employeeId) {
        const favorites = await favoriteRepository.getFavoritesWithDetails(employeeId);
        const count = favorites.length;

        // Filter out any favorites with deleted beverages
        const validFavorites = favorites.filter(fav => fav.beverage !== null);

        return {
            count,
            favorites: validFavorites,
        };
    }
}

module.exports = new FavoriteService();
