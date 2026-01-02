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

    async getEmployeeStats() {
        return await orderRepository.getEmployeeStats();
    }

    async getTopConsumers(limit = 10) {
        return await orderRepository.getTopConsumers(limit);
    }

    async getFastMovingItems() {
        return await orderRepository.getFastMovingItems();
    }

    async generatePDF(date, res) {
        try {
            const [orders, beverages, stats] = await Promise.all([
                orderRepository.findOrdersWithDetails({
                    where: { order_date: date },
                }),
                beverageRepository.getAll(),
                this.getDashboardStats()
            ]);

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${date}.pdf`);
            doc.pipe(res);

            // Header
            doc.fontSize(24).text('Beverage Management System Report', { align: 'center', underline: true });
            doc.moveDown();
            doc.fontSize(16).text(`Report Date: ${date}`, { align: 'center' });
            doc.moveDown(2);

            // Summary Section
            doc.fontSize(18).text('Daily Summary', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            doc.text(`Total Orders: ${orders.length}`);
            doc.text(`Pending: ${orders.filter(o => o.status === 'pending').length}`);
            doc.text(`Fulfilled: ${orders.filter(o => o.status === 'fulfilled').length}`);
            doc.text(`Cancelled: ${orders.filter(o => o.status === 'cancelled').length}`);
            doc.text(`Total Beverages in System: ${stats.totalBeverages}`);
            doc.text(`Low Stock Items: ${stats.lowStockCount}`);
            doc.text(`Out of Stock Items: ${stats.outOfStockCount}`);
            doc.moveDown(2);

            // Stock Status Section
            doc.fontSize(18).text('Current Stock Status', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            
            const lowStockItems = beverages.filter(b => b.stock_quantity <= b.min_stock_alert && b.stock_quantity > 0);
            const outOfStockItems = beverages.filter(b => b.stock_quantity === 0);
            
            if (outOfStockItems.length > 0) {
                doc.fontSize(12).fillColor('red').text('OUT OF STOCK:', { continued: false });
                doc.fontSize(10).fillColor('black');
                outOfStockItems.forEach(item => {
                    doc.text(`  - ${item.name}: 0 ${item.unit}`);
                });
                doc.moveDown();
            }
            
            if (lowStockItems.length > 0) {
                doc.fontSize(12).fillColor('orange').text('LOW STOCK WARNING:', { continued: false });
                doc.fontSize(10).fillColor('black');
                lowStockItems.forEach(item => {
                    doc.text(`  - ${item.name}: ${item.stock_quantity} ${item.unit} (Min: ${item.min_stock_alert})`);
                });
                doc.moveDown();
            }
            doc.moveDown();

            // Orders Detail Section
            if (orders.length > 0) {
                doc.addPage();
                doc.fontSize(18).text('Orders Details', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(9);

                orders.forEach((order, index) => {
                    const statusEmoji = order.status === 'fulfilled' ? '✓' : order.status === 'cancelled' ? '✗' : '⏳';
                    doc.text(
                        `${index + 1}. ${statusEmoji} ${order.employee_id?.full_name || 'Unknown'} ` +
                        `(${order.employee_id?.department || 'N/A'}) - ` +
                        `${order.beverage_id?.name || 'Unknown Beverage'} ` +
                        `[${order.cup_size}, ${order.sugar_quantity} sugar] - ` +
                        `${order.status.toUpperCase()}`
                    );
                    
                    // Add page break if needed
                    if (index > 0 && index % 40 === 0) {
                        doc.addPage();
                    }
                });
            }

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toISOString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
            logger.info(`PDF report generated for ${date}`);
        } catch (error) {
            logger.error('Error generating PDF:', error);
            throw error;
        }
    }

    async generateExcel(date, res) {
        try {
            const [orders, beverages, stats, popularBeverages] = await Promise.all([
                orderRepository.findOrdersWithDetails({
                    where: { order_date: date },
                }),
                beverageRepository.getAll(),
                this.getDashboardStats(),
                this.getPopularBeverages(10)
            ]);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Beverage Management System';
            workbook.created = new Date();

            // ===== Orders Sheet =====
            const ordersSheet = workbook.addWorksheet('Orders Report');
            ordersSheet.columns = [
                { header: 'Order ID', key: 'id', width: 25 },
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
            ordersSheet.getRow(1).font = { bold: true, size: 12 };
            ordersSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            };
            ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add orders data
            orders.forEach(order => {
                const row = ordersSheet.addRow({
                    id: order._id?.toString() || '',
                    employee: order.employee_id?.full_name || 'Unknown',
                    department: order.employee_id?.department || 'N/A',
                    beverage: order.beverage_id?.name || 'Unknown',
                    category: order.beverage_id?.category || 'N/A',
                    cup_size: order.cup_size,
                    sugar: order.sugar_quantity,
                    status: order.status,
                    date: order.order_date,
                });

                // Color code status
                if (order.status === 'fulfilled') {
                    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
                } else if (order.status === 'cancelled') {
                    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                } else {
                    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
                }
            });

            // ===== Stock Status Sheet =====
            const stockSheet = workbook.addWorksheet('Stock Status');
            stockSheet.columns = [
                { header: 'Beverage Name', key: 'name', width: 25 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Current Stock', key: 'stock', width: 15 },
                { header: 'Unit', key: 'unit', width: 10 },
                { header: 'Min Stock Alert', key: 'min_stock', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
            ];

            // Style header
            stockSheet.getRow(1).font = { bold: true, size: 12 };
            stockSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF70AD47' },
            };
            stockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add stock data
            beverages.forEach(beverage => {
                let status = 'OK';
                if (beverage.stock_quantity === 0) status = 'OUT OF STOCK';
                else if (beverage.stock_quantity <= beverage.min_stock_alert) status = 'LOW STOCK';

                const row = stockSheet.addRow({
                    name: beverage.name,
                    category: beverage.category,
                    stock: beverage.stock_quantity,
                    unit: beverage.unit,
                    min_stock: beverage.min_stock_alert,
                    status: status,
                });

                // Color code stock status
                if (status === 'OUT OF STOCK') {
                    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                    row.getCell('status').font = { color: { argb: 'FFFFFFFF' }, bold: true };
                } else if (status === 'LOW STOCK') {
                    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
                }
            });

            // ===== Summary Sheet =====
            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Metric', key: 'metric', width: 30 },
                { header: 'Value', key: 'value', width: 15 },
            ];

            summarySheet.getRow(1).font = { bold: true, size: 12 };
            summarySheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFED7D31' },
            };
            summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add summary data
            summarySheet.addRow({ metric: 'Report Date', value: date });
            summarySheet.addRow({ metric: 'Total Orders', value: orders.length });
            summarySheet.addRow({ metric: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length });
            summarySheet.addRow({ metric: 'Fulfilled Orders', value: orders.filter(o => o.status === 'fulfilled').length });
            summarySheet.addRow({ metric: 'Cancelled Orders', value: orders.filter(o => o.status === 'cancelled').length });
            summarySheet.addRow({ metric: '', value: '' }); // Empty row
            summarySheet.addRow({ metric: 'Total Beverages', value: stats.totalBeverages });
            summarySheet.addRow({ metric: 'Low Stock Items', value: stats.lowStockCount });
            summarySheet.addRow({ metric: 'Out of Stock Items', value: stats.outOfStockCount });

            // ===== Popular Beverages Sheet =====
            const popularSheet = workbook.addWorksheet('Popular Beverages');
            popularSheet.columns = [
                { header: 'Rank', key: 'rank', width: 10 },
                { header: 'Beverage', key: 'beverage', width: 25 },
                { header: 'Order Count', key: 'count', width: 15 },
            ];

            popularSheet.getRow(1).font = { bold: true, size: 12 };
            popularSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC000' },
            };
            popularSheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };

            popularBeverages.forEach((item, index) => {
                popularSheet.addRow({
                    rank: index + 1,
                    beverage: item.beverage?.name || 'Unknown',
                    count: item.count
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

    /**
     * Get employee activity data (login/logout tracking)
     */
    async getEmployeeActivity(days = 30) {
        const userSessionRepository = require('../repositories/userSession.repository');
        return await userSessionRepository.getEmployeeActivityStats(days);
    }

    /**
     * Get daily login statistics
     */
    async getDailyLoginStats(days = 30) {
        const userSessionRepository = require('../repositories/userSession.repository');
        return await userSessionRepository.getDailyLoginStats(days);
    }

    /**
     * Get currently online users
     */
    async getCurrentlyOnlineUsers() {
        const userSessionRepository = require('../repositories/userSession.repository');
        return await userSessionRepository.getCurrentlyOnlineUsers();
    }

    /**
     * Get stock flow data for flowcharts
     * Shows inventory changes over time
     */
    async getStockFlowData(beverageId = null, days = 30) {
        try {
            const inventoryRepository = require('../repositories/inventory.repository');
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const filter = { createdAt: { $gte: startDate } };
            if (beverageId) {
                filter.beverage_id = beverageId;
            }

            const transactions = await inventoryRepository.find(filter);
            
            // Group by date and transaction type
            const flowData = {};
            transactions.forEach(trans => {
                const date = trans.createdAt.toISOString().split('T')[0];
                if (!flowData[date]) {
                    flowData[date] = { date, additions: 0, deductions: 0, adjustments: 0 };
                }
                
                if (trans.transaction_type === 'addition') {
                    flowData[date].additions += trans.quantity;
                } else if (trans.transaction_type === 'deduction') {
                    flowData[date].deductions += trans.quantity;
                } else if (trans.transaction_type === 'adjustment') {
                    flowData[date].adjustments += trans.quantity;
                }
            });

            return Object.values(flowData).sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            logger.error('Error getting stock flow data:', error);
            return [];
        }
    }

    /**
     * Get inventory turnover rate
     */
    async getInventoryTurnover(days = 30) {
        try {
            const beverages = await beverageRepository.getAll();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const turnoverData = [];

            for (const beverage of beverages) {
                const orders = await orderRepository.findOrdersWithDetails({
                    where: {
                        beverage_id: beverage._id,
                        order_date: { $gte: startDate },
                        status: 'fulfilled'
                    }
                });

                const totalOrdered = orders.length;
                const turnoverRate = beverage.stock_quantity > 0
                    ? (totalOrdered / days).toFixed(2)
                    : 0;

                turnoverData.push({
                    beverage: beverage.name,
                    currentStock: beverage.stock_quantity,
                    totalOrdered,
                    dailyAverage: turnoverRate,
                    daysUntilEmpty: beverage.stock_quantity > 0 && turnoverRate > 0
                        ? Math.ceil(beverage.stock_quantity / parseFloat(turnoverRate))
                        : null
                });
            }

            return turnoverData.sort((a, b) => b.dailyAverage - a.dailyAverage);
        } catch (error) {
            logger.error('Error calculating inventory turnover:', error);
            return [];
        }
    }

    /**
     * Get comprehensive analytics for dashboard
     */
    async getComprehensiveAnalytics(days = 30) {
        try {
            const [
                dashboardStats,
                popularBeverages,
                topConsumers,
                fastMovingItems,
                employeeStats,
                consumptionTrends,
                inventoryTurnover
            ] = await Promise.allSettled([
                this.getDashboardStats(),
                this.getPopularBeverages(10),
                this.getTopConsumers(10),
                this.getFastMovingItems(),
                this.getEmployeeStats(),
                this.getConsumptionTrends(days),
                this.getInventoryTurnover(days)
            ]);

            return {
                dashboardStats: dashboardStats.status === 'fulfilled' ? dashboardStats.value : {},
                popularBeverages: popularBeverages.status === 'fulfilled' ? popularBeverages.value : [],
                topConsumers: topConsumers.status === 'fulfilled' ? topConsumers.value : [],
                fastMovingItems: fastMovingItems.status === 'fulfilled' ? fastMovingItems.value : [],
                employeeStats: employeeStats.status === 'fulfilled' ? employeeStats.value : [],
                consumptionTrends: consumptionTrends.status === 'fulfilled' ? consumptionTrends.value : [],
                inventoryTurnover: inventoryTurnover.status === 'fulfilled' ? inventoryTurnover.value : []
            };
        } catch (error) {
            logger.error('Error getting comprehensive analytics:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
