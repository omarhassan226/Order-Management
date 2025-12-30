/**
 * Favorite Routes
 * Defines routing for favorite endpoints
 */

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const favoriteValidator = require('../validators/favorite.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/favorites
 * Get current user's favorites
 */
router.get('/', favoriteController.getMyFavorites);

/**
 * GET /api/favorites/count
 * Get current user's favorites count
 */
router.get('/count', favoriteController.getFavoritesCount);

/**
 * GET /api/favorites/beverage-ids
 * Get current user's favorite beverage IDs
 */
router.get('/beverage-ids', favoriteController.getFavoriteBeverageIds);

/**
 * GET /api/favorites/most-favorited
 * Get most favorited beverages
 */
router.get('/most-favorited', favoriteController.getMostFavorited);

/**
 * GET /api/favorites/check/:beverageId
 * Check if beverage is favorited
 */
router.get(
    '/check/:beverageId',
    favoriteValidator.checkFavoriteStatus,
    validate,
    favoriteController.checkFavoriteStatus
);

/**
 * POST /api/favorites/toggle
 * Toggle favorite status
 */
router.post(
    '/toggle',
    favoriteValidator.toggleFavorite,
    validate,
    favoriteController.toggleFavorite
);

/**
 * POST /api/favorites
 * Add to favorites
 */
router.post(
    '/',
    favoriteValidator.addFavorite,
    validate,
    favoriteController.addFavorite
);

/**
 * DELETE /api/favorites/:beverageId
 * Remove from favorites
 */
router.delete(
    '/:beverageId',
    favoriteValidator.removeFavorite,
    validate,
    favoriteController.removeFavorite
);

module.exports = router;
