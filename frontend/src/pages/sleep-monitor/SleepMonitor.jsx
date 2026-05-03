import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "material-icons/iconfont/material-icons.css";
import "./SleepMonitor.css";
import SleepReport from "./components/SleepReport";

function SleepMonitor() {
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [showDelayPopup, setShowDelayPopup] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState(null);
  const [showFactorsPopup, setShowFactorsPopup] = useState(false);
  const [waitingForDelay, setWaitingForDelay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const delayTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 🆕 Sleep timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  const [factors, setFactors] = useState({
    alcohol: false,
    coffee: false,
    tea: false,
    ateLate: false,
    workout: false,
    stress: false,
  });

  const [customFactors, setCustomFactors] = useState([]);
  const [newFactor, setNewFactor] = useState("");
  let buffer = [];

  const getFactorsPayload = (
    selectedFactors = factors,
    selectedCustomFactors = customFactors
  ) => ({
    ...selectedFactors,
    custom: selectedCustomFactors.map((factor) => factor.trim()).filter(Boolean),
  });

  const saveSleepFactors = async (
    selectedFactors = factors,
    selectedCustomFactors = customFactors
  ) => {
    if (!sessionId) return;
    await API.post("/sleep/factors", {
      sessionId,
      factors: getFactorsPayload(selectedFactors, selectedCustomFactors),
    });
  };

  // Format seconds as HH:MM:SS
  const formatElapsedTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const parseDelayToMs = (delayStr) => {
    if (!delayStr) return 0;
    const [value, unit] = delayStr.split(" ");
    const num = parseInt(value, 10);
    if (unit.includes("Minute")) return num * 60 * 1000;
    if (unit.includes("Hour")) return num * 60 * 60 * 1000;
    return 0;
  };

  const clearDelayTimers = () => {
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    delayTimerRef.current = null;
    countdownIntervalRef.current = null;
  };

  const cancelWaiting = () => {
    clearDelayTimers();
    setWaitingForDelay(false);
    setCountdown(0);
  };

  // 🆕 Start sleep timer
  const startSleepTimer = () => {
    setElapsedSeconds(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopSleepTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startWithDelay = () => {
    const delayMs = parseDelayToMs(selectedDelay);
    if (delayMs <= 0) {
      startSleep();
      return;
    }
    setWaitingForDelay(true);
    setCountdown(Math.ceil(delayMs / 1000));
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    delayTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setWaitingForDelay(false);
      startSleep();
    }, delayMs);
  };

  const startSleep = async () => {
    if (recording) return;
    const res = await API.post("/sleep/start", {
      sleepStartTime: new Date().toISOString(),
      factors: getFactorsPayload(),
    });
    const session = res.data._id;
    setSessionId(session);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = async (event) => {
      const input = event.inputBuffer.getChannelData(0);
      buffer.push(...input);
      if (buffer.length > 16000 * 4) {
        const wavBlob = encodeWAV(buffer);
        const formData = new FormData();
        formData.append("audio", wavBlob, "segment.wav");
        formData.append("sessionId", session);
        await API.post("/sleep/segment", formData);
        buffer = [];
      }
    };
    setRecording(true);
    startSleepTimer(); // 🆕 start the timer
  };

  const stopSleep = async () => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) await audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    await API.post("/sleep/end", {
      sessionId,
      sleepEndTime: new Date().toISOString(),
      factors: getFactorsPayload(),
    });
    setRecording(false);
    setShowReport(true);
    stopSleepTimer(); // 🆕 stop the timer
  };

  const encodeWAV = (samples) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
    }
    return new Blob([view], { type: "audio/wav" });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      clearDelayTimers();
      stopSleepTimer();
    };
  }, []);

  const handleStartClick = () => {
    if (recording || waitingForDelay) return;
    if (selectedDelay && selectedDelay !== "Not Set") {
      startWithDelay();
    } else {
      startSleep();
    }
  };

  return (
    <div className="my-reminders-app">
      <div className="app-content">
        <header className="app-header">
          <div className="header-hero">
            <div className="header-copy">
              <div className="header-text">
                <p className="greeting-date">Sleep Monitoring</p>
                <h1 className="greeting-title">SLEEP RECORDER</h1>
                <p className="greeting-subtitle">
                  Start monitoring your sleep to detect snoring.
                </p>
              </div>
            </div>
            <aside className="header-highlight">
              <p className="header-highlight-label">Recording Status</p>
              <h2 className="header-highlight-title">
                {recording
                  ? "Monitoring Active"
                  : waitingForDelay
                  ? "Waiting for delay..."
                  : "Ready to Start"}
              </h2>
              <p className="header-highlight-desc">
                {recording
                  ? "Audio is currently being analyzed."
                  : waitingForDelay
                  ? `Recording will start in ${countdown} seconds.`
                  : "Press the button to begin monitoring."}
              </p>
            </aside>
          </div>
        </header>

        <main className="main-board">
          <section className="board-shell">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 0",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "800",
                  color: "#176b87",
                  letterSpacing: "2px",
                }}
              >
                {currentTime}
              </h2>

              {!recording && !waitingForDelay && (
                <button className="monitor-button" onClick={handleStartClick}>
                  <span className="material-icons">mic</span>
                  Start Monitoring
                </button>
              )}

              {waitingForDelay && (
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button className="monitor-button" style={{ background: "#f59e0b" }} disabled>
                    <span className="material-icons">hourglass_top</span>
                    Starting in {countdown}s
                  </button>
                  <button
                    className="monitor-button"
                    style={{ background: "#64748b" }}
                    onClick={cancelWaiting}
                  >
                    <span className="material-icons">cancel</span>
                    Cancel
                  </button>
                </div>
              )}

              {recording && (
                <button className="monitor-button active" onClick={stopSleep}>
                  <span className="material-icons">stop</span>
                  Stop Monitoring
                </button>
              )}
            </div>

            {/* 🔥 THREE CARDS GRID */}
            <div className="monitor-cards">
              {/* 🌙 Time To Sleep Card */}
              <div className="sleep-card" onClick={() => setShowDelayPopup(true)}>
                <span className="material-icons sleep-icon">bedtime</span>
                <div>
                  <h3>Time To Sleep</h3>
                  <p>Delay: {selectedDelay || "Not Set"}</p>
                </div>
              </div>

              {/* ☕ Factors Card */}
              <div className="sleep-card" onClick={() => setShowFactorsPopup(true)}>
                <span className="material-icons sleep-icon">emoji_food_beverage</span>
                <div>
                  <h3>Factors</h3>
                  <p>
                    {[
                      ...Object.keys(factors).filter((f) => factors[f]),
                      ...customFactors,
                    ].slice(0, 3).join(", ") || "None"}
                    ...
                  </p>
                </div>
              </div>

              {/* ⏱ Live Sleep Timer Card (only visible when recording) */}
              {recording && (
                <div className="sleep-card timer-card">
                  <span className="material-icons sleep-icon">timer</span>
                  <div>
                    <h3>Sleep Timer</h3>
                    <p className="timer-value">{formatElapsedTime(elapsedSeconds)}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {showReport && <SleepReport sessionId={sessionId} />}
        </main>
      </div>

      {/* Delay Popup */}
      {showDelayPopup && (
        <div className="delay-popup-overlay">
          <div className="delay-popup">
            <span className="popup-close" onClick={() => setShowDelayPopup(false)}>
              ✕
            </span>
            <h2>Time To Sleep</h2>
            <p>Select when monitoring should start</p>
            {[
              "5 Minutes", "10 Minutes", "15 Minutes",
              "20 Minutes", "30 Minutes", "45 Minutes",
              "60 Minutes", "2 Hours", "3 Hours",
            ].map((time) => (
              <label key={time} className="delay-option">
                <span>{time}</span>
                <input
                  type="radio"
                  name="delay"
                  checked={selectedDelay === time}
                  onChange={() => setSelectedDelay(time)}
                />
              </label>
            ))}
            <button onClick={() => setShowDelayPopup(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Factors Popup */}
      {showFactorsPopup && (
        <div className="delay-popup-overlay">
          <div className="delay-popup">
            <span className="popup-close" onClick={() => setShowFactorsPopup(false)}>
              ✕
            </span>
            <h2>Factors</h2>
            <p>Select factors affecting your sleep</p>
            {Object.keys(factors).map((f) => (
              <label key={f} className="delay-option">
                <span>
                  {f === "ateLate"
                    ? "Ate Late"
                    : f === "workout"
                    ? "Worked Out"
                    : f === "stress"
                    ? "Stressful Day"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </span>
                <input
                  type="checkbox"
                  checked={factors[f]}
                  onChange={() => setFactors({ ...factors, [f]: !factors[f] })}
                />
              </label>
            ))}
            {customFactors.map((cf, i) => (
              <div key={i} className="delay-option">
                <span>{cf}</span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>custom</span>
              </div>
            ))}
            <div className="custom-input">
              <input
                value={newFactor}
                onChange={(e) => setNewFactor(e.target.value)}
                placeholder="Add custom factor..."
              />
              <button
                onClick={() => {
                  if (newFactor.trim()) {
                    setCustomFactors([...customFactors, newFactor.trim()]);
                    setNewFactor("");
                  }
                }}
              >
                Add
              </button>
            </div>
            <button
              onClick={async () => {
                await saveSleepFactors();
                setShowFactorsPopup(false);
              }}
            >
              Done
            </button>
          </div>
          <button
            className="floating-add-btn"
            onClick={() => {
              const value = prompt("Enter new factor:");
              if (value?.trim()) setCustomFactors([...customFactors, value.trim()]);
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default SleepMonitor;
