/**
 * Environment Configuration
 * Validates and exports environment variables
 */

require('dotenv').config();

const env = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-2025',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

    // Database - MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/beverage-system',
    DB_NAME: process.env.DB_NAME || 'beverage-system',

    // Application
    FRONTEND_DIR: process.env.FRONTEND_DIR || './frontend',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('   Using default values. Please set these in production!');
}

module.exports = env;
