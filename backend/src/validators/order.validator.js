/**
 * Order Validators
 * Validation rules for order endpoints
 */

const { body, param } = require('express-validator');
const { CUP_SIZES, SUGAR_QUANTITIES, ORDER_STATUS } = require('../config/constants');

const createOrderValidator = [
    body('beverage_id')
        .isMongoId().withMessage('Invalid beverage ID'),
    body('cup_size')
        .isIn(Object.values(CUP_SIZES)).withMessage('Invalid cup size'),
    body('sugar_quantity')
        .isIn(Object.values(SUGAR_QUANTITIES)).withMessage('Invalid sugar quantity'),
    body('add_ons')
        .optional()
        .isArray().withMessage('Add-ons must be an array'),
    body('remarks')
        .optional()
        .trim(),
];

const updateOrderStatusValidator = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),
    body('status')
        .isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),
];

const orderIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),
];

module.exports = {
    createOrderValidator,
    updateOrderStatusValidator,
    orderIdValidator,
};
