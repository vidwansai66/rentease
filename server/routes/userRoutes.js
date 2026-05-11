const express = require('express');
const { 
    getRentalHistory, 
    updateProfile, 
    changePassword 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/rentals/history', getRentalHistory);
router.put('/profile', uploadSingle, updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
