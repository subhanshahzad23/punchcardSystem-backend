// routes/tanningHistory.js

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Fetch tanning history by date
router.get('/tanning-history/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`Fetching tanning history for date: ${date}`);
        console.log(`Start of Day: ${startOfDay}`);
        console.log(`End of Day: ${endOfDay}`);

        const customers = await Customer.find({
            'punchHistory.date': {
                $gte: startOfDay,
                $lte: endOfDay,
            }
        })
        .populate('punchHistory.packageId', 'name isUnlimited redemptions')
        .populate('punchHistory.bedId', 'name')
        .select('name punchHistory')
        .exec();

        console.log('Customers with populated punchHistory:', JSON.stringify(customers, null, 2));

        // Filter punchHistory to only include entries from the selected date
        const result = customers.map(customer => {
            const punches = customer.punchHistory.filter(punch => {
                return punch.date >= startOfDay && punch.date <= endOfDay;
            });
            return {
                _id: customer._id,
                name: customer.name,
                punchHistory: punches
            };
        }).filter(customer => customer.punchHistory.length > 0);

        console.log('Tanning history result:', JSON.stringify(result, null, 2));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching tanning history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
