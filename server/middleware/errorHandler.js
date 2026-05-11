const sendResponse = require('../utils/sendResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        return sendResponse(res, 404, false, message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        return sendResponse(res, 400, false, message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return sendResponse(res, 400, false, message);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return sendResponse(res, 401, false, 'Invalid token');
    }
    
    if (err.name === 'TokenExpiredError') {
        return sendResponse(res, 401, false, 'Token expired');
    }

    sendResponse(res, error.statusCode || 500, false, error.message || 'Server Error', {
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
};

module.exports = errorHandler;
