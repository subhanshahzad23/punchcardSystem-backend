const express = require('express');
const { punchRedemption } = require('../controllers/redemptionController');
const router = express.Router();

// Route to punch a redemption
router.post('/punch', punchRedemption);

module.exports = router;
