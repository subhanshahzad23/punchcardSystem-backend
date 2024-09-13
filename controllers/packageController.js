const Package = require('../models/Package');

// Create a new package

// Create a new package
const createPackage = async (req, res) => {
    const { name, redemptions, isUnlimited, duration, durationUnit } = req.body;
    try {
        const newPackage = new Package({
            name,
            redemptions,
            isUnlimited,
            duration: isUnlimited ? duration : null, // Only store duration if unlimited
            durationUnit: isUnlimited ? durationUnit : null,
        });
        const savedPackage = await newPackage.save();
        res.status(201).json(savedPackage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all packages
const getPackages = async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


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

module.exports = { createPackage, getPackages,deletePackage };
