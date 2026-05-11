const sendResponse = require('../utils/sendResponse');

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return sendResponse(res, 403, false, 'Access denied. Admin privileges required.');
    }
};

module.exports = { adminOnly };
