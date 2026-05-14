const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');

const TIERS = {
    Basic: { price: 0, perks: ['Standard maintenance', 'Free delivery'] },
    Pro: { price: 499, perks: ['Priority maintenance', 'Free delivery', '5% Cashback', 'Smart tracking'] },
    Elite: { price: 999, perks: ['Instant maintenance', 'Free delivery & relocation', '10% Cashback', 'Full smart tracking', 'Customization options'] }
};

// @desc    Get subscription plans
// @route   GET /api/v1/subscriptions/plans
// @access  Public
exports.getPlans = (req, res) => {
    sendResponse(res, 200, true, 'Subscription plans fetched', { plans: TIERS });
};

// @desc    Upgrade subscription
// @route   POST /api/v1/subscriptions/upgrade
// @access  Private
exports.upgradeSubscription = async (req, res, next) => {
    try {
        const { tier } = req.body;
        if (!TIERS[tier]) {
            return sendResponse(res, 400, false, 'Invalid subscription tier');
        }

        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 1);

        const user = await User.findByIdAndUpdate(req.user._id, {
            subscription: {
                tier,
                status: 'active',
                validUntil
            }
        }, { new: true });

        sendResponse(res, 200, true, `Successfully upgraded to ${tier} tier`, { user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user subscription status
// @route   GET /api/v1/subscriptions/me
// @access  Private
exports.getMySubscription = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('subscription');
        sendResponse(res, 200, true, 'Subscription status fetched', { subscription: user.subscription });
    } catch (error) {
        next(error);
    }
};
