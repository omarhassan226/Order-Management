/**
 * Inventory Transaction Model
 * Tracks all inventory changes for audit purposes using Mongoose
 */

const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../config/constants');

const inventoryTransactionSchema = new mongoose.Schema({
    beverage_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beverage',
        required: [true, 'Beverage ID is required'],
    },
    transaction_type: {
        type: String,
        enum: {
            values: Object.values(TRANSACTION_TYPES),
            message: 'Invalid transaction type',
        },
        required: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        validate: {
            validator: function (value) {
                return value !== 0;
            },
            message: 'Transaction quantity cannot be zero',
        },
    },
    reason: {
        type: String,
        default: null,
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
    },
    performed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Performer ID is required'],
    },
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false, // Transactions should not be updated
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes
inventoryTransactionSchema.index({ beverage_id: 1 });
inventoryTransactionSchema.index({ transaction_type: 1 });
inventoryTransactionSchema.index({ createdAt: 1 });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

module.exports = InventoryTransaction;
