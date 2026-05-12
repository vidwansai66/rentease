const express = require('express');
const { 
    getStats, 
    getRevenueChart,
    adminGetProducts,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    adminUpdateStock,
    adminApproveProduct,
    adminGetOrders,
    adminGetOrderById,
    adminUpdateOrderStatus,
    adminGetUsers,
    adminUpdateUserRole,
    adminDeleteUser,
    adminGetMaintenanceRequests,
    adminUpdateMaintenanceStatus,
    adminGetSettings,
    adminUpdateSettings,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getStats);
router.get('/revenue-chart', getRevenueChart);

// Product Management
router.get('/products', adminGetProducts);
router.post('/products', uploadMultiple, adminCreateProduct);
router.put('/products/:id', uploadMultiple, adminUpdateProduct);
router.delete('/products/:id', adminDeleteProduct);
router.put('/products/:id/stock', adminUpdateStock);
router.put('/products/:id/approve', adminApproveProduct);

// Order Management
router.get('/orders', adminGetOrders);
router.get('/orders/:id', adminGetOrderById);
router.put('/orders/:id/status', adminUpdateOrderStatus);

// User Management
router.get('/users', adminGetUsers);
router.put('/users/:id/role', adminUpdateUserRole);
router.delete('/users/:id', adminDeleteUser);

// Maintenance Management
router.get('/maintenance', adminGetMaintenanceRequests);
router.put('/maintenance/:id/status', adminUpdateMaintenanceStatus);

// Platform Settings
router.get('/settings', adminGetSettings);
router.put('/settings', adminUpdateSettings);

// Category Management
router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

module.exports = router;
