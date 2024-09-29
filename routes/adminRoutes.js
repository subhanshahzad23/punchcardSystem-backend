const express = require('express');
const router = express.Router();
const { loginAdmin, forgotPassword, resetPassword } = require('../controllers/adminController');

// Admin login route
router.post('/login', loginAdmin);

// Forgot password route
router.post('/forgot-password', forgotPassword);

// Reset password route
router.post('/reset-password/:resetToken', resetPassword);

module.exports = router;
