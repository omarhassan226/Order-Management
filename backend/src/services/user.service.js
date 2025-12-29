/**
 * User Service
 * Business logic for user management
 */

const userRepository = require('../repositories/user.repository');
const { ConflictError, ValidationError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

class UserService {
    /**
     * Get all users with optional filters
     */
    async getAllUsers(filters = {}) {
        try {
            if (filters.role) {
                return await userRepository.findByRole(filters.role);
            }
            return await userRepository.findAll();
        } catch (error) {
            logger.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        try {
            const user = await userRepository.findById(id);
            return user.toSafeObject();
        } catch (error) {
            logger.error(`Error getting user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new user
     */
    async createUser(userData) {
        try {
            // Check if username already exists
            if (await userRepository.usernameExists(userData.username)) {
                throw new ConflictError('Username already exists');
            }

            // Check if email already exists
            if (await userRepository.emailExists(userData.email)) {
                throw new ConflictError('Email already exists');
            }

            // Map password to password_hash for the model
            const userDataToCreate = { ...userData };
            if (userDataToCreate.password) {
                userDataToCreate.password_hash = userDataToCreate.password;
                delete userDataToCreate.password;
            }

            // Create user
            const user = await userRepository.create(userDataToCreate);
            logger.info(`User created: ${user.username}`);

            return user.toSafeObject();
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async updateUser(id, userData) {
        try {
            // Check if username exists (excluding current user)
            if (userData.username) {
                if (await userRepository.usernameExists(userData.username, id)) {
                    throw new ConflictError('Username already exists');
                }
            }

            // Check if email exists (excluding current user)
            if (userData.email) {
                if (await userRepository.emailExists(userData.email, id)) {
                    throw new ConflictError('Email already exists');
                }
            }

            // Map password to password_hash for the model
            const userDataToUpdate = { ...userData };
            if (userDataToUpdate.password) {
                // Get the user document to trigger the pre-save hook for password hashing
                const userDoc = await userRepository.findById(id);
                userDoc.password_hash = userDataToUpdate.password;
                delete userDataToUpdate.password;

                // Apply other updates
                Object.keys(userDataToUpdate).forEach(key => {
                    userDoc[key] = userDataToUpdate[key];
                });

                await userDoc.save();
                logger.info(`User updated: ${userDoc.username}`);
                return userDoc.toSafeObject();
            }

            // Update user (no password change)
            const user = await userRepository.update(id, userDataToUpdate);
            logger.info(`User updated: ${user.username}`);

            return user.toSafeObject();
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            logger.error(`Error updating user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(id) {
        try {
            await userRepository.delete(id);
            logger.info(`User deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get users with pagination
     */
    async getUsersPaginated(page, limit, filters = {}) {
        try {
            const result = await userRepository.getUsersPaginated(page, limit, filters);
            return {
                users: result.rows.map(user => user.toSafeObject()),
                pagination: {
                    page,
                    limit,
                    totalItems: result.count,
                },
            };
        } catch (error) {
            logger.error('Error getting paginated users:', error);
            throw error;
        }
    }

    /**
     * Search users
     */
    async searchUsers(searchTerm) {
        try {
            const users = await userRepository.searchUsers(searchTerm);
            return users.map(user => user.toSafeObject());
        } catch (error) {
            logger.error('Error searching users:', error);
            throw error;
        }
    }
}

module.exports = new UserService();
