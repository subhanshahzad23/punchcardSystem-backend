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
    isUnlimited: {   // New field to distinguish between unlimited and number-based
        type: Boolean,
        default: false,  // False for number-based, true for unlimited
    },
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
