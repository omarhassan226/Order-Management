/**
 * Favorite Controller
 * Handles HTTP requests for favorites
 */

const favoriteService = require('../services/favorite.service');
const response = require('../utils/response.util');

/**
 * Toggle favorite status
 * POST /api/favorites/toggle
 */
exports.toggleFavorite = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.body;

        const result = await favoriteService.toggleFavorite(employeeId, beverageId);

        return response.success(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * Add to favorites
 * POST /api/favorites
 */
exports.addFavorite = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.body;

        const result = await favoriteService.addFavorite(employeeId, beverageId);

        return response.created(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * Remove from favorites
 * DELETE /api/favorites/:beverageId
 */
exports.removeFavorite = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.params;

        const result = await favoriteService.removeFavorite(employeeId, beverageId);

        return response.success(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * Get my favorites
 * GET /api/favorites
 */
exports.getMyFavorites = async (req, res, next) => {
    try {
        const employeeId = req.user.id;

        const result = await favoriteService.getEmployeeFavoritesWithDetails(employeeId);

        return response.success(res, result, 'Favorites retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Check favorite status
 * GET /api/favorites/check/:beverageId
 */
exports.checkFavoriteStatus = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.params;

        const result = await favoriteService.checkFavoriteStatus(employeeId, beverageId);

        return response.success(res, result, 'Favorite status retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get favorites count
 * GET /api/favorites/count
 */
exports.getFavoritesCount = async (req, res, next) => {
    try {
        const employeeId = req.user.id;

        const result = await favoriteService.getFavoritesCount(employeeId);

        return response.success(res, result, 'Favorites count retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get most favorited beverages
 * GET /api/favorites/most-favorited
 */
exports.getMostFavorited = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await favoriteService.getMostFavorited(limit);

        return response.success(res, { mostFavorited: result }, 'Most favorited beverages retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get favorite beverage IDs
 * GET /api/favorites/beverage-ids
 */
exports.getFavoriteBeverageIds = async (req, res, next) => {
    try {
        const employeeId = req.user.id;

        const beverageIds = await favoriteService.getFavoriteBeverageIds(employeeId);

        return response.success(res, { beverageIds }, 'Favorite beverage IDs retrieved successfully');
    } catch (error) {
        next(error);
    }
};
