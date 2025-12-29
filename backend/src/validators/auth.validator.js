/**
 * Auth Validators
 * Validation rules for authentication endpoints
 */

const { body } = require('express-validator');

const loginValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
    loginValidator,
};
