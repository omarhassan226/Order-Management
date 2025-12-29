/**
 * Auth Controller
 * Handles authentication-related requests
 */

const authService = require('../services/auth.service');
const response = require('../utils/response.util');

class AuthController {
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const result = await authService.login(username, password);
            return response.success(res, result, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req, res, next) {
        try {
            const user = await authService.getCurrentUser(req.userId);
            return response.success(res, { user }, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res) {
        return response.success(res, null, 'Logged out successfully');
    }
}

module.exports = new AuthController();
