const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    packages: [
        {
            packageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Package',
                required: true,
            },
            remainingRedemptions: { type: Number, required: true },
            expiration: { type: Date, required: false },
        },
    ],
    punchHistory: [
        {
            packageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Package',
                required: true,
            },
            date: { type: Date, default: Date.now },
        },
    ],
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
