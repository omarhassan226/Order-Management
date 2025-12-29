/**
 * Database Configuration
 * Mongoose setup and connection management for MongoDB
 */

const mongoose = require('mongoose');
const env = require('./env');

// Configure mongoose
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
    try {
        const options = {
            dbName: env.DB_NAME,
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(env.MONGODB_URI, options);
        console.log('✅ Database connection established successfully.');
        console.log(`📊 Connected to database: ${env.DB_NAME}`);
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:');
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Full error:', error);
        return false;
    }
};

/**
 * Test database connection
 */
const testConnection = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('✅ Database connection is active.');
        return true;
    }
    return await connectDatabase();
};

/**
 * Disconnect from database
 */
const disconnectDatabase = async () => {
    try {
        await mongoose.disconnect();
        console.log('✅ Database disconnected successfully.');
        return true;
    } catch (error) {
        console.error('❌ Error disconnecting from database:', error);
        return false;
    }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});

module.exports = {
    connectDatabase,
    testConnection,
    disconnectDatabase,
    mongoose,
};
