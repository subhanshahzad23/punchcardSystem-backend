const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/admin'); // Import the admin model

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Function to delete all existing admins and create a new admin
const resetAdminData = async () => {
    try {
        // Delete all existing admins
        await Admin.deleteMany({});
        console.log('All existing admins deleted');

        // Create a new admin user
        const username = 'admin'; // Customize the admin username
        const email = 'taftsquare@gmail.com'; // New admin email
        const password = 'admin123'; // Customize the admin password

        const admin = new Admin({ username, email, password });
        await admin.save();

        console.log('New admin user created successfully');
        process.exit();
    } catch (error) {
        console.error('Error resetting admin data:', error);
        process.exit(1);
    }
};

// Run the function
resetAdminData();
