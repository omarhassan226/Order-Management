/**
 * Beverage Model
 * Defines the Beverage entity with stock management using Mongoose
 */

const mongoose = require('mongoose');
const { BEVERAGE_CATEGORIES, CAFFEINE_LEVELS, STOCK_STATUS } = require('../config/constants');

const beverageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Beverage name is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: {
            values: Object.values(BEVERAGE_CATEGORIES),
            message: 'Invalid category',
        },
        required: true,
    },
    description: {
        type: String,
        trim: true,
        default: null,
    },
    image_url: {
        type: String,
        default: null,
    },
    stock_quantity: {
        type: Number,
        default: 0,
        min: [0, 'Stock quantity cannot be negative'],
    },
    unit: {
        type: String,
        default: 'كوب',
    },
    min_stock_alert: {
        type: Number,
        default: 10,
        min: [0, 'Minimum stock alert cannot be negative'],
    },
    unit_price: {
        type: Number,
        default: 0,
        min: [0, 'Unit price cannot be negative'],
    },
    caffeine_level: {
        type: String,
        enum: Object.values(CAFFEINE_LEVELS),
        default: CAFFEINE_LEVELS.NONE,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
beverageSchema.index({ category: 1 });
beverageSchema.index({ is_active: 1 });

/**
 * Instance method to check if beverage is low stock
 */
beverageSchema.methods.isLowStock = function () {
    return this.stock_quantity <= this.min_stock_alert && this.stock_quantity > 0;
};

/**
 * Instance method to check if beverage is out of stock
 */
beverageSchema.methods.isOutOfStock = function () {
    return this.stock_quantity === 0;
};

/**
 * Instance method to get stock status
 */
beverageSchema.methods.getStockStatus = function () {
    if (this.isOutOfStock()) return STOCK_STATUS.OUT_OF_STOCK;
    if (this.isLowStock()) return STOCK_STATUS.LOW_STOCK;
    return STOCK_STATUS.IN_STOCK;
};

/**
 * Instance method to update stock
 */
beverageSchema.methods.updateStock = async function (quantity) {
    this.stock_quantity += quantity;
    if (this.stock_quantity < 0) {
        this.stock_quantity = 0;
    }
    await this.save();
    return this;
};

const Beverage = mongoose.model('Beverage', beverageSchema);

module.exports = Beverage;
