/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger.util');
const response = require('../utils/response.util');
const {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
} = require('../utils/error.util');

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Handle known errors
    if (err instanceof ValidationError) {
        return response.error(res, err.message, err.statusCode, err.errors);
    }

    if (err instanceof AuthenticationError) {
        return response.error(res, err.message, err.statusCode);
    }

    if (err instanceof AuthorizationError) {
        return response.error(res, err.message, err.statusCode);
    }

    if (err instanceof NotFoundError) {
        return response.error(res, err.message, err.statusCode);
    }

    if (err instanceof ConflictError) {
        return response.error(res, err.message, err.statusCode);
    }

    if (err instanceof AppError) {
        return response.error(res, err.message, err.statusCode);
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message,
        }));
        return response.error(res, 'Validation failed', 400, errors);
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0]?.path || 'field';
        return response.error(res, `${field} already exists`, 409);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return response.error(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return response.error(res, 'Token expired', 401);
    }

    // Default server error
    return response.error(res, 'Internal server error', 500);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
    response.error(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = {
    errorHandler,
    notFound,
};
