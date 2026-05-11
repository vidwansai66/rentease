const express = require('express');
const { 
    getDashboardData, 
    getActiveRentals, 
    extendRental, 
    requestReturn 
} = require('../controllers/rentalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All rental routes are protected

router.get('/dashboard', getDashboardData);
router.get('/', getActiveRentals);
router.put('/:id/extend', extendRental);
router.post('/:id/return-request', requestReturn);

module.exports = router;
