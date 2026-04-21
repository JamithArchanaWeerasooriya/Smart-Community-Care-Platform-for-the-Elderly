import "./SleepDashboard.css";
import "material-icons/iconfont/material-icons.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../services/api";
import SleepTimeChart from "./components/SleepTimeChart";

function SleepDashboard() {

  const [sessions, setSessions] = useState([]);

  useEffect(() => {

    const loadSessions = async () => {

      try {

        const res = await API.get("/sleep/history");

        setSessions(res.data);

      } catch (error) {

        console.error("Failed to load sessions", error);

      }

    };

    loadSessions();

  }, []);


  const lastSession = sessions[0];

  const recentSessions = sessions.slice(0, 6);

  const totalSnore = sessions.reduce(
    (sum, s) => sum + (s.snoreCount || 0),
    0
  );

  const avgScore =
    sessions.length > 0
      ? Math.round(
        sessions.reduce((sum, s) => sum + (s.sleepScore || 0), 0) /
        sessions.length
      )
      : 0;

  const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  } else if (hour < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
};    


  return (

    <div className="my-reminders-app">

      <div className="app-content">

        {/* HEADER */}

        <header className="app-header">

          <div className="header-hero">

            <div className="header-copy">

              <div className="header-text">

                <p className="greeting-date">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                  }).toUpperCase()}
                </p>

                <h1 className="greeting-title">
  {getGreeting()}
</h1>

                <p className="greeting-subtitle">
                  Monitor snoring patterns and analyze your sleep quality.
                </p>

              </div>

              <div className="header-actions">

                <Link to="/monitor">

                  <button className="btn-primary">
                    <span className="material-icons">play_arrow</span>
                    Start Monitoring
                  </button>

                </Link>
                <Link to="/ai-assistant">

                  <button className="btn-primary">
                    <span className="material-icons">play_arrow</span>
                    AI Sleep Assistant
                  </button>

                </Link>

              </div>

            </div>


            {/* LAST SESSION */}

            <aside className="header-highlight">

              <p className="header-highlight-label">
                Last Sleep Session
              </p>

              {lastSession ? (

                <>
                  <h2 className="header-highlight-title">
                    {new Date(lastSession.createdAt).toLocaleDateString()}
                  </h2>

                  <p className="header-highlight-meta">
                    Snore Level: {lastSession.snoreLevel}
                  </p>

                  <p className="header-highlight-desc">
                    Snore Duration: {lastSession.snoreDuration}s
                  </p>
                </>

              ) : (

                <p>No sessions recorded yet</p>

              )}

            </aside>

          </div>


          {/* SUMMARY CARDS */}

          <div className="header-stats">

            <article className="summary-card tone-blue">

              <span className="material-icons summary-icon">
                hotel
              </span>

              <div>
                <p className="summary-label">
                  Total Sessions
                </p>

                <p className="summary-value">
                  {sessions.length}
                </p>
              </div>

            </article>


            <article className="summary-card tone-green">

              <span className="material-icons summary-icon">
                graphic_eq
              </span>

              <div>
                <p className="summary-label">
                  Snore Events
                </p>

                <p className="summary-value">
                  {totalSnore}
                </p>
              </div>

            </article>


            <article className="summary-card tone-amber">

              <span className="material-icons summary-icon">
                timeline
              </span>

              <div>
                <p className="summary-label">
                  Average Score
                </p>

                <p className="summary-value">
                  {avgScore}
                </p>
              </div>

            </article>

          </div>

        </header>


        {/* MAIN BOARD */}

        <main className="main-board">

          <section className="board-shell">

            <div className="board-header-row">

              <div>

                <p className="board-eyebrow">
                  Overview
                </p>

                <h2 className="board-title">
                  Recent Sleep Sessions
                </h2>

                <p className="board-subtitle">
                  Review your latest sleep monitoring results.
                </p>

              </div>

              <div className="board-count-chip">

                <span className="material-icons">
                  history
                </span>

                {recentSessions.length} sessions

              </div>

            </div>


            {/* SESSION CARDS */}

            <div className="cards-grid">

              {recentSessions.map((s) => (

                <div
                  key={s._id}
                  className="reminder-card type-custom"
                >

                  <div className="card-top">

                    <span className="card-type-pill">

                      <span className="material-icons">
                        hotel
                      </span>

                      Session

                    </span>

                  </div>


                  <div className="card-schedule-row">

                    <div className="card-time">

                      <span className="material-icons schedule-icon">
                        schedule
                      </span>

                      {new Date(s.createdAt).toLocaleDateString()}

                    </div>

                  </div>


                  <div className="card-body">

                    <h3 className="card-title">
                      Snore Level: {s.snoreLevel}
                    </h3>

                    <p className="card-desc">
                      Snore Duration: {s.snoreDuration}s
                    </p>

                  </div>

                </div>

              ))}

            </div>
            {/* SLEEP TIME CHART */}

            <SleepTimeChart sessions={sessions} />

          </section>

        </main>

      </div>

    </div>

  );

}

export default SleepDashboard;