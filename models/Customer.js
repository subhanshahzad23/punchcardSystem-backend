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
            assignedDate: { type: Date, default: Date.now },  // When the package was assigned
        },
    ],
    punchHistory: [
        {
            packageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Package',
                required: true,
            },
            bedId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Bed',  // Link the bed used during the punch
                required: true,
            },
            date: { type: Date, default: Date.now },  // Punch date
            consentForm: {  // Store acknowledgment of consent
                signedAt: { type: Date, default: Date.now },  // Date/Time when the consent was signed
                signature: { type: String, required: true },  // Placeholder for the signature (could be an image or string)
            },
        },
    ],
}, { timestamps: true });  // Automatically adds createdAt and updatedAt fields

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
