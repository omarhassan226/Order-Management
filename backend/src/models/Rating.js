/**
 * Rating Model
 * Defines the Rating entity for beverage reviews and ratings
 */

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employee ID is required'],
    },
    beverage_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beverage',
        required: [true, 'Beverage ID is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    review: {
        type: String,
        trim: true,
        maxlength: [500, 'Review cannot exceed 500 characters'],
        default: null,
    },
    is_anonymous: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
ratingSchema.index({ beverage_id: 1 });
ratingSchema.index({ employee_id: 1 });
// Ensure one rating per employee per beverage
ratingSchema.index({ employee_id: 1, beverage_id: 1 }, { unique: true });

/**
 * Static method to get average rating for a beverage
 */
ratingSchema.statics.getAverageRating = async function (beverageId) {
    const result = await this.aggregate([
        { $match: { beverage_id: new mongoose.Types.ObjectId(beverageId) } },
        {
            $group: {
                _id: '$beverage_id',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
            },
        },
    ]);

    if (result.length > 0) {
        return {
            averageRating: Math.round(result[0].averageRating * 10) / 10,
            totalRatings: result[0].totalRatings,
        };
    }

    return {
        averageRating: 0,
        totalRatings: 0,
    };
};

/**
 * Static method to get top rated beverages
 */
ratingSchema.statics.getTopRatedBeverages = async function (limit = 10) {
    return await this.aggregate([
        {
            $group: {
                _id: '$beverage_id',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
            },
        },
        {
            $match: {
                totalRatings: { $gte: 3 }, // Minimum 3 ratings to be considered
            },
        },
        {
            $sort: { averageRating: -1, totalRatings: -1 },
        },
        {
            $limit: limit,
        },
        {
            $lookup: {
                from: 'beverages',
                localField: '_id',
                foreignField: '_id',
                as: 'beverage',
            },
        },
        {
            $unwind: '$beverage',
        },
        {
            $project: {
                _id: 0,
                beverage_id: '$_id',
                beverage: 1,
                averageRating: { $round: ['$averageRating', 1] },
                totalRatings: 1,
            },
        },
    ]);
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
