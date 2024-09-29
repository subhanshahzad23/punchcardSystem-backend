const Customer = require('../models/Customer');
const Package = require('../models/Package');
const Bed = require('../models/Bed');
const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');

// Format phone number to remove non-numeric characters
const formatPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');  // Remove all non-numeric characters
};

// List all customers
const listAllCustomers = asyncHandler(async (req, res) => {
    try {
        const customers = await Customer.find({})
            .select('name phone email createdAt punchHistory')  // Only select required fields
            .populate({
                path: 'punchHistory.packageId',
                select: 'name',  // Only select the package name
            })
            .populate({
                path: 'punchHistory.bedId',
                select: 'name',  // Only select the bed name
            });

        res.status(200).json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
});

// Export all customers to Excel
const exportCustomersToExcel = asyncHandler(async (req, res) => {
    try {
        const customers = await Customer.find({})
            .select('name phone email createdAt punchHistory')  // Only select required fields
            .populate({
                path: 'punchHistory.packageId',
                select: 'name',  // Only select the package name
            })
            .populate({
                path: 'punchHistory.bedId',
                select: 'name',  // Only select the bed name
            });

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customers');

        // Add header row
        worksheet.columns = [
            { header: 'Date Created', key: 'createdAt', width: 20 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Last Tanning Check-In', key: 'lastCheckIn', width: 25 }
        ];

        // Add data rows
        customers.forEach((customer) => {
            const lastPunch = customer.punchHistory.length > 0
                ? new Date(customer.punchHistory[customer.punchHistory.length - 1].date).toLocaleString()
                : 'No Check-In';
            worksheet.addRow({
                createdAt: customer.createdAt.toLocaleString(),
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                lastCheckIn: lastPunch,
            });
        });

        // Set the response headers for downloading the file
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="customers.xlsx"'
        );

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting customers:', error);
        res.status(500).json({ message: 'Failed to export customers' });
    }
});

// Enroll a new customer
const enrollCustomer = async (req, res) => {
    const { name, phone, email, packages } = req.body;

    try {
        const formattedPhone = formatPhoneNumber(phone); // Format the phone number

        // Ensure packages have the correct `status` before enrolling
        const packagesWithStatus = packages.map(pkg => ({
            ...pkg,
            status: 'unused',  // Set status to 'unused' on enrollment
        }));

        // Create a new customer with the package information
        const newCustomer = new Customer({
            name,
            phone: formattedPhone, // Store formatted phone number
            email,
            packages: packagesWithStatus,  // Packages now include `status`
        });

        // Save the new customer to the database
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate phone number error (MongoDB duplicate key error)
            console.error('Error enrolling customer:', error);
            res.status(400).json({ message: 'Customer with this phone number already exists' });
        } else {
            console.error('Error enrolling customer:', error);
            res.status(500).json({ message: 'An error occurred while enrolling the customer' });
        }
    }
};

// Search customer by phone number and get profile info with packages
const searchCustomerByPhone = async (req, res) => {
    const { phone } = req.query;

    try {
        const formattedPhone = formatPhoneNumber(phone);
        const customer = await Customer.findOne({ phone: formattedPhone })
            .populate({
                path: 'packages.packageId',
                select: 'name isUnlimited redemptions status',  // Select relevant fields from the Package model
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

// Assign a package to a customer with the `active` status
// Assign a package to a customer with the `active` status
const assignPackageToCustomer = async (req, res) => {
    const { customerId, packageId } = req.body;

    try {
        console.log("Assign Package Request Received:", { customerId, packageId });

        // Find customer by ID
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.log("Customer not found with ID:", customerId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Find package by ID
        const packageToAssign = await Package.findById(packageId);
        if (!packageToAssign) {
            console.log("Package not found with ID:", packageId);
            return res.status(404).json({ message: 'Package not found' });
        }

        // Calculate expiration for unlimited packages if applicable
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
            console.log("Calculated expiration date for package:", expiration);
        } else {
            console.log("Package is either not unlimited or does not have duration set, no expiration required.");
        }

        // Prepare the package to add to customer
        const newPackageAssignment = {
            packageId: packageToAssign._id,
            expiration,
            remainingRedemptions: packageToAssign.isUnlimited ? Number.MAX_SAFE_INTEGER : packageToAssign.redemptions, // Use a large number for unlimited packages
            assignedDate: new Date(),
            status: 'active',  // New package assigned is always `active`
        };

        console.log("New Package Assignment Details:", newPackageAssignment);

        // Add the package to the customer's packages list
        customer.packages.push(newPackageAssignment);

        // Save customer with updated packages
        const updatedCustomer = await customer.save();
        console.log("Package assigned successfully to customer:", updatedCustomer._id);

        res.status(200).json({ message: 'Package assigned successfully' });
    } catch (error) {
        console.error('Error occurred while assigning package:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


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

// Fetch a customer by ID
// Fetch a customer by ID
const getCustomerById = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    try {
        const customer = await Customer.findById(customerId)
            .populate({
                path: 'packages.packageId',
                select: 'name isUnlimited redemptions status',  // Select relevant fields from the Package model
            })
            .populate({
                path: 'punchHistory.packageId',
                select: 'name',  // Only select necessary fields
            })
            .populate({
                path: 'punchHistory.bedId',
                select: 'name',  // Only select necessary fields
            });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: 'Failed to fetch customer' });
    }
});




module.exports = {
    enrollCustomer,
    getCustomerById,
    assignPackageToCustomer,
    searchCustomerByPhone,
    updateCustomer,
    deleteCustomer,
    deleteCustomerPackage,
    getBedsForPackage,
    listAllCustomers,  // New method for listing customers
    exportCustomersToExcel  // New method for exporting customers
};

