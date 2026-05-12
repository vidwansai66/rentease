const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: expiresIn
    });
};

module.exports = generateToken;
