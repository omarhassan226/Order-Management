/**
 * Report Routes
 * Report and analytics endpoints
 */

const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/authorize.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', reportController.getDashboardStats);

// GET /api/reports/popular - Get popular beverages
router.get('/popular', reportController.getPopularBeverages);

// GET /api/reports/inventory - Get inventory status
router.get('/inventory', reportController.getInventoryStatus);

// GET /api/reports/consumption - Get consumption trends
router.get('/consumption', reportController.getConsumptionTrends);

// GET /api/reports/export/pdf - Export PDF report
router.get('/export/pdf', reportController.exportPDF);

// GET /api/reports/export/excel - Export Excel report
router.get('/export/excel', reportController.exportExcel);

module.exports = router;
