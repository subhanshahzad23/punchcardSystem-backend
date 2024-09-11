const Customer = require('../models/Customer');
const Package = require('../models/Package');


// Assign a package to an existing customer
const assignPackageToCustomer = async (req, res) => {
    const { customerId, packageId } = req.body;

    try {
        const selectedPackage = await Package.findById(packageId);

        if (!selectedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Prepare the new package data
        const newPackageData = {
            packageId: selectedPackage._id,
            remainingRedemptions: selectedPackage.redemptions,
            expiration: selectedPackage.redemptions === 0
                ? new Date(new Date().setMonth(new Date().getMonth() + 1))  // Set expiration for unlimited packs
                : null,  // No expiration for limited packs
        };

        // Push the new package into the customer's package array
        customer.packages.push(newPackageData);

        // Save the updated customer
        await customer.save();
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Enroll a new customer
const enrollCustomer = async (req, res) => {
    const { name, phone, email, packages } = req.body;

    console.log('Incoming request:', { name, phone, email, packages });  // Debugging

    try {
        // Create a new customer with the package information
        const newCustomer = new Customer({
            name,
            phone,
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
        const customer = await Customer.findOne({ phone })
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



// Export all functions at once
module.exports = {
    enrollCustomer,
    assignPackageToCustomer,
    searchCustomerByPhone,
    punchRedemption,
};
