const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rentalPlan: {
        duration: Number,
        label: String,
        monthlyPrice: Number
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'expired', 'returned', 'extended'],
        default: 'active'
    },
    nextPaymentDate: Date,
    monthlyPayments: [{
        month: Number,
        amount: Number,
        dueDate: Date,
        paidDate: Date,
        status: {
            type: String,
            enum: ['paid', 'pending', 'overdue'],
            default: 'pending'
        }
    }],
    returnRequest: {
        requested: { type: Boolean, default: false },
        requestDate: Date,
        reason: String,
        scheduledDate: Date
    },
    extensionHistory: [{
        extendedBy: Number, // months
        newEndDate: Date,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Indexes
rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ endDate: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
