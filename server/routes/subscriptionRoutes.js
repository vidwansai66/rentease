const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/plans', subscriptionController.getPlans);
router.get('/me', protect, subscriptionController.getMySubscription);
router.post('/upgrade', protect, subscriptionController.upgradeSubscription);

module.exports = router;
