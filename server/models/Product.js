const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        required: [true, 'Please provide a short description'],
        maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    images: [String],
    brand: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ['new', 'like-new', 'good'],
        default: 'new'
    },
    specifications: {
        dimensions: String,
        material: String,
        color: String,
        weight: String,
        warranty: String
    },
    rentalPlans: [{
        duration: { type: Number, required: true }, // in months
        label: { type: String, required: true }, // e.g. "3 Months"
        monthlyPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        isPopular: { type: Boolean, default: false }
    }],
    securityDeposit: {
        type: Number,
        required: true
    },
    availableUnits: {
        type: Number,
        required: true,
        min: 0
    },
    totalUnits: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [String],
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    isSmartAppliance: {
        type: Boolean,
        default: false
    },
    customizationOptions: [{
        type: { type: String }, // e.g. "Color", "Fabric"
        options: [String] // e.g. ["Midnight Black", "Arctic White"]
    }]
}, {
    timestamps: true
});

// Indexes
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text', brand: 'text', tags: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
