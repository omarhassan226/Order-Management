/**
 * Base Repository
 * Provides common database operations for all Mongoose models
 */

const { NotFoundError, DatabaseError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    /**
     * Find all records with optional filters
     */
    async findAll(filter = {}, options = {}) {
        try {
            return await this.model.find(filter, null, options);
        } catch (error) {
            logger.error(`Error finding all ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to fetch ${this.model.modelName} records`);
        }
    }

    /**
     * Find record by ID
     */
    async findById(id, options = {}) {
        try {
            const record = await this.model.findById(id, null, options);
            if (!record) {
                throw new NotFoundError(`${this.model.modelName} with ID ${id} not found`);
            }
            return record;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error(`Error finding ${this.model.modelName} by ID:`, error);
            throw new DatabaseError(`Failed to fetch ${this.model.modelName}`);
        }
    }

    /**
     * Find one record by criteria
     */
    async findOne(filter = {}, options = {}) {
        try {
            return await this.model.findOne(filter, null, options);
        } catch (error) {
            logger.error(`Error finding one ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to fetch ${this.model.modelName}`);
        }
    }

    /**
     * Create new record
     */
    async create(data) {
        try {
            return await this.model.create(data);
        } catch (error) {
            logger.error(`Error creating ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to create ${this.model.modelName}`, error);
        }
    }

    /**
     * Update record by ID
     */
    async update(id, data) {
        try {
            const record = await this.model.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            );
            if (!record) {
                throw new NotFoundError(`${this.model.modelName} with ID ${id} not found`);
            }
            return record;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error(`Error updating ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to update ${this.model.modelName}`);
        }
    }

    /**
     * Delete record by ID
     */
    async delete(id) {
        try {
            const record = await this.model.findByIdAndDelete(id);
            if (!record) {
                throw new NotFoundError(`${this.model.modelName} with ID ${id} not found`);
            }
            return true;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error(`Error deleting ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to delete ${this.model.modelName}`);
        }
    }

    /**
     * Count records with optional filters
     */
    async count(filter = {}) {
        try {
            return await this.model.countDocuments(filter);
        } catch (error) {
            logger.error(`Error counting ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to count ${this.model.modelName} records`);
        }
    }

    /**
     * Find and count all (for pagination)
     */
    async findAndCountAll(filter = {}, options = {}) {
        try {
            const { limit, skip, ...rest } = options;
            const [rows, count] = await Promise.all([
                this.model.find(filter, null, options),
                this.model.countDocuments(filter)
            ]);
            return { rows, count };
        } catch (error) {
            logger.error(`Error finding and counting ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to fetch ${this.model.modelName} records`);
        }
    }

    /**
     * Bulk create records
     */
    async bulkCreate(records) {
        try {
            return await this.model.insertMany(records);
        } catch (error) {
            logger.error(`Error bulk creating ${this.model.modelName}:`, error);
            throw new DatabaseError(`Failed to create ${this.model.modelName} records`);
        }
    }
}

module.exports = BaseRepository;
