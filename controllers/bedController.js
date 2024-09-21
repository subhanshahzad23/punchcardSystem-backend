const Bed = require('../models/Bed');
const Package = require('../models/Package');

// Create a new Bed
// Create a new Bed
exports.createBed = async (req, res) => {
    try {
        const { name, packages } = req.body;

        // Check if a bed with the same name already exists
        const existingBed = await Bed.findOne({ name });
        if (existingBed) {
            return res.status(400).json({ message: 'A bed with this name already exists. Please choose a different name.' });
        }

        // Ensure packages exist before assigning them to the bed
        const existingPackages = await Package.find({ _id: { $in: packages } });
        if (existingPackages.length !== packages.length) {
            return res.status(400).json({ message: 'Some packages do not exist' });
        }

        const newBed = new Bed({
            name,
            packages,
        });

        const savedBed = await newBed.save();
        res.status(201).json(savedBed);
    } catch (error) {
        console.error('Error creating bed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all Beds with their assigned packages
exports.getBeds = async (req, res) => {
    try {
        const beds = await Bed.find().populate('packages', 'name redemptions isUnlimited duration durationUnit'); // Populate the package details
        res.status(200).json(beds);
    } catch (error) {
        console.error('Error fetching beds:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a specific Bed by ID
exports.getBedById = async (req, res) => {
    try {
        const { id } = req.params;
        const bed = await Bed.findById(id).populate('packages', 'name redemptions isUnlimited duration durationUnit');
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }
        res.status(200).json(bed);
    } catch (error) {
        console.error('Error fetching bed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a Bed by ID
exports.updateBed = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, packages } = req.body;

        // Ensure packages exist before assigning them to the bed
        const existingPackages = await Package.find({ _id: { $in: packages } });
        if (existingPackages.length !== packages.length) {
            return res.status(400).json({ message: 'Some packages do not exist' });
        }

        const updatedBed = await Bed.findByIdAndUpdate(
            id,
            { name, packages },
            { new: true }
        ).populate('packages', 'name redemptions isUnlimited duration durationUnit');
        
        if (!updatedBed) {
            return res.status(404).json({ message: 'Bed not found' });
        }
        
        res.status(200).json(updatedBed);
    } catch (error) {
        console.error('Error updating bed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a Bed by ID
exports.deleteBed = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBed = await Bed.findByIdAndDelete(id);
        if (!deletedBed) {
            return res.status(404).json({ message: 'Bed not found' });
        }
        res.status(200).json({ message: 'Bed deleted successfully' });
    } catch (error) {
        console.error('Error deleting bed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBedsForPackage = async (req, res) => {
    const { packageId } = req.params;
    try {
        const beds = await Bed.find({ packages: packageId }).populate('packages', 'name');
        res.status(200).json(beds);
    } catch (error) {
        console.error('Error fetching beds for package:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

