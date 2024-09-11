const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Package = require('./models/Package');  // Make sure this path is correct

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const packages = [
    { name: 'Deluxe Tanning - 5 Pack', redemptions: 5, isUnlimited: false },
    { name: 'Deluxe Tanning - 10 Pack', redemptions: 10, isUnlimited: false },
    { name: 'Deluxe Tanning - Monthly Unlimited', redemptions: 0, isUnlimited: true },  // Unlimited packs have 0 redemptions and are marked as unlimited
    { name: 'Ultra Tanning - 5 Pack', redemptions: 5, isUnlimited: false },
    { name: 'Ultra Tanning - 10 Pack', redemptions: 10, isUnlimited: false },
    { name: 'Ultra Tanning - Monthly Unlimited', redemptions: 0, isUnlimited: true }  // Unlimited pack
];


const seedPackages = async () => {
    try {
        await Package.deleteMany();  // Optional: This will clear the existing packages
        await Package.insertMany(packages);
        console.log('Packages have been inserted');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB().then(seedPackages);
