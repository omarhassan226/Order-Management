/**
 * Report Controller
 * Handles report generation requests
 */

const reportService = require('../services/report.service');
const response = require('../utils/response.util');

class ReportController {
    async getDashboardStats(req, res, next) {
        try {
            const stats = await reportService.getDashboardStats();
            return response.success(res, stats, 'Dashboard stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getPopularBeverages(req, res, next) {
        try {
            const popularBeverages = await reportService.getPopularBeverages();
            return response.success(res, { popularBeverages }, 'Popular beverages retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getInventoryStatus(req, res, next) {
        try {
            const inventoryData = await reportService.getInventoryStatus();
            return response.success(res, { inventoryData }, 'Inventory status retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getConsumptionTrends(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const consumptionData = await reportService.getConsumptionTrends(days);
            return response.success(res, { consumptionData }, 'Consumption trends retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async exportPDF(req, res, next) {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            await reportService.generatePDF(date, res);
        } catch (error) {
            next(error);
        }
    }

    async exportExcel(req, res, next) {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            await reportService.generateExcel(date, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReportController();
