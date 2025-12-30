/**
 * Rating Validators
 * Input validation for rating endpoints
 */

const { body, param } = require('express-validator');

exports.upsertRating = [
    body('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('review')
        .optional()
        .isString()
        .withMessage('Review must be a string')
        .isLength({ max: 500 })
        .withMessage('Review cannot exceed 500 characters')
        .trim(),
    body('isAnonymous')
        .optional()
        .isBoolean()
        .withMessage('isAnonymous must be a boolean'),
];

exports.getBeverageRatings = [
    param('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];

exports.deleteRating = [
    param('beverageId')
        .notEmpty()
        .withMessage('Beverage ID is required')
        .isMongoId()
        .withMessage('Invalid beverage ID'),
];
