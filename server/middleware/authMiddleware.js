const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');

const protect = async (req, res, next) => {
    let token;

    if (req.cookies.rentease_token) {
        token = req.cookies.rentease_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendResponse(res, 401, false, 'Authentication required');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return sendResponse(res, 401, false, 'User no longer exists or is suspended');
        }

        req.user = user;
        next();
    } catch (error) {
        return sendResponse(res, 401, false, 'Invalid or expired token');
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return sendResponse(res, 403, false, 'Access denied. Admin privileges required.');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return sendResponse(res, 403, false, `User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, adminOnly, authorize };
