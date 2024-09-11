const express = require('express');
const { createPackage, getPackages } = require('../controllers/packageController');  // Import correct controllers
// const { protectAdmin } = require('../controllers/adminController');  // Import protectAdmin
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

const router = express.Router();

// Route to create a new package
router.post('/create', protect,createPackage);  // Only admins can create packages

// Route to get all packages
router.get('/', getPackages);

module.exports = router;
