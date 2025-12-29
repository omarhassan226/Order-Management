/**
 * Logger Utility
 * Simple logging utility with different log levels
 */

const env = require('../config/env');

const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};

const COLORS = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[35m', // Magenta
    reset: '\x1b[0m',  // Reset
};

class Logger {
    constructor(level = 'info') {
        this.level = level;
    }

    _log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const color = COLORS[level] || COLORS.reset;
        console.log(
            `${color}[${timestamp}] [${level.toUpperCase()}]${COLORS.reset}`,
            message,
            ...args
        );
    }

    error(message, ...args) {
        this._log(LOG_LEVELS.ERROR, message, ...args);
    }

    warn(message, ...args) {
        this._log(LOG_LEVELS.WARN, message, ...args);
    }

    info(message, ...args) {
        this._log(LOG_LEVELS.INFO, message, ...args);
    }

    debug(message, ...args) {
        if (env.NODE_ENV === 'development') {
            this._log(LOG_LEVELS.DEBUG, message, ...args);
        }
    }
}

// Export singleton instance
const logger = new Logger(env.LOG_LEVEL);

module.exports = logger;
