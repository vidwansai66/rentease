const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'RentEase' },
    supportEmail: { type: String, default: 'support@rentease.com' },
    supportPhone: { type: String, default: '+91 98765 43210' },
    serviceCities: [{ type: String }],
    maintenanceCategories: [{ type: String }],
    rentalPolicies: {
        minimumTenure: { type: Number, default: 3 }, // months
        securityDepositMultiplier: { type: Number, default: 2 }, // x monthly rent
    }
}, { timestamps: true });

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
