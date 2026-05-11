const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All order routes are protected

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

module.exports = router;
