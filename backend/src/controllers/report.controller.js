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

    async getEmployeeStats(req, res, next) {
        try {
            const employeeStats = await reportService.getEmployeeStats();
            return response.success(res, { employeeStats }, 'Employee stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getTopConsumers(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const topConsumers = await reportService.getTopConsumers(limit);
            return response.success(res, { topConsumers }, 'Top consumers retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getFastMovingItems(req, res, next) {
        try {
            const fastMovingItems = await reportService.getFastMovingItems();
            return response.success(res, { fastMovingItems }, 'Fast moving items retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeActivity(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const activityData = await reportService.getEmployeeActivity(days);
            return response.success(res, { activityData }, 'Employee activity retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getDailyLoginStats(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const loginStats = await reportService.getDailyLoginStats(days);
            return response.success(res, { loginStats }, 'Daily login stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentlyOnline(req, res, next) {
        try {
            const onlineUsers = await reportService.getCurrentlyOnlineUsers();
            return response.success(res, { onlineUsers }, 'Online users retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getStockFlow(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const beverageId = req.query.beverage_id || null;
            const stockFlow = await reportService.getStockFlowData(beverageId, days);
            return response.success(res, { stockFlow }, 'Stock flow data retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getInventoryTurnover(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const turnoverData = await reportService.getInventoryTurnover(days);
            return response.success(res, { turnoverData }, 'Inventory turnover retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getComprehensiveAnalytics(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const analytics = await reportService.getComprehensiveAnalytics(days);
            return response.success(res, analytics, 'Comprehensive analytics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReportController();
