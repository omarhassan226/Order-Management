/**
 * Rating Routes
 * Defines routing for rating endpoints
 */

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const ratingValidator = require('../validators/rating.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/ratings
 * Create or update a rating
 */
router.post(
    '/',
    ratingValidator.upsertRating,
    validate,
    ratingController.upsertRating
);

/**
 * GET /api/ratings/my-ratings
 * Get current user's all ratings
 */
router.get('/my-ratings', ratingController.getMyRatings);

/**
 * GET /api/ratings/top-rated
 * Get top rated beverages
 */
router.get('/top-rated', ratingController.getTopRated);

/**
 * GET /api/ratings/statistics
 * Get rating statistics (for admins)
 */
router.get('/statistics', ratingController.getStatistics);

/**
 * GET /api/ratings/beverage/:beverageId
 * Get all ratings for a beverage
 */
router.get(
    '/beverage/:beverageId',
    ratingValidator.getBeverageRatings,
    validate,
    ratingController.getBeverageRatings
);

/**
 * GET /api/ratings/beverage/:beverageId/my-rating
 * Get current user's rating for a beverage
 */
router.get(
    '/beverage/:beverageId/my-rating',
    ratingValidator.getBeverageRatings,
    validate,
    ratingController.getMyRating
);

/**
 * GET /api/ratings/beverage/:beverageId/details
 * Get beverage with rating info
 */
router.get(
    '/beverage/:beverageId/details',
    ratingValidator.getBeverageRatings,
    validate,
    ratingController.getBeverageWithRating
);

/**
 * DELETE /api/ratings/beverage/:beverageId
 * Delete current user's rating for a beverage
 */
router.delete(
    '/beverage/:beverageId',
    ratingValidator.deleteRating,
    validate,
    ratingController.deleteRating
);

module.exports = router;
