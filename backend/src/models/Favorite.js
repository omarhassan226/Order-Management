/**
 * Favorite Model
 * Defines the Favorite entity for user's favorite beverages
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
favoriteSchema.index({ employee_id: 1 });
favoriteSchema.index({ beverage_id: 1 });
// Ensure one favorite entry per employee per beverage
favoriteSchema.index({ employee_id: 1, beverage_id: 1 }, { unique: true });

/**
 * Static method to check if beverage is favorited by employee
 */
favoriteSchema.statics.isFavorite = async function (employeeId, beverageId) {
    const favorite = await this.findOne({
        employee_id: employeeId,
        beverage_id: beverageId,
    });
    return !!favorite;
};

/**
 * Static method to get employee's favorites count
 */
favoriteSchema.statics.getFavoritesCount = async function (employeeId) {
    return await this.countDocuments({ employee_id: employeeId });
};

/**
 * Static method to get most favorited beverages
 */
favoriteSchema.statics.getMostFavorited = async function (limit = 10) {
    return await this.aggregate([
        {
            $group: {
                _id: '$beverage_id',
                favoritesCount: { $sum: 1 },
            },
        },
        {
            $sort: { favoritesCount: -1 },
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
                favoritesCount: 1,
            },
        },
    ]);
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
