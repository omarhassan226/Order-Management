/**
 * Auth Routes
 * Authentication endpoints
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginValidator } = require('../validators/auth.validator');

const router = express.Router();

// POST /api/auth/login - Login
router.post('/login', loginValidator, validate, authController.login);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
