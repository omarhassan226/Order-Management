/**
 * Logger Middleware
 * HTTP request logging
 */

const logger = require('../utils/logger.util');

/**
 * Log HTTP requests
 */
const logRequest = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info(`${req.method} ${req.path}`);

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(
            `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
        );
    });

    next();
};

module.exports = { logRequest };
