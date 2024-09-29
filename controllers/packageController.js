const Package = require('../models/Package');

// Create a new package with status
const createPackage = async (req, res) => {
    const { name, redemptions, isUnlimited, duration, durationUnit } = req.body;
    try {
        // Assign the status as 'active' by default when creating a new package
        const newPackage = new Package({
            name,
            redemptions,
            isUnlimited,
            duration: isUnlimited ? duration : null, // Only store duration if unlimited
            durationUnit: isUnlimited ? durationUnit : null,
            status: 'active'  // All newly created packages are `active`
        });
        const savedPackage = await newPackage.save();
        res.status(201).json(savedPackage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all packages including status
const getPackages = async (req, res) => {
    try {
        const packages = await Package.find({}, 'name status redemptions isUnlimited duration durationUnit');
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get packages for Bed Creation, only fetching `active` ones
const getPackagesForBed = async (req, res) => {
    try {
        // Fetch only the package name and ensure it's active for bed creation
        const packages = await Package.find({ status: 'active' }, 'name');
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching packages for bed creation', error });
    }
};

// Delete a package and mark its status as 'deleted' instead of physically removing it
const deletePackage = async (req, res) => {
    try {
        const packageId = req.params.id;
        const deletedPackage = await Package.findByIdAndDelete(packageId);

        if (!deletedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createPackage, getPackages, getPackagesForBed, deletePackage };
