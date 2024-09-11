const Package = require('../models/Package');

// Create a new package
const createPackage = async (req, res) => {
    const { name, expiration, redemptions, isUnlimited } = req.body;
    try {
        const newPackage = new Package({
            name,
            expiration: expiration || null,
            redemptions,
            isUnlimited
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

module.exports = { createPackage, getPackages };
