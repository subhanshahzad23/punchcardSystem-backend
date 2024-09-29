const express = require('express');
const { 
    enrollCustomer, 
    assignPackageToCustomer, 
    searchCustomerByPhone, 
    updateCustomer, 
    deleteCustomer, 
    deleteCustomerPackage, 
    listAllCustomers,
    exportCustomersToExcel,
    getCustomerById
} = require('../controllers/customerController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

// Place specific routes before the generic ones

// New Route to get all customers
router.get('/list', protect, listAllCustomers);

// New Route to export all customers to Excel
router.get('/export', protect, exportCustomersToExcel);

// Route to search for customer by phone number
router.get('/search', searchCustomerByPhone);

// Route to enroll a new customer
router.post('/enroll', protect, enrollCustomer);

// Route to assign a new package to an existing customer
router.post('/assign-package', protect, assignPackageToCustomer);  // Only admins can assign packages

// Route to update a customer
router.put('/:customerId', protect, updateCustomer);

// Route to delete a customer
router.delete('/:customerId', protect, deleteCustomer);

// Route to remove a package from a customer
router.delete('/:customerId/packages/:packageId', protect, deleteCustomerPackage);

// Route to get a customer by ID
router.get('/:customerId', protect, getCustomerById);

module.exports = router;
