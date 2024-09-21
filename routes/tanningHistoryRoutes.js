const express = require('express');
const { getTanningHistoryByDate } = require('../controllers/tanningHistoryController');

const router = express.Router();

// Route for getting the tanning history by date
router.get('/', getTanningHistoryByDate);

module.exports = router;
