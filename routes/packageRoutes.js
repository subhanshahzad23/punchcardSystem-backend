const express = require('express');
const { createPackage, getPackages, deletePackage, getPackagesForBed } = require('../controllers/packageController');  // Import the new controller for fetching packages for beds
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

const router = express.Router();

// Route to create a new package (protected for admin use only)
router.post('/create', protect, createPackage);

// Route to delete a package by ID
router.delete('/:id', protect, deletePackage);  // Only admins should delete packages

// Route to get all packages (accessible to all)
router.get('/', getPackages);

// Route to get packages specifically for bed creation (no protection needed)
router.get('/for-bed', getPackagesForBed);  // New endpoint to fetch packages for bed assignment

module.exports = router;
