import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import './EmotionDashboard.css';
import EmotionTimeline from './EmotionTimeline';
import EmotionFrequency from './EmotionFrequency';
import EmotionDistribution from './EmotionDistribution';
import { saveReading, startSession, endSession, generateSessionId } from './emotionApi.js';

const API_URL = import.meta.env.VITE_EMOTION_API || 'http://localhost:8000/detect-emotion';

// Patient config — override via props or env
const DEFAULT_PATIENT_ID   = import.meta.env.VITE_DEFAULT_PATIENT_ID   || 'default-patient';
const DEFAULT_PATIENT_NAME = import.meta.env.VITE_DEFAULT_PATIENT_NAME || 'Patient';

const EMOTIONS = ['happy', 'neutral', 'sad', 'angry', 'fear', 'disgust', 'surprise'];

const EMOTION_META = {
  happy:    { icon: 'sentiment_very_satisfied', color: '#0f9f74', bg: 'linear-gradient(180deg,#e8fbf4 0%,#dff7ef 100%)', border: 'rgba(15,159,116,0.14)', textColor: '#0e5f4a', label: 'Happy' },
  neutral:  { icon: 'sentiment_neutral',        color: '#176b87', bg: 'linear-gradient(180deg,#deeff7 0%,#d3e7f1 100%)', border: 'rgba(23,107,135,0.14)',  textColor: '#134e63', label: 'Neutral' },
  sad:      { icon: 'sentiment_dissatisfied',   color: '#5a6b9f', bg: 'linear-gradient(180deg,#eceeff 0%,#dfe2f7 100%)', border: 'rgba(90,107,159,0.14)',  textColor: '#3a4580', label: 'Sad' },
  angry:    { icon: 'sentiment_very_dissatisfied', color: '#df5a6a', bg: 'linear-gradient(180deg,#fff0f2 0%,#fde0e4 100%)', border: 'rgba(223,90,106,0.14)', textColor: '#b42943', label: 'Angry' },
  fear:     { icon: 'visibility_off',           color: '#9b5de5', bg: 'linear-gradient(180deg,#f3ecff 0%,#ebe0fc 100%)', border: 'rgba(155,93,229,0.14)',  textColor: '#6b2db5', label: 'Fear' },
  disgust:  { icon: 'sick',                     color: '#6a8f3c', bg: 'linear-gradient(180deg,#eef7e0 0%,#e3f0d0 100%)', border: 'rgba(106,143,60,0.14)',  textColor: '#3d5c17', label: 'Disgust' },
  surprise: { icon: 'celebration',              color: '#f28c28', bg: 'linear-gradient(180deg,#fff1df 0%,#ffe7cc 100%)', border: 'rgba(242,140,40,0.14)',  textColor: '#8e4d0d', label: 'Surprise' },
};

const TAB_KEYS = ['timeline', 'frequency', 'distribution', 'log'];
const TAB_CONFIG = {
  timeline:     { label: 'Timeline',     description: 'Emotion changes over each captured frame.' },
  frequency:    { label: 'Frequency',    description: 'How often each emotion appeared this session.' },
  distribution: { label: 'Distribution', description: 'Percentage breakdown of all detected emotions.' },
  log:          { label: 'Log',          description: 'Raw list of every detected reading.' },
};

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function EmotionDashboard() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [camError, setCamError] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [now, setNow] = useState(new Date());
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [dbStatus, setDbStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Stats
  const totalReadings = history.length;
  const dominantEmotion = useMemo(() => {
    if (!history.length) return null;
    const counts = {};
    history.forEach(r => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [history]);
  const positiveCount = useMemo(() =>
    history.filter(r => ['happy', 'surprise', 'neutral'].includes(r.emotion)).length,
    [history]);
  const negativeCount = useMemo(() =>
    history.filter(r => ['sad', 'angry', 'fear', 'disgust'].includes(r.emotion)).length,
    [history]);

  const sessionDuration = useMemo(() => {
    if (!sessionStart) return '00:00';
    const secs = Math.floor((now - sessionStart) / 1000);
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [now, sessionStart]);

  const headerDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Camera control
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCamError(null);
      return true;
    } catch {
      setCamError('Camera access denied. Please allow camera permissions.');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const sessionIdRef = useRef(null);

  const captureAndSend = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setIsAnalyzing(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setIsAnalyzing(false); return; }
      try {
        const fd = new FormData();
        fd.append('file', blob, 'frame.jpg');
        const res = await fetch(API_URL, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.emotion) {
          const record = { time: formatTime(new Date()), emotion: data.emotion, confidence: data.confidence ?? null, ts: Date.now() };
          setCurrentEmotion(record);
          setHistory(prev => [...prev.slice(-200), record]);
          // Persist to MongoDB
          setDbStatus('saving');
          const saved = await saveReading({
            emotion: data.emotion,
            confidence: data.confidence ?? null,
            sessionId: sessionIdRef.current,
            patientId: DEFAULT_PATIENT_ID,
            patientName: DEFAULT_PATIENT_NAME,
          });
          setDbStatus(saved?.success ? 'saved' : 'error');
          setTimeout(() => setDbStatus(null), 2000);
        }
      } catch { /* network errors silently skipped */ }
      finally { setIsAnalyzing(false); }
    }, 'image/jpeg', 0.85);
  }, []);

  const startMonitoring = useCallback(async () => {
    const ok = await startCamera();
    if (!ok) return;
    const sid = generateSessionId();
    sessionIdRef.current = sid;
    setSessionId(sid);
    setHistory([]);
    setCurrentEmotion(null);
    setSessionStart(new Date());
    setIsMonitoring(true);
    // Create session in MongoDB
    await startSession({ sessionId: sid, patientId: DEFAULT_PATIENT_ID, patientName: DEFAULT_PATIENT_NAME });
    intervalRef.current = setInterval(captureAndSend, 2000);
  }, [startCamera, captureAndSend]);

  const stopMonitoring = useCallback(() => {
    clearInterval(intervalRef.current);
    stopCamera();
    // End session in MongoDB
    if (sessionIdRef.current) {
      endSession({ sessionId: sessionIdRef.current });
    }
    sessionIdRef.current = null;
    setSessionId(null);
    setIsMonitoring(false);
    setIsAnalyzing(false);
  }, [stopCamera]);

  useEffect(() => () => { clearInterval(intervalRef.current); stopCamera(); }, [stopCamera]);

  const curMeta = currentEmotion ? EMOTION_META[currentEmotion.emotion] : null;
  const domMeta = dominantEmotion ? EMOTION_META[dominantEmotion] : null;
  const tabMeta = TAB_CONFIG[activeTab];

  // Frequency data
  const freqData = useMemo(() => {
    const counts = {};
    history.forEach(r => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
    return EMOTIONS.filter(e => counts[e]).map(e => ({ emotion: e, count: counts[e], ...EMOTION_META[e] }));
  }, [history]);

  // Log (newest first)
  const logData = useMemo(() => [...history].reverse().slice(0, 50), [history]);

  return (
    <div className="ed-app">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="ed-content">

        {/* ── HEADER ── */}
        <header className="ed-app-header">
          <div className="ed-header-hero">

            {/* Left hero card */}
            <div className="ed-header-copy">
              <div className="ed-header-text">
                <p className="ed-greeting-date">{headerDate}</p>
                <h1 className="ed-greeting-title">{getGreeting()}!</h1>
                <p className="ed-greeting-subtitle">AI-powered emotion monitoring for elder care. Real-time insight into emotional wellbeing — every 2 seconds.</p>
              </div>
              <div className="ed-header-actions">
                <button className="ed-btn-icon" onClick={isMonitoring ? stopMonitoring : startMonitoring} title={isMonitoring ? 'Stop' : 'Start'}>
                  <span className="material-icons">{isMonitoring ? 'stop' : 'play_arrow'}</span>
                </button>
                <button className="ed-btn-primary" onClick={isMonitoring ? stopMonitoring : startMonitoring}>
                  <span className="material-icons">{isMonitoring ? 'stop_circle' : 'videocam'}</span>
                  {isMonitoring ? 'Stop Monitor' : 'Start Monitor'}
                </button>
              </div>
            </div>

            {/* Right highlight card — webcam + current emotion */}
            <aside className="ed-header-highlight">
              <p className="ed-header-highlight-label">Live Webcam Feed</p>
              <div className="ed-webcam-wrapper">
                <video ref={videoRef} className="ed-webcam-video" muted playsInline />
                {!isMonitoring && (
                  <div className="ed-webcam-placeholder">
                    <span className="material-icons">videocam_off</span>
                    <span>Camera inactive</span>
                  </div>
                )}
                {isAnalyzing && <div className="ed-scan-bar" />}
                {isMonitoring && (
                  <div className={`ed-live-dot ${isAnalyzing ? 'analyzing' : ''}`}>
                    <span className="material-icons">{isAnalyzing ? 'radar' : 'fiber_manual_record'}</span>
                    {isAnalyzing ? 'Analyzing…' : 'Live'}
                  </div>
                )}
              </div>
              {currentEmotion && curMeta ? (
                <>
                  <h2 className="ed-header-highlight-title" style={{ color: curMeta.textColor }}>
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 8 }}>{curMeta.icon}</span>
                    {curMeta.label}
                  </h2>
                  {currentEmotion.confidence != null && (
                    <p className="ed-header-highlight-meta">{currentEmotion.confidence.toFixed(1)}% confidence · {currentEmotion.time}</p>
                  )}
                </>
              ) : (
                <h2 className="ed-header-highlight-title">No emotion detected yet</h2>
              )}
              <p className="ed-header-highlight-desc">Captures a frame every 2 seconds and sends to the emotion API.</p>
              {dbStatus && (
                <p style={{ fontSize: '0.72rem', marginTop: 6, fontWeight: 700,
                  color: dbStatus === 'saved' ? '#0f9f74' : dbStatus === 'error' ? '#df5a6a' : '#176b87' }}>
                  {dbStatus === 'saving' ? '⏳ Saving to MongoDB…' : dbStatus === 'saved' ? '✓ Saved to MongoDB' : '⚠ MongoDB save failed'}
                </p>
              )}
            </aside>
          </div>

          {/* Stat cards */}
          <div className="ed-header-stats">
            <article className="ed-summary-card tone-blue">
              <span className="material-icons ed-summary-icon">query_stats</span>
              <div>
                <p className="ed-summary-label">Total Readings</p>
                <p className="ed-summary-value">{totalReadings}</p>
              </div>
            </article>
            <article className="ed-summary-card tone-green">
              <span className="material-icons ed-summary-icon">sentiment_satisfied</span>
              <div>
                <p className="ed-summary-label">Positive Emotions</p>
                <p className="ed-summary-value">{positiveCount}</p>
              </div>
            </article>
            <article className="ed-summary-card tone-amber">
              <span className="material-icons ed-summary-icon">sentiment_stressed</span>
              <div>
                <p className="ed-summary-label">Distress Signals</p>
                <p className="ed-summary-value">{negativeCount}</p>
              </div>
            </article>
            <article className="ed-summary-card tone-purple">
              <span className="material-icons ed-summary-icon">auto_awesome</span>
              <div>
                <p className="ed-summary-label">Dominant Emotion</p>
                <p className="ed-summary-value" style={{ color: domMeta?.color || 'inherit' }}>
                  {dominantEmotion ? EMOTION_META[dominantEmotion].label : '—'}
                </p>
              </div>
            </article>
          </div>
        </header>

        {/* Error */}
        {camError && (
          <div className="ed-alert-glass ed-error-alert">
            <span className="material-icons">error_outline</span>
            <p>{camError}</p>
          </div>
        )}

        {/* ── MAIN BOARD ── */}
        <main className="ed-main-board">
          <section className="ed-board-shell">
            <div className="ed-board-header-row">
              <div>
                <p className="ed-board-eyebrow">Analytics</p>
                <h2 className="ed-board-title">{tabMeta.label}</h2>
                <p className="ed-board-subtitle">{tabMeta.description}</p>
              </div>
              <div className="ed-board-count-chip">
                <span className="material-icons">bar_chart</span>
                {totalReadings} readings
              </div>
            </div>

            {/* Segmented tabs */}
            <div className="ed-segmented-control" role="tablist">
              {TAB_KEYS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`ed-segment-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {TAB_CONFIG[tab].label}
                </button>
              ))}
            </div>

            {/* Insight pills */}
            <div className="ed-board-insight-row">
              <div className="ed-board-insight-pill tone-success">
                <span className="material-icons">timer</span>
                <span>Session</span>
                <strong>{sessionDuration}</strong>
              </div>
              <div className="ed-board-insight-pill tone-neutral">
                <span className="material-icons">autorenew</span>
                <span>Interval</span>
                <strong>2s</strong>
              </div>
              {dominantEmotion && (
                <div className="ed-board-insight-pill tone-neutral" style={{ background: '#f4f8fa', color: EMOTION_META[dominantEmotion].textColor }}>
                  <span className="material-icons">{EMOTION_META[dominantEmotion].icon}</span>
                  <span>Dominant</span>
                  <strong>{EMOTION_META[dominantEmotion].label}</strong>
                </div>
              )}
              {negativeCount > 3 && (
                <div className="ed-board-insight-pill tone-danger">
                  <span className="material-icons">warning</span>
                  <span>Distress detected</span>
                  <strong>{negativeCount}×</strong>
                </div>
              )}
            </div>

            {/* Tab content */}
            {history.length === 0 ? (
              <div className="ed-empty-state">
                <div className="ed-empty-icon-wrap">
                  <span className="material-icons">face</span>
                </div>
                <h3>No Data Yet</h3>
                <p>Start monitoring to begin capturing emotion data from the webcam.</p>
                <button className="ed-btn-secondary mt-4" onClick={startMonitoring}>
                  <span className="material-icons">videocam</span>
                  Begin Session
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'timeline' && <EmotionTimeline history={history} />}
                {activeTab === 'frequency' && <EmotionFrequency freqData={freqData} total={totalReadings} />}
                {activeTab === 'distribution' && <EmotionDistribution history={history} total={totalReadings} />}
                {activeTab === 'log' && (
                  <div className="ed-log-grid">
                    {logData.map((r, i) => {
                      const m = EMOTION_META[r.emotion];
                      return (
                        <article
                          key={r.ts + i}
                          className="ed-emotion-card"
                          style={{ background: m.bg, borderColor: m.border, animationDelay: `${i * 0.04}s` }}
                        >
                          <div className="ed-card-top">
                            <span className="ed-card-type-pill" style={{ color: m.textColor }}>
                              <span className="material-icons">{m.icon}</span>
                              {m.label}
                            </span>
                          </div>
                          <div className="ed-card-schedule-row">
                            <div className="ed-card-time" style={{ color: m.textColor }}>
                              <span className="material-icons ed-schedule-icon">schedule</span>
                              {r.time}
                            </div>
                            {r.confidence != null && (
                              <span className={`ed-status-badge ed-status-${r.confidence > 75 ? 'high' : r.confidence > 50 ? 'mid' : 'low'}`}>
                                <span className="material-icons">analytics</span>
                                {r.confidence.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="ed-card-body">
                            <h3 className="ed-card-title" style={{ color: m.textColor }}>{m.label}</h3>
                            <p className="ed-card-desc">
                              {r.confidence != null ? `Detected with ${r.confidence.toFixed(1)}% confidence` : 'Detected from webcam frame'}
                            </p>
                          </div>
                          <div className="ed-card-tags">
                            <span className="ed-tag">
                              <span className="material-icons">face</span>
                              Face detected
                            </span>
                            {r.confidence != null && r.confidence > 80 && (
                              <span className="ed-tag">
                                <span className="material-icons">verified</span>
                                High confidence
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* Mobile FAB */}
        <button
          className="ed-mobile-fab"
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          aria-label={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
        >
          <span className="material-icons">{isMonitoring ? 'stop' : 'videocam'}</span>
        </button>
      </div>
    </div>
  );
}