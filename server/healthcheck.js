require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 RentEase Healthcheck\n' + '─'.repeat(40));

let allOk = true;

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'NODE_ENV'];
requiredEnv.forEach(key => {
    if (process.env[key]) {
        console.log(`✅ ENV: ${key}`);
    } else {
        console.error(`❌ ENV missing: ${key}`);
        allOk = false;
    }
});

const requiredFiles = [
    'server/server.js',
    'server/config/db.js',
    'server/models/User.js',
    'server/models/Product.js',
    'server/models/Order.js',
    'server/models/Rental.js',
    'server/models/MaintenanceRequest.js',
    'server/models/Category.js',
    'server/controllers/authController.js',
    'server/controllers/productController.js',
    'server/controllers/orderController.js',
    'server/controllers/rentalController.js',
    'server/controllers/maintenanceController.js',
    'server/controllers/adminController.js',
    'server/controllers/userController.js',
    'server/routes/authRoutes.js',
    'server/routes/productRoutes.js',
    'server/routes/orderRoutes.js',
    'server/routes/rentalRoutes.js',
    'server/routes/maintenanceRoutes.js',
    'server/routes/adminRoutes.js',
    'server/routes/userRoutes.js',
    'server/middleware/authMiddleware.js',
    'server/middleware/uploadMiddleware.js',
    'server/middleware/errorHandler.js',
    'server/utils/sendResponse.js',
    'server/utils/validators.js',
    'server/seed.js',
    'public/css/variables.css',
    'public/css/reset.css',
    'public/css/global.css',
    'public/css/components.css',
    'public/css/animations.css',
    'public/css/responsive.css',
    'public/js/api.js',
    'public/js/auth.js',
    'public/js/cart.js',
    'public/js/toast.js',
    'public/js/loader.js',
    'public/js/utils.js',
    'public/pages/index.html',
    'public/pages/products.html',
    'public/pages/product-detail.html',
    'public/pages/cart.html',
    'public/pages/checkout.html',
    'public/pages/login.html',
    'public/pages/register.html',
    'public/pages/dashboard.html',
    'public/pages/active-rentals.html',
    'public/pages/rental-history.html',
    'public/pages/maintenance.html',
    'public/pages/admin/dashboard.html',
    'public/pages/admin/products.html',
    'public/pages/admin/orders.html'
];

requiredFiles.forEach(f => {
    const fullPath = path.join(process.cwd(), f);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ File: ${f}`);
    } else {
        console.error(`❌ Missing: ${f}`);
        allOk = false;
    }
});

console.log('\n' + '─'.repeat(40));
if (allOk) {
    console.log('🚀 All checks passed! Run: npm run dev');
} else {
    console.log('❌ Fix the errors above before starting the server');
}

process.exit(allOk ? 0 : 1);
