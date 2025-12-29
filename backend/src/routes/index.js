/**
 * Routes Index
 * Central router configuration
 */

const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const beverageRoutes = require('./beverage.routes');
const orderRoutes = require('./order.routes');
const reportRoutes = require('./report.routes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/beverages', beverageRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Beverage System API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
