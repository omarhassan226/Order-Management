/**
 * Main Server File
 * Entry point for the backend application
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { logRequest } = require('./middleware/logger.middleware');
const seedUtil = require('./utils/seed.util');
const logger = require('./utils/logger.util');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (env.NODE_ENV === 'development') {
    app.use(logRequest);
}

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api', routes);

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'login.html'));
    }
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

/**
 * Initialize database and seed data
 */
const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        const { connectDatabase } = require('./config/database');
        const connected = await connectDatabase();

        if (!connected) {
            throw new Error('Failed to connect to database');
        }

        // Seed initial data
        await seedUtil.seedDatabase();

        return true;
    } catch (error) {
        logger.error('❌ Database initialization error:', error);
        return false;
    }
};

/**
 * Start server
 */
const startServer = async () => {
    try {
        // Initialize database
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            logger.error('Failed to initialize database. Exiting...');
            process.exit(1);
        }

        // Start listening
        const server = app.listen(env.PORT, () => {
            logger.info(`\n🚀 Server is running on http://localhost:${env.PORT}`);
            logger.info(`📊 API endpoints available at http://localhost:${env.PORT}/api`);
            logger.info(`🌍 Frontend available at http://localhost:${env.PORT}`);
            logger.info(`\n📝 To get started, log in with one of the default accounts.`);
            logger.info(`Environment: ${env.NODE_ENV}\n`);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${env.PORT} is already in use`);
            } else {
                logger.error('Server error:', error);
            }
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = app;
