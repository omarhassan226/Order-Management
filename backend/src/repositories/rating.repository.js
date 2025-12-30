/**
 * Rating Repository
 * Handles database operations for ratings
 */

const BaseRepository = require('./base.repository');
const { Rating } = require('../models');

class RatingRepository extends BaseRepository {
    constructor() {
        super(Rating);
    }

    /**
     * Find rating by employee and beverage
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object|null>}
     */
    async findByEmployeeAndBeverage(employeeId, beverageId) {
        return await this.model.findOne({
            employee_id: employeeId,
            beverage_id: beverageId,
        })
            .populate('employee_id', 'name email')
            .populate('beverage_id', 'name category');
    }

    /**
     * Get all ratings for a beverage
     * @param {string} beverageId
     * @returns {Promise<Array>}
     */
    async findByBeverage(beverageId) {
        return await this.model.find({ beverage_id: beverageId })
            .populate('employee_id', 'name email')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all ratings by an employee
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async findByEmployee(employeeId) {
        return await this.model.find({ employee_id: employeeId })
            .populate('beverage_id', 'name category image_url')
            .sort({ createdAt: -1 });
    }

    /**
     * Create or update rating
     * @param {string} employeeId
     * @param {string} beverageId
     * @param {Object} ratingData
     * @returns {Promise<Object>}
     */
    async upsertRating(employeeId, beverageId, ratingData) {
        return await this.model.findOneAndUpdate(
            {
                employee_id: employeeId,
                beverage_id: beverageId,
            },
            {
                ...ratingData,
                employee_id: employeeId,
                beverage_id: beverageId,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        )
            .populate('employee_id', 'name email')
            .populate('beverage_id', 'name category');
    }

    /**
     * Delete rating
     * @param {string} employeeId
     * @param {string} beverageId
     * @returns {Promise<Object|null>}
     */
    async deleteRating(employeeId, beverageId) {
        return await this.model.findOneAndDelete({
            employee_id: employeeId,
            beverage_id: beverageId,
        });
    }

    /**
     * Get average rating for beverage
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async getAverageRating(beverageId) {
        return await this.model.getAverageRating(beverageId);
    }

    /**
     * Get top rated beverages
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getTopRated(limit = 10) {
        return await this.model.getTopRatedBeverages(limit);
    }

    /**
     * Get rating statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const stats = await this.model.aggregate([
            {
                $group: {
                    _id: null,
                    totalRatings: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    highestRating: { $max: '$rating' },
                    lowestRating: { $min: '$rating' },
                },
            },
        ]);

        if (stats.length > 0) {
            return {
                totalRatings: stats[0].totalRatings,
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                highestRating: stats[0].highestRating,
                lowestRating: stats[0].lowestRating,
            };
        }

        return {
            totalRatings: 0,
            averageRating: 0,
            highestRating: 0,
            lowestRating: 0,
        };
    }

    /**
     * Get ratings distribution for a beverage
     * @param {string} beverageId
     * @returns {Promise<Object>}
     */
    async getRatingsDistribution(beverageId) {
        const distribution = await this.model.aggregate([
            { $match: { beverage_id: new this.model.base.Types.ObjectId(beverageId) } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: -1 },
            },
        ]);

        const result = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        };

        distribution.forEach(item => {
            result[item._id] = item.count;
        });

        return result;
    }
}

module.exports = new RatingRepository();
