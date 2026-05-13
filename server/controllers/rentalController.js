const Rental = require('../models/Rental');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Order = require('../models/Order');
const sendResponse = require('../utils/sendResponse');

// @desc    Get data for user dashboard
// @route   GET /api/v1/rentals/dashboard
// @access  Private
exports.getDashboardData = async (req, res, next) => {
    try {
        const id = req.user._id;
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [activeRentalsCount, activeRentals, openTickets, recentRentals, recentOrders] = await Promise.all([
            Rental.countDocuments({ user: id, status: 'active' }),
            Rental.find({ user: id, status: 'active' }).select('rentalPlan'),
            MaintenanceRequest.countDocuments({ user: id, status: { $nin: ['resolved', 'closed'] } }),
            Rental.find({ user: id, status: 'active' }).sort('-createdAt').limit(3).populate('product', 'name images brand'),
            Order.find({ user: id }).sort('-createdAt').limit(5).populate('items.product', 'name images')
        ]);

        const monthlyTotal = activeRentals.reduce((s, r) => s + (r.rentalPlan?.monthlyPrice || 0), 0);
        
        const upcomingPayments = await Rental.find({ 
            user: id, 
            status: 'active', 
            nextPaymentDate: { $lte: thirtyDaysLater } 
        }).populate('product', 'name images');

        sendResponse(res, 200, true, 'Dashboard data fetched successfully', {
            activeRentalsCount,
            monthlyTotal,
            openTickets,
            recentRentals,
            upcomingPayments,
            recentOrders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active rentals for user
// @route   GET /api/v1/rentals
// @access  Private
exports.getActiveRentals = async (req, res, next) => {
    try {
        const rentals = await Rental.find({ 
            user: req.user._id, 
            status: { $in: ['active', 'paused', 'extended', 'expired'] } 
        })
        .populate('product', 'name images brand category')
        .populate('order', 'orderNumber');

        const enriched = rentals.map(r => {
            const start = new Date(r.startDate).getTime();
            const end = new Date(r.endDate).getTime();
            const now = Date.now();

            const daysTotal = Math.max(1, Math.ceil((end - start) / 86400000));
            const daysElapsed = Math.max(0, Math.ceil((now - start) / 86400000));
            const percentRemaining = Math.max(0, Math.min(100, Math.round((1 - (daysElapsed / daysTotal)) * 100)));
            const isExpiringSoon = r.endDate < new Date(now + 30 * 24 * 60 * 60 * 1000);

            return {
                ...r.toObject(),
                daysTotal,
                daysElapsed,
                percentRemaining,
                isExpiringSoon
            };
        });

        sendResponse(res, 200, true, 'Active rentals fetched successfully', { rentals: enriched });
    } catch (error) {
        next(error);
    }
};

// @desc    Extend rental duration
// @route   PUT /api/v1/rentals/:id/extend
// @access  Private
exports.extendRental = async (req, res, next) => {
    try {
        const { extensionMonths } = req.body;
        if (![3, 6, 12].includes(+extensionMonths)) {
            return sendResponse(res, 400, false, 'Extension must be 3, 6, or 12 months');
        }

        const rental = await Rental.findOne({ _id: req.params.id, user: req.user._id });
        if (!rental) {
            return sendResponse(res, 404, false, 'Rental not found');
        }

        const newEndDate = new Date(rental.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + +extensionMonths);

        rental.endDate = newEndDate;
        rental.extensionHistory.push({
            extendedBy: +extensionMonths,
            newEndDate,
            timestamp: new Date()
        });

        if (rental.status === 'expired') rental.status = 'extended';
        
        await rental.save();

        sendResponse(res, 200, true, 'Rental extended successfully', { rental });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit return request
// @route   POST /api/v1/rentals/:id/return-request
// @access  Private
exports.requestReturn = async (req, res, next) => {
    try {
        const rental = await Rental.findOne({ _id: req.params.id, user: req.user._id });
        if (!rental) {
            return sendResponse(res, 404, false, 'Rental not found');
        }

        rental.returnRequest = {
            requested: true,
            requestDate: new Date(),
            reason: req.body.reason,
            scheduledDate: req.body.scheduledDate
        };

        await rental.save();

        sendResponse(res, 200, true, 'Return request submitted successfully', { rental });
    } catch (error) {
        next(error);
    }
};
