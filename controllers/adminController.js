// const Admin = require('../models/admin');  // Ensure the path is correct
// const argon2 = require('argon2');
// const jwt = require('jsonwebtoken');

// const loginAdmin = async (req, res) => {
//     try {
//         res.json({ message: 'Login route reached' });
//     } catch (error) {
//         console.error('Error during simplified login test:', error);
//         res.status(500).json({ message: 'Error in simplified login', error: error.message });
//     }
// };


// // Middleware to protect admin routes
// const protectAdmin = (req, res, next) => {
//     const token = req.header('Authorization');
//     if (!token) {
//         return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.admin = decoded;  // Attach the decoded admin info to the request object
//         next();  // Move to the next middleware or route handler
//     } catch (error) {
//         res.status(401).json({ message: 'Invalid token' });
//     }
// };

// module.exports = { loginAdmin, protectAdmin };

const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// Function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Admin login function
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ username });
    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            username: admin.username,
            token: generateToken(admin._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

module.exports = { loginAdmin };

