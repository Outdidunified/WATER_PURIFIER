const { connectToDatabase } = require('../../../config/db');

exports.getWaterAnalytics = async (req, res) => {
  const body = req.body || {};
  const { user_id } = body;

  if (!user_id) {
    return res.status(400).json({
      error: true,
      message: 'user_id is required',
    });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('device_feature_values');

    const allData = await collection.find({ user_id: parseInt(user_id) }).toArray();

    if (!allData || allData.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'No data found for this user.',
      });
    }

    const dailyMap = new Map();
    const weeklyMap = new Map();
    const monthlyMap = new Map();

    let totalWater = 0;

    for (const doc of allData) {
      const date = new Date(doc.timestamp);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const water = doc.water_consumed || 0;
      totalWater += water;

      // Group by day
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + water);
      // Group by week
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + water);
      // Group by month
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + water);
    }

    // Format daily data in dd/mm/yyyy
    const daily = Array.from(dailyMap.entries()).map(([date, total]) => ({
      date: formatDateToDDMMYYYY(new Date(date)),
      total: +total.toFixed(2),
    }));

    const weekly = Array.from(weeklyMap.entries()).map(([week, total]) => ({
      week,
      total: +total.toFixed(2),
    }));

    const monthly = Array.from(monthlyMap.entries()).map(([month, total]) => {
      const [year, monthNum] = month.split('-');
      return {
        month: `${monthNum}/${year}`, // mm/yyyy
        total: +total.toFixed(2),
      };
    });

    const plasticBottlesSaved = +totalWater.toFixed(2); // Assuming 1 bottle = 1L
    const carbonFootprintSaved = +(totalWater * 0.5).toFixed(2); // 0.5 kg CO₂ per liter

    return res.status(200).json({
      error: false,
      message: 'Water consumption analytics fetched successfully',
      data: {
        daily,
        weekly,
        monthly,
        totalWaterConsumed: +totalWater.toFixed(2),
        plasticBottlesSaved,
        carbonFootprintSavedKg: carbonFootprintSaved,
      },
    });
  } catch (error) {
    console.error('Error in getWaterAnalytics:', error);
    return res.status(500).json({
      error: true,
      message: 'Server error while calculating water analytics',
    });
  }
};

// Helper to format date to dd/mm/yyyy
function formatDateToDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper to get ISO week number
function getWeekNumber(date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
}
