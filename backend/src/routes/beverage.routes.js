/**
 * Beverage Routes
 * Beverage management endpoints
 */

const express = require('express');
const beverageController = require('../controllers/beverage.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createBeverageValidator, updateBeverageValidator, beverageIdValidator } = require('../validators/beverage.validator');

const router = express.Router();

// GET /api/beverages - Get all beverages (all authenticated users)
router.get('/', authenticate, beverageController.getAllBeverages);

// GET /api/beverages/:id - Get beverage by ID (all authenticated users)
router.get('/:id', authenticate, beverageIdValidator, validate, beverageController.getBeverageById);

// POST /api/beverages - Create beverage (admin only)
router.post('/', authenticate, isAdmin, createBeverageValidator, validate, beverageController.createBeverage);

// PUT /api/beverages/:id - Update beverage (admin only)
router.put('/:id', authenticate, isAdmin, updateBeverageValidator, validate, beverageController.updateBeverage);

// DELETE /api/beverages/:id - Delete beverage (admin only)
router.delete('/:id', authenticate, isAdmin, beverageIdValidator, validate, beverageController.deleteBeverage);

module.exports = router;
