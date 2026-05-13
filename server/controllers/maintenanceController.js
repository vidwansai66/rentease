const MaintenanceRequest = require('../models/MaintenanceRequest');
const Rental = require('../models/Rental');
const sendResponse = require('../utils/sendResponse');

// @desc    Create maintenance ticket
// @route   POST /api/v1/maintenance
// @access  Private
exports.createTicket = async (req, res, next) => {
    try {
        const { rentalId, issueType, description } = req.body;

        const rental = await Rental.findOne({ 
            _id: rentalId, 
            user: req.user._id, 
            status: { $in: ['active', 'extended'] } 
        });

        if (!rental) {
            return sendResponse(res, 403, false, 'Rental not found or not active');
        }

        if (!issueType || !description) {
            return sendResponse(res, 400, false, 'Issue type and description are required');
        }

        const images = req.files ? req.files.map(f => '/images/uploads/' + f.filename) : [];
        const priority = ['malfunction', 'damage'].includes(issueType) ? 'high' : 'medium';

        const ticket = new MaintenanceRequest({
            rental: rentalId,
            user: req.user._id,
            product: rental.product,
            issueType,
            description,
            images,
            priority,
            statusHistory: [{
                status: 'submitted',
                timestamp: new Date(),
                note: 'Ticket submitted by user'
            }]
        });

        await ticket.save();

        sendResponse(res, 201, true, 'Maintenance ticket created successfully', { ticket });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my tickets
// @route   GET /api/v1/maintenance
// @access  Private
exports.getMyTickets = async (req, res, next) => {
    try {
        const tickets = await MaintenanceRequest.find({ user: req.user._id })
            .sort('-createdAt')
            .populate('product', 'name images')
            .populate('rental', 'rentalPlan startDate endDate');

        sendResponse(res, 200, true, 'Tickets fetched successfully', { tickets });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ticket by ID
// @route   GET /api/v1/maintenance/:id
// @access  Private
exports.getTicketById = async (req, res, next) => {
    try {
        const ticket = await MaintenanceRequest.findOne({ 
            _id: req.params.id, 
            user: req.user._id 
        })
        .populate('product', 'name images brand')
        .populate('rental');

        if (!ticket) {
            return sendResponse(res, 404, false, 'Ticket not found or access denied');
        }

        sendResponse(res, 200, true, 'Ticket details fetched', { ticket });
    } catch (error) {
        next(error);
    }
};


