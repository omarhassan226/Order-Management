/**
 * Rating Controller
 * Handles HTTP requests for ratings
 */

const ratingService = require('../services/rating.service');
const response = require('../utils/response.util');

/**
 * Create or update rating
 * POST /api/ratings
 */
exports.upsertRating = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId, rating, review, isAnonymous } = req.body;

        const result = await ratingService.upsertRating(employeeId, {
            beverageId,
            rating,
            review,
            isAnonymous,
        });

        return response.created(res, result, 'Rating submitted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get employee's rating for a beverage
 * GET /api/ratings/beverage/:beverageId/my-rating
 */
exports.getMyRating = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.params;

        const rating = await ratingService.getEmployeeRating(employeeId, beverageId);

        return response.success(res, { rating }, 'Rating retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all ratings for a beverage
 * GET /api/ratings/beverage/:beverageId
 */
exports.getBeverageRatings = async (req, res, next) => {
    try {
        const { beverageId } = req.params;

        const result = await ratingService.getBeverageRatings(beverageId);

        return response.success(res, result, 'Beverage ratings retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all ratings by current employee
 * GET /api/ratings/my-ratings
 */
exports.getMyRatings = async (req, res, next) => {
    try {
        const employeeId = req.user.id;

        const ratings = await ratingService.getEmployeeRatings(employeeId);

        return response.success(res, { ratings }, 'Your ratings retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete rating
 * DELETE /api/ratings/beverage/:beverageId
 */
exports.deleteRating = async (req, res, next) => {
    try {
        const employeeId = req.user.id;
        const { beverageId } = req.params;

        const result = await ratingService.deleteRating(employeeId, beverageId);

        return response.success(res, result, 'Rating deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get top rated beverages
 * GET /api/ratings/top-rated
 */
exports.getTopRated = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topRated = await ratingService.getTopRatedBeverages(limit);

        return response.success(res, { topRated }, 'Top rated beverages retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get rating statistics
 * GET /api/ratings/statistics
 */
exports.getStatistics = async (req, res, next) => {
    try {
        const stats = await ratingService.getRatingStatistics();

        return response.success(res, stats, 'Rating statistics retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get beverage with rating info
 * GET /api/ratings/beverage/:beverageId/details
 */
exports.getBeverageWithRating = async (req, res, next) => {
    try {
        const { beverageId } = req.params;
        const employeeId = req.user?.id || null;

        const beverage = await ratingService.getBeverageWithRating(beverageId, employeeId);

        return response.success(res, { beverage }, 'Beverage details retrieved successfully');
    } catch (error) {
        next(error);
    }
};
