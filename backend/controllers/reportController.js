import SleepSession from "../models/SleepSession.js";
import { generateWeeklyReport, generateMonthlyReport } from "../services/reportService.js";

export const getWeeklyReport = async (req, res) => {
  try {
    const sessions = await SleepSession.find()
      .sort({ createdAt: -1 })
      .limit(7);

    const report = generateWeeklyReport(sessions);

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Report error" });
  }
};

// 📊 Monthly Report
export const getMonthlyReport = async (req, res) => {
  try {
    const sessions = await SleepSession.find();

    if (!sessions.length) {
      return res.json({ message: "No data available" });
    }

    // Last 30 days filter
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(now.getDate() - 30);

    const monthlySessions = sessions.filter(
      (s) => new Date(s.date) >= lastMonth
    );

    // Average score
    const avgScore =
      monthlySessions.reduce((sum, s) => sum + s.sleepScore, 0) /
      monthlySessions.length;

    // Best & worst
    const bestDay = monthlySessions.reduce((a, b) =>
      a.sleepScore > b.sleepScore ? a : b
    );

    const worstDay = monthlySessions.reduce((a, b) =>
      a.sleepScore < b.sleepScore ? a : b
    );

    res.json({
      averageScore: avgScore.toFixed(1),
      bestDay,
      worstDay,
      totalDays: monthlySessions.length,
      sessions: monthlySessions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};