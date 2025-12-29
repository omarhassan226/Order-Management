/**
 * User Validators
 * Validation rules for user endpoints
 */

const { body, param } = require('express-validator');
const { USER_ROLES } = require('../config/constants');

const createUserValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('role')
        .optional()
        .isIn(Object.values(USER_ROLES)).withMessage('Invalid role'),
    body('department')
        .optional()
        .trim(),
];

const updateUserValidator = [
    param('id')
        .isMongoId().withMessage('Invalid user ID'),
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name')
        .optional()
        .trim()
        .notEmpty().withMessage('Full name cannot be empty'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format'),
    body('role')
        .optional()
        .isIn(Object.values(USER_ROLES)).withMessage('Invalid role'),
];

const userIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid user ID'),
];

module.exports = {
    createUserValidator,
    updateUserValidator,
    userIdValidator,
};
