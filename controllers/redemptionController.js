const Customer = require('../models/Customer');
const Bed = require('../models/Bed');
const Package = require('../models/Package');
const mongoose = require('mongoose');

// Punch Redemption with updated flow
const punchRedemption = async (req, res) => {
    const { customerId, packageId, bedId, consentSignature } = req.body;

    console.log('Punch redemption request received:', { customerId, packageId, bedId, consentSignature });

    try {
        if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(packageId) || !mongoose.Types.ObjectId.isValid(bedId)) {
            console.log('Invalid ID format');
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        if (!consentSignature) {
            console.log('Consent signature is missing');
            return res.status(400).json({ message: 'Consent signature is required' });
        }

        const customer = await Customer.findById(customerId).populate('packages.packageId');
        if (!customer) {
            console.log('Customer not found');
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Find the active package for the customer
        const customerPackage = customer.packages.find(pkg =>
            pkg.packageId._id.equals(packageId) && (pkg.status === 'active' || pkg.status === 'unused')
        );

        if (!customerPackage) {
            console.log('No active or unused package found for this customer');
            return res.status(404).json({ message: 'No active or unused package found for this customer' });
        }

        const pkg = customerPackage.packageId;

        // Check if the package has any redemptions left (only for non-unlimited packages)
        if (!pkg.isUnlimited && customerPackage.remainingRedemptions <= 0) {
            // Mark package as redeemed if redemptions are exhausted
            customerPackage.status = 'redeemed';
            console.log('No redemptions left for this package');
            return res.status(400).json({ message: 'No redemptions left for this package' });
        }

        // Find the bed and validate the package assignment
        const bed = await Bed.findById(bedId).populate('packages');
        if (!bed) {
            console.log('Bed not found');
            return res.status(404).json({ message: 'Bed not found' });
        }

        const isPackageAllowedOnBed = bed.packages.some(bedPkg => bedPkg._id.equals(packageId));
        if (!isPackageAllowedOnBed) {
            console.log('This bed does not support the selected package');
            return res.status(400).json({ message: 'This bed does not support the selected package' });
        }

        // Deduct a redemption if not unlimited
        if (!pkg.isUnlimited) {
            customerPackage.remainingRedemptions -= 1;

            // Update the package status to 'redeemed' if redemptions are exhausted
            if (customerPackage.remainingRedemptions === 0) {
                customerPackage.status = 'redeemed';
                console.log('Package fully redeemed');
            }
        }

        console.log('Logging punch in punch history');
        customer.punchHistory.push({
            packageId: pkg._id,
            bedId: bed._id,
            date: new Date(),
            consentForm: {
                signedAt: new Date(),
                signature: consentSignature,
            },
        });

        await customer.save();
        console.log('Customer after saving:', customer);

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
            return res.status(404).json({ message: 'Package not found for this customer' });
        }

        const punchIndex = customer.punchHistory.findIndex(punch => punch._id.toString() === punchId);
        if (punchIndex === -1) {
            console.log('Punch not found');
            return res.status(404).json({ message: 'Punch not found' });
        }

        customer.punchHistory.splice(punchIndex, 1);
        if (!customerPackage.packageId.isUnlimited) {
            customerPackage.remainingRedemptions += 1;

            // If redemptions were restored, set the package status to 'unused' if applicable
            if (customerPackage.remainingRedemptions > 0) {
                customerPackage.status = 'unused';
            } else {
                customerPackage.status = 'active'; // Reactivate package if redemptions were restored
            }
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
