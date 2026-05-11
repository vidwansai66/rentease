const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rental',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    issueType: {
        type: String,
        enum: ['damage', 'malfunction', 'cosmetic', 'replacement', 'other'],
        required: [true, 'Please specify the issue type']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    images: [String],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['submitted', 'under-review', 'technician-assigned', 'resolved', 'closed'],
        default: 'submitted'
    },
    assignedTechnician: {
        name: String,
        phone: String
    },
    scheduledVisit: {
        date: Date,
        timeSlot: String
    },
    resolution: {
        notes: String,
        resolvedAt: Date
    }
}, {
    timestamps: true
});

// Pre-save hook to generate ticket number
maintenanceRequestSchema.pre('save', function(next) {
    if (this.isNew) {
        this.ticketNumber = `MR-${Date.now().toString().slice(-6)}`;
    }
    next();
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
