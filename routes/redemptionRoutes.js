const express = require('express');
const { punchRedemption, revertRedemption } = require('../controllers/redemptionController');
const router = express.Router();

// Route to punch a redemption
router.post('/punch', punchRedemption);

// Route to revert (delete) a punch
router.post('/revert', revertRedemption); // Ensure this route is present

module.exports = router;
