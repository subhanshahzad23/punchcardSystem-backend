const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const packageRoutes = require('./routes/packageRoutes');
const customerRoutes = require('./routes/customerRoutes');
const redemptionRoutes = require('./routes/redemptionRoutes');
const adminRoutes = require('./routes/adminRoutes');  // Add this to include the admin routes

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Home route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Register routes
app.use('/api/packages', packageRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/redemption', redemptionRoutes);
app.use('/api/admin', adminRoutes);  // Register the admin routes here









const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
