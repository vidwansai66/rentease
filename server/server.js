require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const orderRoutes = require('./routes/orderRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

// Initialize app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vendor', vendorRoutes);

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "API Route not found"
    });
});

// Error Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Database Connection
connectDB().then(() => {
    if (process.env.NODE_ENV === 'development') {
        ensureIndexes();
    }
});

// Process handlers
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err?.message || err}`);
});

// Export for Vercel
module.exports = app;

// Local development start
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 RentEase Server running on port ${PORT}`);
    });
}

async function ensureIndexes() {
    try {
        const User = require('./models/User');
        const Product = require('./models/Product');
        const Order = require('./models/Order');
        const Rental = require('./models/Rental');
        const MaintenanceRequest = require('./models/MaintenanceRequest');

        // Drop conflicting text index if exists
        try {
            const indexes = await Product.collection.indexes();
            const textIndex = indexes.find(idx => Object.values(idx.key).includes('text'));
            if (textIndex && textIndex.name !== 'name_text_brand_text_tags_text_shortDescription_text') {
                await Product.collection.dropIndex(textIndex.name);
                console.log('🗑️ Old text index dropped');
            }
        } catch (e) {
            // Index might not exist yet
        }

        await Promise.all([
            User.collection.createIndex({ email: 1 }, { unique: true, background: true }),
            Product.collection.createIndex({ slug: 1 }, { unique: true, background: true }),
            Product.collection.createIndex({ category: 1, isAvailable: 1 }, { background: true }),
            Product.collection.createIndex({ isFeatured: 1 }, { background: true }),
            Product.collection.createIndex({ name: 'text', brand: 'text', tags: 'text', shortDescription: 'text' }, { background: true }),
            Order.collection.createIndex({ user: 1 }, { background: true }),
            Order.collection.createIndex({ orderNumber: 1 }, { unique: true, background: true }),
            Rental.collection.createIndex({ user: 1, status: 1 }, { background: true }),
            Rental.collection.createIndex({ endDate: 1 }, { background: true }),
            MaintenanceRequest.collection.createIndex({ user: 1, status: 1 }, { background: true }),
        ]);
        console.log('📑 Database indexes verified');
    } catch (e) {
        console.error('Index creation warning:', e.message);
    }
}
