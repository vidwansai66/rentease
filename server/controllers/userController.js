const User = require('../models/User');
const Rental = require('../models/Rental');
const sendResponse = require('../utils/sendResponse');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// @desc    Get rental history for user
// @route   GET /api/v1/users/rentals/history
// @access  Private
exports.getRentalHistory = async (req, res, next) => {
    try {
        const { page = 1, year, category } = req.query;
        let query = { user: req.user._id, status: { $in: ['expired', 'returned'] } };

        if (year) {
            query.createdAt = {
                $gte: new Date(year + '-01-01'),
                $lte: new Date(year + '-12-31T23:59:59')
            };
        }

        const [rentals, total] = await Promise.all([
            Rental.find(query)
                .sort('-createdAt')
                .skip((page - 1) * 10)
                .limit(10)
                .populate('product', 'name images brand category')
                .populate({ path: 'order', select: 'orderNumber pricing.grandTotal createdAt' }),
            Rental.countDocuments(query)
        ]);

        const enriched = rentals.map(r => {
            const start = new Date(r.startDate);
            const end = new Date(r.endDate);
            const monthsPaid = Math.max(1, Math.floor((end - start) / (30 * 24 * 60 * 60 * 1000)));
            const totalAmountPaid = monthsPaid * r.rentalPlan.monthlyPrice;
            const depositStatus = r.status === 'returned' ? 'returned' : 'held';

            return {
                ...r.toObject(),
                monthsPaid,
                totalAmountPaid,
                depositStatus
            };
        });

        sendResponse(res, 200, true, 'Rental history fetched', {
            rentals: enriched,
            totalCount: total,
            totalPages: Math.ceil(total / 10),
            currentPage: +page
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const allowed = ['name', 'phone'];
        const updates = {};
        
        allowed.forEach(k => {
            if (req.body[k]) updates[k] = req.body[k];
        });

        if (req.body.address) {
            updates.address = typeof req.body.address === 'string' 
                ? JSON.parse(req.body.address) 
                : req.body.address;
        }

        if (req.file) {
            updates.profileImage = '/images/uploads/' + req.file.filename;
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true
        }).select('-password');

        sendResponse(res, 200, true, 'Profile updated successfully', { user });
    } catch (error) {
        next(error);
    }
};

// @desc    Change user password
// @route   PUT /api/v1/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return sendResponse(res, 400, false, 'All password fields required');
        }

        if (newPassword !== confirmNewPassword) {
            return sendResponse(res, 400, false, 'New passwords do not match');
        }

        const { validatePassword } = require('../utils/validators');
        if (!validatePassword(newPassword)) {
            return sendResponse(res, 400, false, 'Password must be min 8 chars with 1 uppercase and 1 number');
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return sendResponse(res, 401, false, 'Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        // Clear old cookie and set new one
        res.clearCookie('rentease_token');
        const token = generateToken(user._id, user.role);
        res.cookie('rentease_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        sendResponse(res, 200, true, 'Password updated successfully');
    } catch (error) {
        next(error);
    }
};
