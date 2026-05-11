const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        productImage: String,
        selectedPlan: {
            duration: Number,
            label: String,
            monthlyPrice: Number,
            totalPrice: Number
        },
        quantity: { type: Number, default: 1 },
        securityDeposit: Number
    }],
    pricing: {
        subtotal: Number,
        totalDeposit: Number,
        deliveryCharge: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        grandTotal: Number
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String
    },
    scheduledDelivery: {
        date: Date,
        timeSlot: {
            type: String,
            enum: [
                '9am-12pm', '12pm-3pm', '3pm-6pm', '6pm-9pm',
                '9am–12pm', '12pm–3pm', '3pm–6pm', '6pm–9pm'
            ]
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'cod']
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'out-for-delivery', 'delivered', 'active', 'cancelled'],
        default: 'placed'
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    notes: String
}, {
    timestamps: true
});

// Pre-save hook to generate order number
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        const year = new Date().getFullYear();
        const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.orderNumber = `RE-${year}-${randomStr}`;
        
        // Add initial status to history
        this.statusHistory.push({
            status: 'placed',
            note: 'Order placed successfully'
        });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
