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
    expiration: {   // Add expiration field
        type: Date,
        default: null,  // It will be null for non-expiring packages
    },
});


const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
