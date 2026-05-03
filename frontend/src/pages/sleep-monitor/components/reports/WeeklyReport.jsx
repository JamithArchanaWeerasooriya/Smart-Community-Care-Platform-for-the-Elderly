import { useEffect, useState } from "react";
import { fetchWeeklyReport } from "./reportAPI";
import WeeklyChart from "./WeeklyChart";


// Simple CSS-in-JS styles (can be moved to a separate .css file)
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#0f172a",
    borderLeft: "5px solid #3b82f6",
    paddingLeft: "16px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px -2px rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)",
    transition: "transform 0.1s ease",
  },
  metricLabel: {
    fontSize: "14px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "#64748b",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2",
  },
  metricSub: {
    fontSize: "14px",
    color: "#475569",
    marginTop: "8px",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 4px 6px -2px rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  aiSummary: {
    backgroundColor: "#f1f5f9",
    borderRadius: "16px",
    padding: "20px",
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#1e293b",
    marginTop: "8px",
  },
  factorList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  factorItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  factorIcon: {
    fontSize: "24px",
  },
  factorText: {
    fontSize: "15px",
    fontWeight: "500",
  },
  positive: { color: "#10b981" },
  negative: { color: "#ef4444" },
  dailyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  dailyCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "16px",
    transition: "all 0.2s ease",
  },
  dailyDate: {
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "12px",
    color: "#0f172a",
  },
  dailyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    fontSize: "14px",
  },
  scoreBadge: {
    display: "inline-block",
    backgroundColor: "#e0f2fe",
    color: "#0284c7",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "40px",
    fontSize: "14px",
  },
  progressBar: {
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "4px",
  },
  progressFill: (value) => ({
    width: `${value}%`,
    height: "100%",
    backgroundColor: value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444",
    borderRadius: "10px",
  }),
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#64748b",
  },
  sleepBadge: (type) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  marginTop: "6px",

  backgroundColor:
    type === "Normal"
      ? "#dcfce7"
      : type === "Short"
      ? "#fef3c7"
      : type === "Too Short"
      ? "#fee2e2"
      : "#e0e7ff",

  color:
    type === "Normal"
      ? "#16a34a"
      : type === "Short"
      ? "#d97706"
      : type === "Too Short"
      ? "#dc2626"
      : "#4338ca",
}),
};


export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await fetchWeeklyReport();
      console.log("REPORT DATA:", data);
      setReport(data);
    } catch (error) {
      console.error("Error fetching weekly report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Loading report...</div>;
  if (!report) return <div style={styles.loading}>⚠️ No data available</div>;

  // Chart data
  const chartData = report.dailyData?.map((d) => ({
    day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
    score: d.score,
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Weekly Sleep Report</h1>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.metricLabel}>Average Score</div>
          <div style={styles.metricValue}>{report.averageScore ?? "—"}</div>
          <div style={styles.metricSub}>out of 100</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.metricLabel}>Best Day</div>
          <div style={styles.metricValue}>
            {report.bestDay?.sleepScore ?? "—"}
          </div>
          <div style={styles.metricSub}>
            {report.bestDay?.date
              ? new Date(report.bestDay.date).toLocaleDateString()
              : ""}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.metricLabel}>Worst Day</div>
          <div style={styles.metricValue}>
            {report.worstDay?.sleepScore ?? "—"}
          </div>
          <div style={styles.metricSub}>
            {report.worstDay?.date
              ? new Date(report.worstDay.date).toLocaleDateString()
              : ""}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.metricLabel}>Snoring Trend</div>
          <div style={styles.metricValue}>
            {report.snoringTrend !== undefined ? `${report.snoringTrend}%` : "—"}
          </div>
          <div style={styles.metricSub}>
            {report.snoringTrend > 0 ? "↑ Increasing" : "↓ Decreasing"}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📈 Sleep Score Trend</div>
          <WeeklyChart data={chartData} />
        </div>
      )}

      {/* AI Summary Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🧠 AI Insight</div>
        <div style={styles.aiSummary}>
          {report.summary || "No summary available."}
        </div>
      </div>

      {/* Factors Impact Section */}
      {report.factorImpact && Object.keys(report.factorImpact).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>⚡ Factors Impacting Sleep</div>
          <div style={styles.factorList}>
            {Object.entries(report.factorImpact).map(([key, val]) => {
              const isPositive = val > 0;
              return (
                <div key={key} style={styles.factorItem}>
                  <span style={styles.factorIcon}>
                    {isPositive ? "✅" : "⚠️"}
                  </span>
                  <span style={styles.factorText}>
                    <strong>{key}</strong>{" "}
                    <span style={isPositive ? styles.positive : styles.negative}>
                      {isPositive
                        ? `improved sleep by ${val.toFixed(1)}%`
                        : `reduced sleep by ${Math.abs(val).toFixed(1)}%`}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Details Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📅 Daily Breakdown</div>
        {Array.isArray(report.dailyData) && report.dailyData.length > 0 ? (
          <div style={styles.dailyGrid}>
            {report.dailyData.map((d, idx) => (
              <div key={idx} style={styles.dailyCard}>
                <div style={styles.dailyDate}>
                  {new Date(d.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div style={styles.dailyRow}>
  <span>😴 Sleep hours</span>
  <strong>{d.sleepHours?.toFixed(1) ?? "—"} hrs</strong>
</div>

<div style={styles.dailyRow}>
  <span>🛏 In Bed</span>
  <span style={styles.sleepBadge(d.category)}>
    {d.category || "—"}
    {d.category === "Too Short" && " (<5h)"}
    {d.category === "Short" && " (5-7h)"}
    {d.category === "Normal" && " (7-9h)"}
    {d.category === "Too Long" && " (>9h)"}
  </span>
</div>
                
                <div style={styles.dailyRow}>
                  <span>⭐ Score</span>
                  <span style={styles.scoreBadge}>{d.score ?? "—"}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(d.score ?? 0)} />
                </div>
                <div style={styles.dailyRow}>
                  <span>😤 Snoring</span>
                  <strong>{d.snore?.toFixed(1) ?? "—"}%</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No daily data available</p>
        )}
      </div>
    </div>
  );
}