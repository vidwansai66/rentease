const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        minlength: [2, 'Name cannot be less than 2 characters'],
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.png'
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String
    },
    kyc: {
        aadharNumber: String,
        panNumber: String,
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    vendorProfile: {
        companyName: String,
        businessType: { type: String, enum: ['Individual', 'Company', 'Partnership'] },
        taxId: String, // GST or similar
        businessAddress: {
            street: String,
            city: String,
            state: String,
            pincode: String
        },
        description: String,
        isStorePublic: { type: Boolean, default: false }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'vendor'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
