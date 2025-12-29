/**
 * Models Index
 * Exports all Mongoose models
 */

const User = require('./User');
const Beverage = require('./Beverage');
const Order = require('./Order');
const InventoryTransaction = require('./InventoryTransaction');

// Models are already defined with references via ObjectId
// No need to define relationships like in Sequelize
// Mongoose will handle population automatically when using .populate()

module.exports = {
    User,
    Beverage,
    Order,
    InventoryTransaction,
};
