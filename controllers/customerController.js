const Customer = require('../models/Customer');
const Package = require('../models/Package');

const asyncHandler = require('express-async-handler');



// Assign a package to an existing customer
// Assign a package to a customer and set expiration
const assignPackageToCustomer = async (req, res) => {
    const { customerId, packageId } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        const packageToAssign = await Package.findById(packageId);

        if (!customer || !packageToAssign) {
            return res.status(404).json({ message: 'Customer or Package not found' });
        }

        // Calculate expiration based on the package's custom duration (days, weeks, months)
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

        // Add the package to the customer's package list with the calculated expiration
        customer.packages.push({
            packageId: packageToAssign._id,
            expiration,
            remainingRedemptions: packageToAssign.redemptions,
        });

        await customer.save();
        res.status(200).json({ message: 'Package assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


const formatPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');  // Remove all non-numeric characters
};

// Enroll a new customer
const enrollCustomer = async (req, res) => {
    const { name, phone, email, packages } = req.body;

    console.log('Incoming request:', { name, phone, email, packages });  // Debugging

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
        console.error('Error enrolling customer:', error);  // Log error for debugging
        if (error.code === 11000) {
            // Handle duplicate phone number error (MongoDB duplicate key error)
            res.status(400).json({ message: 'Customer with this phone number already exists' });
        } else {
            res.status(500).json({ message: 'An error occurred while enrolling the customer' });
        }
    }
};


const searchCustomerByPhone = async (req, res) => {
    const { phone } = req.query;

    try {
        const formattedPhone = formatPhoneNumber(phone); // Format the phone number

        const customer = await Customer.findOne({ phone:formattedPhone })
            .populate('packages.packageId')  // Populate package details
            .exec();  // Make sure you're executing the query

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(customer);  // Make sure punchHistory is included in the response
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Punch a redemption for a customer
const punchRedemption = async (req, res) => {
    const { customerId } = req.body;

    try {
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if there are redemptions left
        if (customer.remainingRedemptions <= 0) {
            return res.status(400).json({ message: 'No redemptions left' });
        }

        // Deduct one redemption
        customer.remainingRedemptions -= 1;

        await customer.save();
        res.status(200).json(customer); // Return the updated customer info
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Function to update a customer
const updateCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { name, phone, email } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Update the customer details
    customer.name = name || customer.name;
    customer.phone = phone ? formatPhoneNumber(phone) : customer.phone;
    customer.email = email || customer.email;

    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
});

// Function to delete a customer
// Function to delete a customer
const deleteCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    await Customer.deleteOne({ _id: customerId }); // Correct method for deletion
    res.status(200).json({ message: 'Customer deleted successfully' });
});

// Function to remove a package from the customer's package list
const deleteCustomerPackage = asyncHandler(async (req, res) => {
    const { customerId, packageId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Remove the package from the customer's package array
    customer.packages = customer.packages.filter(pkg => pkg.packageId.toString() !== packageId);

    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
});






// Export all functions at once
module.exports = {
    enrollCustomer,
    assignPackageToCustomer,
    searchCustomerByPhone,
    punchRedemption,
    updateCustomer,
    deleteCustomer,
    deleteCustomerPackage
};
