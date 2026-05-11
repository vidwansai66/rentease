const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All vendor routes are protected
router.use(protect);

// Registration/Upgrade to vendor
router.post('/register', vendorController.registerVendor);

// Vendor specific routes
router.use(authorize('vendor'));

router.get('/stats', vendorController.getVendorStats);
router.get('/products', vendorController.getVendorProducts);
router.post('/products', vendorController.createVendorProduct);
router.put('/products/:id', vendorController.updateVendorProduct);
router.delete('/products/:id', vendorController.deleteVendorProduct);
router.get('/orders', vendorController.getVendorOrders);

module.exports = router;
