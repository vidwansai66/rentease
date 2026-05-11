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
    adminUpdateOrderStatus
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

// Stubs for future management modules
router.get('/maintenance', (req, res) => res.json({ message: 'Maintenance stub' }));

module.exports = router;
