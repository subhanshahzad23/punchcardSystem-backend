const Customer = require('../models/Customer');
const Package = require('../models/Package');

// Punch Redemption function remains the same
const punchRedemption = async (req, res) => {
    const { customerId, packageId } = req.body;

    try {
        const customer = await Customer.findById(customerId).populate('packages.packageId');
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerPackage = customer.packages.find(pkg => pkg.packageId._id.equals(packageId));

        if (!customerPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        const pkg = customerPackage.packageId;

        if (!pkg.isUnlimited && customerPackage.remainingRedemptions <= 0) {
            return res.status(400).json({ message: 'No redemptions left' });
        }

        // Update remaining redemptions for number-based packages
        if (!pkg.isUnlimited) {
            customerPackage.remainingRedemptions -= 1;
        }

        // Log the punch in punch history
        customer.punchHistory.push({
            packageId: pkg._id,
            date: new Date(),
        });

        // Save the updated customer
        await customer.save();
        return res.status(200).json(customer);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

// New function to revert (delete) a punch
const revertRedemption = async (req, res) => {
    const { customerId, packageId, punchId } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerPackage = customer.packages.find(pkg => pkg.packageId.equals(packageId));

        if (!customerPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        // Remove the specific punch from punch history
        const punchIndex = customer.punchHistory.findIndex(punch => punch._id.toString() === punchId);
        if (punchIndex === -1) {
            return res.status(404).json({ message: 'Punch not found' });
        }

        customer.punchHistory.splice(punchIndex, 1); // Remove the punch from history

        // Increment the remaining redemptions for number-based packages
        if (!customerPackage.packageId.isUnlimited) {
            customerPackage.remainingRedemptions += 1;
        }

        // Save the updated customer
        await customer.save();
        return res.status(200).json(customer);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { punchRedemption, revertRedemption };
