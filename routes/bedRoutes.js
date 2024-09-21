const express = require('express');
const router = express.Router();
const { createBed, getBeds, updateBed, deleteBed,getBedsForPackage } = require('../controllers/bedController');
const { getPackagesForBed } = require('../controllers/packageController');

// Route to create a new bed
router.post('/create', createBed);

// Route to get all beds
router.get('/', getBeds);

// Route to update a bed by ID
router.put('/:id', updateBed);

// Route to delete a bed by ID
router.delete('/:id', deleteBed);

// Route to get all packages for bed creation (will return package names)
router.get('/packages', getPackagesForBed);


router.get('/for-package/:packageId', getBedsForPackage);




module.exports = router;
