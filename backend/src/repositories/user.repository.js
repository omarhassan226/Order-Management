/**
 * User Repository
 * Data access layer for User model using Mongoose
 */

const BaseRepository = require('./base.repository');
const { User } = require('../models');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    /**
     * Find user by username
     */
    async findByUsername(username) {
        return await this.findOne({ username });
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Find users by role
     */
    async findByRole(role) {
        return await this.findAll({ role });
    }

    /**
     * Find active users
     */
    async findActiveUsers() {
        return await this.findAll({ is_active: true });
    }

    /**
     * Search users by name or username
     */
    async searchUsers(searchTerm) {
        return await this.findAll({
            $or: [
                { username: { $regex: searchTerm, $options: 'i' } },
                { full_name: { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }

    /**
     * Check if username exists
     */
    async usernameExists(username, excludeId = null) {
        const filter = { username };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        const count = await this.count(filter);
        return count > 0;
    }

    /**
     * Check if email exists
     */
    async emailExists(email, excludeId = null) {
        const filter = { email };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        const count = await this.count(filter);
        return count > 0;
    }

    /**
     * Get users with pagination
     */
    async getUsersPaginated(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (filters.role) {
            filter.role = filters.role;
        }
        if (filters.is_active !== undefined) {
            filter.is_active = filters.is_active;
        }
        if (filters.department) {
            filter.department = filters.department;
        }

        return await this.findAndCountAll(filter, {
            limit,
            skip,
            sort: { createdAt: -1 },
        });
    }
}

module.exports = new UserRepository();
