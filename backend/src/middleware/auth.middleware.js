/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { AuthenticationError } = require('../utils/error.util');
const response = require('../utils/response.util');

/**
 * Authenticate middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = authService.verifyToken(token);

        // Get user from database
        const user = await userRepository.findById(decoded.id);

        if (!user || !user.is_active) {
            throw new AuthenticationError('Invalid user');
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return response.error(res, error.message, 401);
        }
        return response.error(res, 'Authentication failed', 401);
    }
};

module.exports = { authenticate };
