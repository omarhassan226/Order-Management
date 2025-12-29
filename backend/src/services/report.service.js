/**
 * Report Service
 * Business logic for report generation and analytics
 */

const orderRepository = require('../repositories/order.repository');
const beverageRepository = require('../repositories/beverage.repository');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger.util');

class ReportService {
    async getDashboardStats() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const dailyOrdersCount = await orderRepository.getDailyOrderCount(today);
            const stockCounts = await beverageRepository.getStockCounts();

            return {
                dailyOrdersCount,
                outOfStockCount: stockCounts.outOfStock,
                lowStockCount: stockCounts.lowStock,
                totalBeverages: stockCounts.total,
            };
        } catch (error) {
            logger.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    async getPopularBeverages(limit = 10) {
        return await orderRepository.getPopularBeverages(limit);
    }

    async getInventoryStatus() {
        return await beverageRepository.getInventoryStatus();
    }

    async getConsumptionTrends(days = 30) {
        return await orderRepository.getConsumptionTrends(days);
    }

    async generatePDF(date, res) {
        try {
            const orders = await orderRepository.findOrdersWithDetails({
                where: { order_date: date },
            });

            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${date}.pdf`);
            doc.pipe(res);

            // Title
            doc.fontSize(20).text('Beverage System Report', { align: 'center' });
            doc.moveDown();

            // Summary
            doc.fontSize(14).text(`Date: ${date}`);
            doc.text(`Total Orders: ${orders.length}`);
            doc.text(`Pending: ${orders.filter(o => o.status === 'pending').length}`);
            doc.text(`Fulfilled: ${orders.filter(o => o.status === 'fulfilled').length}`);
            doc.text(`Cancelled: ${orders.filter(o => o.status === 'cancelled').length}`);
            doc.moveDown();

            // Orders list
            doc.fontSize(12).text('Orders:', { underline: true });
            doc.moveDown(0.5);

            orders.forEach((order, index) => {
                doc.text(
                    `${index + 1}. ${order.employee.full_name} (${order.employee.department || 'N/A'}) - ` +
                    `${order.beverage.name} [${order.cup_size}, ${order.sugar_quantity} sugar] - ${order.status}`
                );
            });

            doc.end();
            logger.info(`PDF report generated for ${date}`);
        } catch (error) {
            logger.error('Error generating PDF:', error);
            throw error;
        }
    }

    async generateExcel(date, res) {
        try {
            const orders = await orderRepository.findOrdersWithDetails({
                where: { order_date: date },
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Orders Report');

            // Define columns
            worksheet.columns = [
                { header: 'Order ID', key: 'id', width: 10 },
                { header: 'Employee', key: 'employee', width: 20 },
                { header: 'Department', key: 'department', width: 15 },
                { header: 'Beverage', key: 'beverage', width: 20 },
                { header: 'Category', key: 'category', width: 12 },
                { header: 'Cup Size', key: 'cup_size', width: 10 },
                { header: 'Sugar', key: 'sugar', width: 10 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Date', key: 'date', width: 12 },
            ];

            // Style header
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            };

            // Add rows
            orders.forEach(order => {
                worksheet.addRow({
                    id: order.id,
                    employee: order.employee.full_name,
                    department: order.employee.department || 'N/A',
                    beverage: order.beverage.name,
                    category: order.beverage.category,
                    cup_size: order.cup_size,
                    sugar: order.sugar_quantity,
                    status: order.status,
                    date: order.order_date,
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report-${date}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

            logger.info(`Excel report generated for ${date}`);
        } catch (error) {
            logger.error('Error generating Excel:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
