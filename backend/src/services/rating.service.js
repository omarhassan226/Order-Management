/**
 * Rating Service
 * Business logic for ratings and reviews
 */

const ratingRepository = require('../repositories/rating.repository');
const beverageRepository = require('../repositories/beverage.repository');
const { AppError } = require('../utils/error.util');

class RatingService {
    /**
     * Create or update a rating
     * @param {string} employeeId
     * @param {Object} ratingData
     * @returns {Promise<Object>}
     */
    async upsertRating(employeeId, ratingData) {
        const { beverageId, rating, review, isAnonymous } = ratingData;

        // Check if beverage exists
        const beverage = await beverageRepository.findById(beverageId);
        if (!beverage) {
            throw new AppError('Beverage not found', 404);
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new AppError('Rating must be between 1 and 5', 400);
        }

        // Create or update rating
        const updatedRating = await ratingRepository.upsertRating(
            employeeId,
            beverageId,
            {
                rating,
                review: review || null,
                is_anonymous: isAnonymous || false,
            }
        );

        // Get updated average rating
        const averageRating = await ratingRepository.getAverageRating(beverageId);

        return {
            rating: updatedRating,
            averageRating,
        };
    }

    /**
     * Get rating by employee for a beverage
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object|null>}
     */
    async getEmployeeRating(employeeId, beverageId) {
        return await ratingRepository.findByEmployeeAndBeverage(employeeId, beverageId);
    }

    /**
     * Get all ratings for a beverage
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async getBeverageRatings(beverageId) {
        // Check if beverage exists
        const beverage = await beverageRepository.findById(beverageId);
        if (!beverage) {
            throw new AppError('Beverage not found', 404);
        }

        const ratings = await ratingRepository.findByBeverage(beverageId);
        const averageRating = await ratingRepository.getAverageRating(beverageId);
        const distribution = await ratingRepository.getRatingsDistribution(beverageId);

        // Hide employee info for anonymous ratings
        const processedRatings = ratings.map(r => {
            const ratingObj = r.toObject();
            if (ratingObj.is_anonymous) {
                ratingObj.employee_id = {
                    name: 'مستخدم مجهول',
                    email: null,
                };
            }
            return ratingObj;
        });

        return {
            beverage,
            ratings: processedRatings,
            averageRating: averageRating.averageRating,
            totalRatings: averageRating.totalRatings,
            distribution,
        };
    }

    /**
     * Get all ratings by employee
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async getEmployeeRatings(employeeId) {
        return await ratingRepository.findByEmployee(employeeId);
    }

    /**
     * Delete a rating
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async deleteRating(employeeId, beverageId) {
        const deleted = await ratingRepository.deleteRating(employeeId, beverageId);

        if (!deleted) {
            throw new AppError('Rating not found', 404);
        }

        // Get updated average rating
        const averageRating = await ratingRepository.getAverageRating(beverageId);

        return {
            message: 'Rating deleted successfully',
            averageRating,
        };
    }

    /**
     * Get top rated beverages
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getTopRatedBeverages(limit = 10) {
        return await ratingRepository.getTopRated(limit);
    }

    /**
     * Get rating statistics
     * @returns {Promise<Object>}
     */
    async getRatingStatistics() {
        const stats = await ratingRepository.getStatistics();
        const topRated = await ratingRepository.getTopRated(5);

        return {
            ...stats,
            topRatedBeverages: topRated,
        };
    }

    /**
     * Get beverage with rating info
     * @param {string} beverageId
     * @param {string} employeeId (optional)
     * @returns {Promise<Object>}
     */
    async getBeverageWithRating(beverageId, employeeId = null) {
        const beverage = await beverageRepository.findById(beverageId);
        if (!beverage) {
            throw new AppError('Beverage not found', 404);
        }

        const averageRating = await ratingRepository.getAverageRating(beverageId);

        let userRating = null;
        if (employeeId) {
            userRating = await ratingRepository.findByEmployeeAndBeverage(employeeId, beverageId);
        }

        return {
            ...beverage.toObject(),
            averageRating: averageRating.averageRating,
            totalRatings: averageRating.totalRatings,
            userRating: userRating ? {
                rating: userRating.rating,
                review: userRating.review,
            } : null,
        };
    }
}

module.exports = new RatingService();
