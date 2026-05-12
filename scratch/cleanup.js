require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');
const Category = require('../server/models/Category');
const Rental = require('../server/models/Rental');
const MaintenanceRequest = require('../server/models/MaintenanceRequest');

async function clearGarbage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for cleanup...');

        await Product.deleteMany({});
        await Order.deleteMany({});
        await Category.deleteMany({});
        await Rental.deleteMany({});
        await MaintenanceRequest.deleteMany({});
        
        // Keep only the admin user
        const result = await User.deleteMany({ email: { $ne: 'admin@rentease.com' } });
        
        console.log('Cleared all products, categories, orders, rentals, and tickets.');
        console.log(`Removed ${result.deletedCount} users. Only admin@rentease.com remains.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

clearGarbage();
