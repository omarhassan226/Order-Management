/**
 * User Controller
 * Handles user management requests
 */

const userService = require('../services/user.service');
const response = require('../utils/response.util');

class UserController {
    async getAllUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers(req.query);
            return response.success(res, { users }, 'Users retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            return response.success(res, { user }, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createUser(req, res, next) {
        try {
            const user = await userService.createUser(req.body);
            return response.created(res, { user }, 'User created successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            return response.success(res, { user }, 'User updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            await userService.deleteUser(req.params.id);
            return response.success(res, null, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
