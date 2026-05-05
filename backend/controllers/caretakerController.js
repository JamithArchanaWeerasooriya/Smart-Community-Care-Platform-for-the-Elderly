const FallData = require("../models/FallData");

exports.getDeviceFallStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const latest = await FallData.findOne({ deviceId })
      .sort({ createdAt: -1 });

    console.log("Latest record:", latest);

    if (!latest) {
      return res.json({ fall: false });
    }

    res.json({
      fall: latest.fall,
      createdAt: latest.createdAt
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMonthlyFallReport = async (req, res) => {
  try {
    const { deviceId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const falls = await FallData.aggregate([
      {
        $match: {
          deviceId,
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalFalls: {
            $sum: { $cond: ["$fall", 1, 0] }
          },
          totalRecords: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const totalFalls = falls.reduce((sum, d) => sum + d.totalFalls, 0);
    const totalRecords = falls.reduce((sum, d) => sum + d.totalRecords, 0);

    const probability =
      totalRecords === 0
        ? 0
        : ((totalFalls / totalRecords) * 100).toFixed(2);

    res.json({
      dailyData: falls.map((d) => ({
        day: d._id,
        falls: d.totalFalls
      })),
      totalFalls,
      totalRecords,
      probability
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};