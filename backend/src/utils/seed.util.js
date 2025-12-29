/**
 * Database Seed Utility
 * Seeds initial data for the application
 */

const { User, Beverage } = require('../models');
const logger = require('./logger.util');
const { USER_ROLES } = require('../config/constants');

class SeedUtil {
    async seedDatabase() {
        try {
            // Check if users already exist
            const userCount = await User.countDocuments();
            if (userCount > 0) {
                logger.info('Database already seeded, skipping...');
                return;
            }

            logger.info('📦 Seeding initial data...');

            // Create admin user
            await User.create({
                username: 'admin',
                password_hash: 'admin123',
                full_name: 'System Administrator',
                email: 'admin@beverage-system.com',
                role: USER_ROLES.ADMIN,
            });

            // Create office boy user
            await User.create({
                username: 'officeBoy',
                password_hash: 'office123',
                full_name: 'Office Boy',
                email: 'office@beverage-system.com',
                role: USER_ROLES.OFFICE_BOY,
            });

            // Create sample employees
            await User.create({
                username: 'ahmed',
                password_hash: 'ahmed123',
                full_name: 'Ahmed Hassan',
                email: 'ahmed@company.com',
                department: 'IT',
                role: USER_ROLES.EMPLOYEE,
            });

            await User.create({
                username: 'sara',
                password_hash: 'sara123',
                full_name: 'Sara Mohamed',
                email: 'sara@company.com',
                department: 'HR',
                role: USER_ROLES.EMPLOYEE,
            });

            // Create sample beverages
            const beverages = [
                // Coffee
                { name: 'Espresso', category: 'coffee', description: 'Strong Italian coffee', stock_quantity: 50, unit: 'كوب', min_stock_alert: 10, caffeine_level: 'high' },
                { name: 'Cappuccino', category: 'coffee', description: 'Espresso with steamed milk foam', stock_quantity: 45, unit: 'كوب', min_stock_alert: 10, caffeine_level: 'medium' },
                { name: 'Latte', category: 'coffee', description: 'Espresso with steamed milk', stock_quantity: 40, unit: 'كوب', min_stock_alert: 10, caffeine_level: 'medium' },
                { name: 'Turkish Coffee', category: 'coffee', description: 'Traditional Turkish coffee', stock_quantity: 30, unit: 'كوب', min_stock_alert: 10, caffeine_level: 'high' },
                // Tea
                { name: 'Green Tea', category: 'tea', description: 'Healthy green tea', stock_quantity: 60, unit: 'كيس', min_stock_alert: 15, caffeine_level: 'low' },
                { name: 'Black Tea', category: 'tea', description: 'Classic black tea', stock_quantity: 55, unit: 'كيس', min_stock_alert: 15, caffeine_level: 'low' },
                { name: 'Chamomile Tea', category: 'tea', description: 'Relaxing herbal tea', stock_quantity: 35, unit: 'كيس', min_stock_alert: 10, caffeine_level: 'none' },
                { name: 'Mint Tea', category: 'tea', description: 'Refreshing mint tea', stock_quantity: 40, unit: 'كيس', min_stock_alert: 10, caffeine_level: 'none' },
                // Juice & Smoothies
                { name: 'Orange Juice', category: 'juice', description: 'Fresh orange juice', stock_quantity: 25, unit: 'زجاجة', min_stock_alert: 8, caffeine_level: 'none' },
                { name: 'Apple Juice', category: 'juice', description: 'Fresh apple juice', stock_quantity: 20, unit: 'زجاجة', min_stock_alert: 8, caffeine_level: 'none' },
                { name: 'Mango Smoothie', category: 'smoothie', description: 'Creamy mango smoothie', stock_quantity: 15, unit: 'كوب', min_stock_alert: 5, caffeine_level: 'none' },
                { name: 'Berry Smoothie', category: 'smoothie', description: 'Mixed berry smoothie', stock_quantity: 12, unit: 'كوب', min_stock_alert: 5, caffeine_level: 'none' },
            ];

            await Beverage.insertMany(beverages);

            logger.info('✅ Initial data seeded successfully');
            logger.info('📌 Default credentials:');
            logger.info('   Admin: username=admin, password=admin123');
            logger.info('   Office Boy: username=officeBoy, password=office123');
            logger.info('   Employee: username=ahmed, password=ahmed123');
            logger.info('   Employee: username=sara, password=sara123');
        } catch (error) {
            logger.error('❌ Seeding error:', error);
            throw error;
        }
    }
}

module.exports = new SeedUtil();
