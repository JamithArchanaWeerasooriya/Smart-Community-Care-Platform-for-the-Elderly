import { useEffect, useState } from "react";
import API from "../../../services/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import "./SleepReport.css";

function SleepReport({ sessionId }) {

  const [data, setData] = useState(null);

  useEffect(() => {

    const loadReport = async () => {

      try {

        const res = await API.get(
          `/sleep/timeline/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        setData(res.data);

      } catch (error) {

        console.error("Report load error:", error);

      }

    };

    if (sessionId) loadReport();

  }, [sessionId]);

  if (!sessionId) return null;

  if (!data) {

    return (
      <div className="sleep-report">
        <h2 className="report-title">Sleep Report</h2>
        <p className="report-loading">Loading report...</p>
      </div>
    );
  }

  const timeline = data.timeline || [];

  return (

    <div className="sleep-report">

      <h2 className="report-title">
        Sleep Analysis
      </h2>

      <div className="report-grid">

        <div className="report-box">
          <p className="report-label">Sleep Score</p>
          <p className="report-value">{data.sleepScore ?? 0}</p>
        </div>

        <div className="report-box">
          <p className="report-label">Snore Level</p>
          <p className="report-value">{data.snoreLevel ?? "Low"}</p>
        </div>

        <div className="report-box">
          <p className="report-label">Snore Duration</p>
          <p className="report-value">{data.snoreDuration ?? 0}s</p>
        </div>

        <div className="report-box">
          <p className="report-label">Snore Events</p>
          <p className="report-value">{data.snoreCount ?? 0}</p>
        </div>

      </div>


      <div className="chart-wrapper">

        <h3 className="chart-title">
          Snore Timeline
        </h3>

        {timeline.length === 0 ? (

          <p className="report-loading">
            No snore data recorded
          </p>

        ) : (

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={timeline}>

              <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>

              <XAxis dataKey="time" />

              <YAxis
                domain={[0,1]}
                tickCount={6}
                tickFormatter={(v)=>v.toFixed(1)}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="snore"
                stroke="#176b87"
                strokeWidth={3}
                dot={false}
              />

            </LineChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>

  );

}

export default SleepReport;