require('dotenv').config();

const argon2 = require('argon2');
const mongoose = require('mongoose');
const Admin = require('../models/admin');

// Connect to your MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define an async function to create the admin
const createAdmin = async () => {
    const username = 'admin';  // Set your admin username
    const password = 'admin';  // Set your desired admin password

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        console.log('Admin already exists');
        return;
    }

    // Hash the password using Argon2
    const hashedPassword = await argon2.hash(password);

    // Create a new admin with hashed password
    const admin = new Admin({
        username,
        password: hashedPassword
    });

    // Save the admin to the database
    await admin.save();
    console.log('Admin created successfully');
};

createAdmin().then(() => mongoose.disconnect());
