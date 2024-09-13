const mongoose = require('mongoose');

const packageSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    redemptions: {
        type: Number,
        required: true,  // 0 for unlimited packages
    },
    isUnlimited: {   
        type: Boolean,
        default: false,  // False for number-based, true for unlimited
    },
    duration: {   // Add duration field for custom expiration
        type: Number,
        default: null,
    },
    durationUnit: {   // Add unit for the duration (days, weeks, months)
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'months',
    },
    expiration: {   // For assigned packages, calculate this field dynamically
        type: Date,
        default: null,
    },
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
