const Customer = require('../models/Customer');
const Package = require('../models/Package');
const Bed = require('../models/Bed');
const asyncHandler = require('express-async-handler');

// Format phone number to remove non-numeric characters
const formatPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');  // Remove all non-numeric characters
};

// Enroll a new customer
const enrollCustomer = async (req, res) => {
    const { name, phone, email, packages } = req.body;

    try {
        const formattedPhone = formatPhoneNumber(phone); // Format the phone number

        // Create a new customer with the package information
        const newCustomer = new Customer({
            name,
            phone: formattedPhone, // Store formatted phone number
            email,
            packages,
        });

        // Save the new customer to the database
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate phone number error (MongoDB duplicate key error)
            res.status(400).json({ message: 'Customer with this phone number already exists' });
        } else {
            res.status(500).json({ message: 'An error occurred while enrolling the customer' });
        }
    }
};

// Search customer by phone number and get profile info with packages
// Search customer by phone number and get profile info with packages
const searchCustomerByPhone = async (req, res) => {
    const { phone } = req.query;

    try {
        const formattedPhone = formatPhoneNumber(phone);
        const customer = await Customer.findOne({ phone: formattedPhone })
            .populate({
                path: 'packages.packageId',
                select: 'name isUnlimited redemptions',  // Select relevant fields from the Package model
            })
            .populate({
                path: 'punchHistory.packageId',
                select: 'name',  // Only select necessary fields
            })
            .populate({
                path: 'punchHistory.bedId',
                select: 'name',  // Only select necessary fields
            })
            .exec();

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Log the customer data to ensure the correct structure
        console.log('Customer found:', JSON.stringify(customer, null, 2));

        res.status(200).json({
            customer: {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                packages: customer.packages,
                punchHistory: customer.punchHistory,  // Include punchHistory
            },
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get beds that support a specific package
const getBedsForPackage = async (req, res) => {
    const { packageId } = req.params;

    try {
        const beds = await Bed.find({ packages: packageId })
            .populate('packages', 'name');

        res.status(200).json(beds);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Assign a package to a customer
const assignPackageToCustomer = async (req, res) => {
    const { customerId, packageId } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        const packageToAssign = await Package.findById(packageId);

        if (!customer || !packageToAssign) {
            return res.status(404).json({ message: 'Customer or Package not found' });
        }

        // Calculate expiration for unlimited packages
        let expiration = null;
        if (packageToAssign.isUnlimited && packageToAssign.duration && packageToAssign.durationUnit) {
            const now = new Date();
            if (packageToAssign.durationUnit === 'days') {
                expiration = new Date(now.setDate(now.getDate() + packageToAssign.duration));
            } else if (packageToAssign.durationUnit === 'weeks') {
                expiration = new Date(now.setDate(now.getDate() + packageToAssign.duration * 7));
            } else if (packageToAssign.durationUnit === 'months') {
                expiration = new Date(now.setMonth(now.getMonth() + packageToAssign.duration));
            }
        }

        // Add package to customer's list
        customer.packages.push({
            packageId: packageToAssign._id,
            expiration,
            remainingRedemptions: packageToAssign.redemptions,
            assignedDate: new Date(),
        });

        await customer.save();
        res.status(200).json({ message: 'Package assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

//Punch Redemption function

// Update customer details
const updateCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { name, phone, email } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    customer.name = name || customer.name;
    customer.phone = phone ? formatPhoneNumber(phone) : customer.phone;
    customer.email = email || customer.email;

    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
});

// Delete a customer
const deleteCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    await Customer.deleteOne({ _id: customerId });
    res.status(200).json({ message: 'Customer deleted successfully' });
});

// Remove a package from the customer's list
const deleteCustomerPackage = asyncHandler(async (req, res) => {
    const { customerId, packageId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    customer.packages = customer.packages.filter(pkg => pkg.packageId.toString() !== packageId);

    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
});

module.exports = {
    enrollCustomer,
    assignPackageToCustomer,
    searchCustomerByPhone,
    updateCustomer,
    deleteCustomer,
    deleteCustomerPackage,
    getBedsForPackage
};
