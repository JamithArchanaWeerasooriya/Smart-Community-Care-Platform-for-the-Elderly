const generateWeeklyReport = (sessions) => {
  if (!sessions.length) {
    return {
      averageScore: 0,
      bestDay: null,
      worstDay: null,
      snoringTrend: 0,
      factorImpact: {},
      sessions: [],
      dailyData: [],
      summary: "No data available"
    };
  }

  const dailyData = sessions.map((s) => {
  const hours = (s.totalSleepDuration || 0) / 3600;

  let category = "Too Short";

  if (hours >= 5 && hours < 7) category = "Short";
  else if (hours >= 7 && hours <= 9) category = "Normal";
  else if (hours > 9) category = "Too Long";

  return {
    date: s.createdAt,
    sleepHours: hours,
    score: s.sleepScore || 0,
    snore: s.snoreFrequency || 0,
    factors: s.factors || {},
    category // ✅ THIS IS WHAT YOU WERE MISSING
  };
});

  // Average score
  const avg =
    sessions.reduce((sum, s) => sum + (s.sleepScore || 0), 0) /
    sessions.length;

  // Best & worst
  const sorted = [...sessions].sort((a, b) => b.sleepScore - a.sleepScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Snoring trend
  const current =
    sessions.reduce((sum, s) => sum + (s.snoreFrequency || 0), 0) /
    sessions.length;

  const previous = current * 0.85;
  const trend = ((current - previous) / previous) * 100;

  // Factors
  const factorImpact = {};
  const factorsList = ["coffee", "alcohol", "tea", "ateLate", "workout", "stress"];

  factorsList.forEach((factor) => {
    const withFactor = sessions.filter((s) => s.factors?.[factor]);
    const withoutFactor = sessions.filter((s) => !s.factors?.[factor]);

    if (withFactor.length && withoutFactor.length) {
      const avgWith =
        withFactor.reduce((sum, s) => sum + s.sleepScore, 0) /
        withFactor.length;

      const avgWithout =
        withoutFactor.reduce((sum, s) => sum + s.sleepScore, 0) /
        withoutFactor.length;

      factorImpact[factor] = avgWith - avgWithout;
    }
  });

  // 🧠 SUMMARY
  const avgSleep =
    dailyData.reduce((sum, d) => sum + d.sleepHours, 0) /
    dailyData.length;

  let summary = "";

  if (avgSleep < 5) {
    summary = "⚠ Poor sleep this week.";
  } else if (avgSleep < 7) {
    summary = "😐 Moderate sleep. Try improving.";
  } else {
    summary = "✅ Good sleep habits!";
  }

  return {
    averageScore: Math.round(avg),
    bestDay: best,
    worstDay: worst,
    snoringTrend: Math.round(trend),
    factorImpact,
    sessions,
    dailyData,   // 🔥 MUST
    summary      // 🔥 MUST
  };
};
const generateMonthlyReport = (sessions) => {
  if (!sessions.length) return null;

  const avg =
    sessions.reduce((sum, s) => sum + (s.sleepScore || 0), 0) /
    sessions.length;

  // Group by week
  const weeks = {};

  sessions.forEach((s) => {
    const week = Math.ceil(new Date(s.date).getDate() / 7);
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push(s.sleepScore || 0);
  });

  const weeklyBreakdown = Object.entries(weeks).map(([week, scores]) => ({
    week,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  return {
    averageScore: Math.round(avg),
    weeklyBreakdown,
  };
};
const generateInsights = (report) => {
  const insights = [];

  if (report.snoringTrend > 10) {
    insights.push("⚠ Snoring increased this week");
  } else {
    insights.push("✅ Snoring improved this week");
  }

  Object.entries(report.factorImpact).forEach(([factor, value]) => {
    if (value < 0) {
      insights.push(`${factor} reduced your sleep by ${Math.abs(value).toFixed(1)}%`);
    }
  });

  return insights;
};

module.exports = {
  generateWeeklyReport,
  generateMonthlyReport,
  generateInsights
};