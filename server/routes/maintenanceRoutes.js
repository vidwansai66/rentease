const express = require('express');
const { 
    createTicket, 
    getMyTickets, 
    getTicketById 
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', uploadMultiple, createTicket);
router.get('/', getMyTickets);
router.get('/:id', getTicketById);

module.exports = router;
