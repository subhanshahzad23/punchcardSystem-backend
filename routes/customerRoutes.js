const express = require('express');
const { enrollCustomer, assignPackageToCustomer, searchCustomerByPhone, punchRedemption,updateCustomer,deleteCustomer,deleteCustomerPackage } = require('../controllers/customerController');
const router = express.Router();
// const { protectAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware



// Route to enroll a new customer
router.post('/enroll',protect, enrollCustomer);

// Route to assign a new package to an existing customer
router.post('/assign-package',protect, assignPackageToCustomer);  // Only admins can assign packages

// Route to search for customer by phone number
router.get('/search', searchCustomerByPhone);

// Route to punch a redemption for a customer
router.post('/punch-redemption',protect, punchRedemption);

// Route to update a customer
router.put('/:customerId', protect, updateCustomer);

// Route to delete a customer
router.delete('/:customerId', protect, deleteCustomer);

router.delete('/:customerId/packages/:packageId', deleteCustomerPackage);



module.exports = router;
