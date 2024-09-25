const Customer = require('../models/Customer');
const Bed = require('../models/Bed');
const Package = require('../models/Package');
const mongoose = require('mongoose');

// Punch Redemption with new flow
const punchRedemption = async (req, res) => {
    const { customerId, packageId, bedId, consentSignature } = req.body;

    console.log('Punch redemption request received:', { customerId, packageId, bedId, consentSignature });

    try {
        if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(packageId) || !mongoose.Types.ObjectId.isValid(bedId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        if (!consentSignature) {
            return res.status(400).json({ message: 'Consent signature is required' });
        }

        const customer = await Customer.findById(customerId).populate('packages.packageId');
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerPackage = customer.packages.find(pkg => pkg.packageId._id.equals(packageId));
        if (!customerPackage) {
            return res.status(404).json({ message: 'Package not found for this customer' });
        }

        const bed = await Bed.findById(bedId).populate('packages');
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        const isPackageAllowedOnBed = bed.packages.some(bedPkg => bedPkg._id.equals(packageId));
        if (!isPackageAllowedOnBed) {
            return res.status(400).json({ message: 'This bed does not support the selected package' });
        }

        // Adjust redemptions if not unlimited
        if (!customerPackage.packageId.isUnlimited && customerPackage.remainingRedemptions <= 0) {
            return res.status(400).json({ message: 'No redemptions left for this package' });
        }

        if (!customerPackage.packageId.isUnlimited) {
            customerPackage.remainingRedemptions -= 1;
        }

        // Store signature data with type (check if it's an image or text)
        const signatureType = consentSignature.startsWith('data:image') ? 'image' : 'text';

        // Log punch in punch history
        customer.punchHistory.push({
            packageId: customerPackage.packageId._id,
            bedId: bed._id,
            date: new Date(),
            consentForm: {
                signedAt: new Date(),
                signature: consentSignature, // Base64 image or text-based signature
                signatureType, // 'image' or 'text'
            },
        });

        await customer.save();
        return res.status(200).json({ message: 'Redemption successful', customer });
    } catch (error) {
        console.error('Error punching redemption:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// Revert Redemption remains unchanged
const revertRedemption = async (req, res) => {
    const { customerId, packageId, punchId } = req.body;

    console.log('Revert redemption request received:', { customerId, packageId, punchId });

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.log('Customer not found');
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerPackage = customer.packages.find(pkg => pkg.packageId.equals(packageId));
        if (!customerPackage) {
            console.log('Package not found for this customer');
        }

        const punchIndex = customer.punchHistory.findIndex(punch => punch._id.toString() === punchId);
        if (punchIndex === -1) {
            console.log('Punch not found');
            return res.status(404).json({ message: 'Punch not found' });
        }

        customer.punchHistory.splice(punchIndex, 1);
        if (!customerPackage.packageId.isUnlimited) {
            customerPackage.remainingRedemptions += 1;
        }

        await customer.save();
        console.log('Customer after revert:', customer);
        return res.status(200).json(customer);
    } catch (error) {
        console.error('Error reverting redemption:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { punchRedemption, revertRedemption };
