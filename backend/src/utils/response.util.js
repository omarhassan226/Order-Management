/**
 * Response Utilities
 * Standardized response formatting for API endpoints
 */

const { HTTP_STATUS } = require('../config/constants');

/**
 * Send success response
 */
const success = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
const error = (res, message = 'Error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const paginated = (res, data, pagination, message = 'Success') => {
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            totalItems: pagination.totalItems,
            totalPages: Math.ceil(pagination.totalItems / pagination.limit),
            hasNextPage: pagination.page < Math.ceil(pagination.totalItems / pagination.limit),
            hasPrevPage: pagination.page > 1,
        },
    });
};

/**
 * Send created response
 */
const created = (res, data, message = 'Resource created successfully') => {
    return success(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send no content response
 */
const noContent = (res) => {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
};

module.exports = {
    success,
    error,
    paginated,
    created,
    noContent,
};
