/**
 * Validation Middleware
 * Handles express-validator validation results
 */

const { validationResult } = require('express-validator');
const response = require('../utils/response.util');
const { ValidationError } = require('../utils/error.util');

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
        }));

        return response.error(res, 'Validation failed', 400, formattedErrors);
    }

    next();
};

module.exports = { validate };
