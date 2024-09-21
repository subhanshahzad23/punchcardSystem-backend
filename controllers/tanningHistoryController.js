const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// Get all sign-ins (punches) for a specific date
const getTanningHistoryByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Include the entire day

    // Find all customers who had a punch on the specified date
    const customers = await Customer.find({
      "punchHistory.date": { $gte: startDate, $lt: endDate }
    })
      .populate('punchHistory.packageId', 'name')
      .populate('punchHistory.bedId', 'name')
      .exec();

    // Structure the data for the frontend
    const punchHistory = [];
    customers.forEach((customer) => {
      customer.punchHistory.forEach((punch) => {
        if (punch.date >= startDate && punch.date < endDate) {
          punchHistory.push({
            _id: punch._id,
            customerName: customer.name,
            packageId: punch.packageId,
            bedId: punch.bedId,
            date: punch.date
          });
        }
      });
    });

    res.json(punchHistory);
  } catch (error) {
    console.error('Error fetching tanning history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { getTanningHistoryByDate };
