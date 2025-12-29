/**
 * Beverage Controller
 * Handles beverage management requests
 */

const beverageService = require('../services/beverage.service');
const response = require('../utils/response.util');

class BeverageController {
    async getAllBeverages(req, res, next) {
        try {
            const beverages = await beverageService.getAllBeverages(req.query);
            return response.success(res, { beverages }, 'Beverages retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getBeverageById(req, res, next) {
        try {
            const beverage = await beverageService.getBeverageById(req.params.id);
            return response.success(res, { beverage }, 'Beverage retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createBeverage(req, res, next) {
        try {
            const beverage = await beverageService.createBeverage(req.body);
            return response.created(res, { beverage }, 'Beverage created successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateBeverage(req, res, next) {
        try {
            const beverage = await beverageService.updateBeverage(req.params.id, req.body);
            return response.success(res, { beverage }, 'Beverage updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteBeverage(req, res, next) {
        try {
            await beverageService.deleteBeverage(req.params.id);
            return response.success(res, null, 'Beverage deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BeverageController();
