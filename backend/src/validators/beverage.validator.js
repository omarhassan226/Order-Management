/**
 * Beverage Validators
 * Validation rules for beverage endpoints
 */

const { body, param } = require('express-validator');
const { BEVERAGE_CATEGORIES, CAFFEINE_LEVELS } = require('../config/constants');

const createBeverageValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Beverage name is required'),
    body('category')
        .isIn(Object.values(BEVERAGE_CATEGORIES)).withMessage('Invalid category'),
    body('description')
        .optional()
        .trim(),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
    body('unit')
        .optional()
        .trim(),
    body('min_stock_alert')
        .optional()
        .isInt({ min: 0 }).withMessage('Min stock alert must be a positive number'),
    body('unit_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    body('caffeine_level')
        .optional()
        .isIn(Object.values(CAFFEINE_LEVELS)).withMessage('Invalid caffeine level'),
];

const updateBeverageValidator = [
    param('id')
        .isMongoId().withMessage('Invalid beverage ID'),
    ...createBeverageValidator.map(rule => {
        // Make all fields optional for update
        const newRule = rule;
        if (newRule.builder && newRule.builder.fields) {
            const field = newRule.builder.fields[0];
            if (field !== 'id') {
                return body(field).optional();
            }
        }
        return newRule;
    }),
];

const beverageIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid beverage ID'),
];

module.exports = {
    createBeverageValidator,
    updateBeverageValidator,
    beverageIdValidator,
};
