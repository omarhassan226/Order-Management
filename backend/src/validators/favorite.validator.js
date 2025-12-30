/**
 * Favorite Validators
 * Input validation for favorite endpoints
 */

const { body, param } = require('express-validator');

exports.toggleFavorite = [
    body('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];

exports.addFavorite = [
    body('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];

exports.removeFavorite = [
    param('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];

exports.checkFavoriteStatus = [
    param('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];
