/**
 * Order Model
 * Defines the Order entity with employee and beverage relationships using Mongoose
 */

const mongoose = require('mongoose');
const { ORDER_STATUS, CUP_SIZES, SUGAR_QUANTITIES } = require('../config/constants');

const orderSchema = new mongoose.Schema({
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
    order_date: {
        type: Date,
        default: () => {
            // Set to start of day in local timezone
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            return date;
        },
        required: true,
    },
    cup_size: {
        type: String,
        enum: Object.values(CUP_SIZES),
        default: CUP_SIZES.SMALL,
        required: true,
    },
    sugar_quantity: {
        type: String,
        enum: Object.values(SUGAR_QUANTITIES),
        default: SUGAR_QUANTITIES.NONE,
        required: true,
    },
    add_ons: {
        type: [String],
        default: [],
    },
    remarks: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING,
        required: true,
    },
    fulfilled_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    fulfilled_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ employee_id: 1, order_date: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ order_date: 1 });

/**
 * Static method to check if employee can still order today (max 3 orders per day)
 */
orderSchema.statics.canEmployeeOrderToday = async function (employeeId) {
    const MAX_ORDERS_PER_DAY = 3;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.countDocuments({
        employee_id: employeeId,
        order_date: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FULFILLED] },
    });

    return count < MAX_ORDERS_PER_DAY;
};

/**
 * Static method to get remaining orders for employee today
 */
orderSchema.statics.getRemainingOrdersToday = async function (employeeId) {
    const MAX_ORDERS_PER_DAY = 3;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.countDocuments({
        employee_id: employeeId,
        order_date: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FULFILLED] },
    });

    return MAX_ORDERS_PER_DAY - count;
};

/**
 * Instance method to fulfill order
 */
orderSchema.methods.fulfill = async function (fulfilledBy) {
    this.status = ORDER_STATUS.FULFILLED;
    this.fulfilled_by = fulfilledBy;
    this.fulfilled_at = new Date();
    await this.save();
    return this;
};

/**
 * Instance method to cancel order
 */
orderSchema.methods.cancel = async function () {
    this.status = ORDER_STATUS.CANCELLED;
    await this.save();
    return this;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
