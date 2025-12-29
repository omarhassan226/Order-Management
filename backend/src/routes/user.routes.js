/**
 * User Routes
 * User management endpoints
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createUserValidator, updateUserValidator, userIdValidator } = require('../validators/user.validator');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userIdValidator, validate, userController.getUserById);

// POST /api/users - Create user
router.post('/', createUserValidator, validate, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUserValidator, validate, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userIdValidator, validate, userController.deleteUser);

module.exports = router;
