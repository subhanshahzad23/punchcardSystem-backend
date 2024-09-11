const jwt = require('jsonwebtoken');
const Admin = require('../models/admin'); // Import the Admin model

const protect = async (req, res, next) => {
    let token;

    // Check if the request contains an authorization header with a Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the Authorization header
            token = req.headers.authorization.split(' ')[1];

            // Decode the token and verify it using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the admin object to the request (without the password)
            req.admin = await Admin.findById(decoded.id).select('-password');

            next(); // Call the next middleware or route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token is provided
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
