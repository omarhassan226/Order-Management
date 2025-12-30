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
const ratingRoutes = require('./rating.routes');
const favoriteRoutes = require('./favorite.routes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/beverages', beverageRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/ratings', ratingRoutes);
router.use('/favorites', favoriteRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Beverage System API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
