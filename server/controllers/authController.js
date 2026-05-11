const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');
const generateToken = require('../utils/generateToken');
const { validateEmail, validatePassword, validatePhone, isEmpty } = require('../utils/validators');

// @desc    Register user
// @route   POST /api/v1/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password, confirmPassword } = req.body;

        // Validation
        if (isEmpty(name) || isEmpty(email) || isEmpty(phone) || isEmpty(password)) {
            return sendResponse(res, 400, false, 'Please provide all required fields');
        }

        if (!validateEmail(email)) {
            return sendResponse(res, 400, false, 'Please provide a valid email');
        }

        if (!validatePhone(phone)) {
            return sendResponse(res, 400, false, 'Please provide a valid Indian phone number');
        }

        if (!validatePassword(password)) {
            return sendResponse(res, 400, false, 'Password must be at least 8 characters with 1 uppercase and 1 number');
        }

        if (password !== confirmPassword) {
            return sendResponse(res, 400, false, 'Passwords do not match');
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return sendResponse(res, 409, false, 'Email already registered');
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        // Set cookie
        const cookieOptions = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('rentease_token', token, cookieOptions);

        sendResponse(res, 201, true, 'Account created successfully', {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (isEmpty(email) || isEmpty(password)) {
            return sendResponse(res, 400, false, 'Please provide email and password');
        }

        // Find user & include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        if (!user.isActive) {
            return sendResponse(res, 403, false, 'Account suspended. Contact support.');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate token
        const token = generateToken(user._id, user.role);

        // Set cookie
        const cookieOptions = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('rentease_token', token, cookieOptions);

        sendResponse(res, 200, true, 'Login successful', {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
exports.logout = async (req, res) => {
    res.clearCookie('rentease_token');
    sendResponse(res, 200, true, 'Logged out successfully');
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
exports.getMe = async (req, res) => {
    sendResponse(res, 200, true, 'User fetched', { user: req.user });
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
exports.updateProfile = async (req, res, next) => {
    try {
        if (req.body.email) {
            return sendResponse(res, 400, false, 'Email cannot be changed');
        }

        const allowedUpdates = ['name', 'phone', 'address', 'profileImage'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true
        });

        sendResponse(res, 200, true, 'Profile updated successfully', { user });
    } catch (error) {
        next(error);
    }
};
