import "./AISleepAssistant.css";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import API from "../../services/api";

// ─── Inline markdown: **bold**, *italic* ──────────────────────────────────────
function renderInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Full markdown → JSX (bold, italic, numbered lists, bullets, paragraphs) ──
function parseMarkdown(text) {
  const lines = text.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list item: "1. " or "1) "
    const numMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)[.)]\s+(.*)$/);
        if (!m) break;
        items.push(<li key={i} style={{ marginBottom: 4 }}>{renderInline(m[2])}</li>);
        i++;
      }
      output.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: 20, margin: "6px 0" }}>
          {items}
        </ol>
      );
      continue;
    }

    // Bullet list item: "- " or "• "
    const bulletMatch = line.match(/^[-•]\s+(.*)$/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^[-•]\s+(.*)$/);
        if (!m) break;
        items.push(<li key={i} style={{ marginBottom: 4 }}>{renderInline(m[1])}</li>);
        i++;
      }
      output.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: "6px 0" }}>
          {items}
        </ul>
      );
      continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      output.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Normal line with inline formatting
    output.push(
      <div key={i} style={{ marginBottom: 2, lineHeight: 1.6 }}>
        {renderInline(line)}
      </div>
    );
    i++;
  }

  return output;
}

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────────
const MicIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="22" x2="12" y2="17" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MoonIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </svg>
);

const AlertIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Constants ─────────────────────────────────────────────────────────────────
const QUICK_CHIPS = {
  en: [
    "Why am I snoring?",
    "How to sleep 8 hours?",
    "What is sleep apnea?",
    "Tips for deeper sleep",
    "Is my sleep score good?",
  ],
  si: [
    "ඇයි ගොරවන්නේ?",
    "පැය 8 නිදන්නේ කෙසේද?",
    "Sleep apnea යනු කුමක්ද?",
    "ගැඹුරු නින්දට ඉඟි",
    "මගේ score හොඳද?",
  ],
};

const INITIAL_GREETING = {
  en: "Hello! I'm your AI Sleep Assistant 🌙\n\nI can see your recent sleep data and give personalized advice.\n\nAsk me anything about your sleep!",
  si: "ආයුබෝවන්! මම ඔබේ AI නිදි සහකරු 🌙\n\nඔබේ නිදීම් දත්ත දිහා බලලා හොඳ ඉඟි දෙන්නම්.\n\nනිදීම ගැන ඕනෑ දෙයක් අහන්න!",
};

const SNORE_COLORS = {
  Low:    { bg: "#e1f5ee", text: "#0f6e56", border: "#5dcaa5" },
  Medium: { bg: "#faeeda", text: "#854f0b", border: "#ef9f27" },
  Severe: { bg: "#fcebeb", text: "#a32d2d", border: "#e24b4a" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="ai-msg-row bot">
      <div className="ai-avatar">AI</div>
      <div className="ai-bubble bot typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="ai-stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="ai-stat-value" style={{ color }}>{value}</div>
      <div className="ai-stat-label">{label}</div>
      {sub && <div className="ai-stat-sub">{sub}</div>}
    </div>
  );
}

function TipCard({ tip }) {
  const typeMap = {
    alert:  { bg: "#fcebeb", border: "#e24b4a", tagBg: "#e24b4a", tagColor: "#fff", label: "ALERT" },
    warn:   { bg: "#faeeda", border: "#ef9f27", tagBg: "#ef9f27", tagColor: "#fff", label: "WARN" },
    info:   { bg: "#e6f1fb", border: "#378add", tagBg: "#378add", tagColor: "#fff", label: "INFO" },
    tip:    { bg: "#e1f5ee", border: "#1d9e75", tagBg: "#1d9e75", tagColor: "#fff", label: "TIP" },
  };
  const style = typeMap[tip.type] || typeMap.tip;

  return (
    <div className="ai-tip-card" style={{ background: style.bg, borderLeft: `4px solid ${style.border}` }}>
      <span className="ai-tip-tag" style={{ background: style.tagBg, color: style.tagColor }}>
        {style.label}
      </span>
      <h4 className="ai-tip-title">{tip.title}</h4>
      <p className="ai-tip-body">{tip.body}</p>
    </div>
  );
}

function AlertItem({ item }) {
  const isGood = item.sentiment === "good";
  return (
    <div className="ai-alert-item">
      <div className={`ai-alert-icon ${isGood ? "good" : item.severity}`}>
        {isGood ? <CheckIcon /> : <AlertIcon />}
      </div>
      <div className="ai-alert-text">
        <h4>{item.title}</h4>
        <p>{item.body}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
function AISleepAssistant() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState("chat");
  const [lang, setLang]             = useState("en");
  const [message, setMessage]       = useState("");
  const [chat, setChat]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [recording, setRecording]   = useState(false);
  const [sleepStats, setSleepStats] = useState(null);
  const [tips, setTips]             = useState([]);
  const [alertItems, setAlertItems] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const chatBoxRef  = useRef(null);
  const inputRef    = useRef(null);
  const recognitionRef = useRef(null);

  // ── Load sleep data on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Fetch last session from history
        const histRes = await API.get("/sleep/history");
        const sessions = histRes.data;
        if (!sessions?.length) { setStatsLoading(false); return; }

        const last = sessions[0];

        // Build stats
        const hours = ((last.totalSleepDuration || 0) / 3600).toFixed(1);
        const snoreLevel = last.snoreLevel || "Low";
        const snoreFreq  = (last.snoreFrequency || 0).toFixed(1);
        const score      = Math.round(last.sleepScore || 0);
        const episodes   = last.snoreCount || 0;

        setSleepStats({ hours, snoreLevel, snoreFreq, score, episodes,
          bedtime: last.sleepStartTime
            ? new Date(last.sleepStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—",
        });

        // Build dynamic tips
        const generatedTips = buildTips(last);
        setTips(generatedTips);

        // Build alerts
        const generatedAlerts = buildAlerts(last);
        setAlertItems(generatedAlerts);

      } catch (err) {
        console.error("Stats load error:", err);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  // Add greeting after stats loaded
  useEffect(() => {
    if (!statsLoading) {
      setChat([{ sender: "bot", text: INITIAL_GREETING[lang] }]);
    }
  }, [statsLoading]); // eslint-disable-line

  // Auto-scroll chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat, loading]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function buildTips(session) {
    const tips = [];
    const hours = (session.totalSleepDuration || 0) / 3600;
    const freq  = session.snoreFrequency || 0;

    if (hours < 5)
      tips.push({ type: "alert", title: "Critical sleep deprivation", body: `You only slept ${hours.toFixed(1)}h. Chronic short sleep raises risk of heart disease and memory issues. Prioritize sleep tonight.` });
    else if (hours < 7)
      tips.push({ type: "warn",  title: "Below-recommended sleep duration", body: `${hours.toFixed(1)}h detected. Adults need 7–9h. Try moving your bedtime 30–45 minutes earlier each night.` });
    else
      tips.push({ type: "tip",   title: "Good sleep duration", body: `${hours.toFixed(1)}h — right in the healthy range. Maintain this consistency on weekends too!` });

    if (freq > 15)
      tips.push({ type: "alert", title: "Heavy snoring detected", body: `Snoring ${freq.toFixed(1)}% of your sleep. This may indicate sleep apnea. Try side sleeping. Consult a doctor if persistent.` });
    else if (freq > 5)
      tips.push({ type: "warn",  title: "Moderate snoring", body: "Avoid alcohol within 3h of bed and try sleeping on your side. A humidifier may also help reduce airway irritation." });

    if (session.factors?.alcohol)
      tips.push({ type: "warn", title: "Alcohol logged before bed", body: "Alcohol reduces REM sleep by up to 24%. It may help you fall asleep but fragments deep sleep stages." });
    if (session.factors?.coffee)
      tips.push({ type: "warn", title: "Caffeine detected", body: "Caffeine has a 6h half-life. A 3 PM coffee still has 50% effect at 9 PM. Cut off by 2 PM for best results." });
    if (session.factors?.stress)
      tips.push({ type: "alert", title: "Stress flagged", body: "Try 5 minutes of box breathing before bed: inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times." });
    if (session.factors?.ateLate)
      tips.push({ type: "warn", title: "Late eating logged", body: "Eating within 2h of bed raises core body temperature, which delays sleep onset. Try to finish dinner by 7–8 PM." });
    if (session.factors?.workout)
      tips.push({ type: "tip",  title: "Workout logged — good!", body: "Exercise improves deep NREM sleep. Just avoid intense workouts within 2h of bedtime as they raise cortisol." });

    tips.push({ type: "tip", title: "Keep your room cool", body: "Your core body temperature drops during sleep. A room at 18–20°C (65–68°F) helps trigger and maintain deeper sleep stages." });
    tips.push({ type: "info", title: "Avoid screens 1 hour before bed", body: "Blue light suppresses melatonin by up to 50%. Use night mode or switch to a book 60 minutes before your target bedtime." });

    return tips;
  }

  function buildAlerts(session) {
    const alerts = [];
    const hours = (session.totalSleepDuration || 0) / 3600;
    const freq  = session.snoreFrequency || 0;

    if (freq > 15)
      alerts.push({ severity: "danger", sentiment: "bad",  title: "High snoring detected last night", body: `${freq.toFixed(1)}% of your sleep had snoring — above the healthy 5% threshold. Side sleeping is recommended.` });
    else if (freq > 5)
      alerts.push({ severity: "warn",  sentiment: "bad",  title: "Moderate snoring detected", body: `Snoring in ${freq.toFixed(1)}% of sleep segments. Try nasal strips or side sleeping tonight.` });
    else
      alerts.push({ severity: "good",  sentiment: "good", title: "Low snoring — great night!", body: `Only ${freq.toFixed(1)}% snore rate. Your airway was clear most of the night.` });

    if (hours < 6)
      alerts.push({ severity: "danger", sentiment: "bad", title: "Significantly short sleep", body: `${hours.toFixed(1)}h only. Aim for 7–8h. Try going to bed 30 min earlier tonight.` });
    else if (hours < 7)
      alerts.push({ severity: "warn",  sentiment: "bad", title: "Sleep duration below ideal", body: `${hours.toFixed(1)}h detected. A 45-min earlier bedtime would close this gap over the week.` });
    else
      alerts.push({ severity: "good",  sentiment: "good", title: "Healthy sleep duration", body: `${hours.toFixed(1)}h of sleep — within the 7–9h recommended range. Keep it up!` });

    if (session.factors?.alcohol)
      alerts.push({ severity: "warn",  sentiment: "bad",  title: "Alcohol may have affected your sleep", body: "Alcohol was logged. This typically reduces REM sleep and increases midnight awakenings." });
    if (session.factors?.stress)
      alerts.push({ severity: "warn",  sentiment: "bad",  title: "Stress flagged last night", body: "Stress elevates cortisol which delays sleep onset and reduces deep sleep. Try relaxation techniques tonight." });
    if (!session.factors?.alcohol && !session.factors?.coffee)
      alerts.push({ severity: "good",  sentiment: "good", title: "No stimulants logged", body: "No alcohol or caffeine before bed — great choice for sleep quality!" });

    return alerts;
  }

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || loading) return;

    setChat(prev => [...prev, { sender: "user", text }]);
    setMessage("");
    setLoading(true);

    // Resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await API.post("/ai-sleep/chat", { message: text, lang });
      setChat(prev => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch {
      setChat(prev => [...prev, { sender: "bot", text: "Sorry, something went wrong. Please try again. 😔" }]);
    } finally {
      setLoading(false);
    }
  }, [message, loading, lang]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const useChip = (chip) => {
    setMessage(chip);
    inputRef.current?.focus();
  };

  // ── Voice Input ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setChat(prev => [...prev, {
        sender: "bot",
        text: "Voice input isn't supported in this browser. Try Chrome for voice features! 🎤"
      }]);
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const r = new SpeechRecognition();
    r.lang = lang === "si" ? "si-LK" : "en-US";
    r.continuous = false;
    r.interimResults = false;

    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setMessage(transcript);
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + "px";
      }
    };

    r.onerror = () => setRecording(false);
    r.onend   = () => setRecording(false);

    recognitionRef.current = r;
    r.start();
    setRecording(true);
  };

  // ── Language toggle ────────────────────────────────────────────────────────
  const toggleLang = (l) => {
    setLang(l);
    // Re-add greeting in new language
    setChat(prev => {
      const filtered = prev.filter((_, i) => i !== 0);
      return [{ sender: "bot", text: INITIAL_GREETING[l] }, ...filtered];
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const snoreColors = sleepStats
    ? SNORE_COLORS[sleepStats.snoreLevel] || SNORE_COLORS.Low
    : SNORE_COLORS.Low;

  const scoreColor = sleepStats
    ? sleepStats.score >= 80 ? "#1d9e75" : sleepStats.score >= 60 ? "#ef9f27" : "#e24b4a"
    : "#888";

  return (
    <div className="ai-container">
      <div className="ai-content">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="ai-header">
          <div className="ai-header-left">
            <div className="ai-logo">
              <MoonIcon size={18} />
            </div>
            <div>
              <h1 className="ai-title">AI Sleep Assistant</h1>
              <p className="ai-subtitle">
                {statsLoading
                  ? "Loading your data..."
                  : sleepStats
                    ? `Last night · ${sleepStats.hours}h · Snoring: ${sleepStats.snoreLevel}`
                    : "No recent session found"}
              </p>
            </div>
          </div>

          <div className="ai-header-right">
            {/* Language toggle */}
            <div className="ai-lang-toggle">
              <button
                className={`ai-lang-btn ${lang === "en" ? "active" : ""}`}
                onClick={() => toggleLang("en")}
              >EN</button>
              <button
                className={`ai-lang-btn ${lang === "si" ? "active" : ""}`}
                onClick={() => toggleLang("si")}
              >සිං</button>
            </div>

            {/* Sleep score badge */}
            {sleepStats && (
              <div className="ai-score-badge" style={{ borderColor: scoreColor }}>
                <div className="ai-score-num" style={{ color: scoreColor }}>
                  {sleepStats.score}
                </div>
                <div className="ai-score-label">Sleep Score</div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="ai-nav-buttons">
              <Link to="/monitor">
                <button className="ai-btn-primary">Start Monitoring</button>
              </Link>
              <Link to="/sleep-monitor">
                <button className="ai-btn-secondary">Dashboard</button>
              </Link>
            </div>
          </div>
        </header>

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        {sleepStats && (
          <div className="ai-stats-bar">
            <StatCard
              label="Duration"
              value={`${sleepStats.hours}h`}
              sub={parseFloat(sleepStats.hours) < 7 ? "Below 7h target" : "In healthy range"}
              color={parseFloat(sleepStats.hours) >= 7 ? "#1d9e75" : parseFloat(sleepStats.hours) >= 6 ? "#ef9f27" : "#e24b4a"}
            />
            <StatCard
              label="Snore Rate"
              value={`${sleepStats.snoreFreq}%`}
              sub={`${sleepStats.episodes} episodes · ${sleepStats.snoreLevel}`}
              color={snoreColors.border}
            />
            <StatCard
              label="Bedtime"
              value={sleepStats.bedtime}
              sub="Last night"
              color="#378add"
            />
            <StatCard
              label="Episodes"
              value={sleepStats.episodes}
              sub="Snoring events"
              color={sleepStats.episodes > 10 ? "#e24b4a" : sleepStats.episodes > 5 ? "#ef9f27" : "#1d9e75"}
            />
          </div>
        )}

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <div className="ai-tabs">
          {["chat", "tips", "alerts"].map(tab => (
            <button
              key={tab}
              className={`ai-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "chat"   && "💬 Chat"}
              {tab === "tips"   && "💡 Tips"}
              {tab === "alerts" && `🔔 Alerts${alertItems.filter(a => a.sentiment !== "good").length > 0 ? ` (${alertItems.filter(a => a.sentiment !== "good").length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── CHAT PANEL ─────────────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="ai-chat-panel">
            {/* Messages */}
            <div className="ai-chat-messages" ref={chatBoxRef}>
              {chat.map((msg, idx) => (
                <div key={idx} className={`ai-msg-row ${msg.sender}`}>
                  {msg.sender === "bot" && <div className="ai-avatar">AI</div>}
                  <div className={`ai-bubble ${msg.sender}`}>
                    {msg.sender === "bot" ? parseMarkdown(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              {loading && <TypingBubble />}
            </div>

            {/* Quick chips */}
            <div className="ai-chips">
              {QUICK_CHIPS[lang].map((chip, i) => (
                <button key={i} className="ai-chip" onClick={() => useChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="ai-input-row">
              <button
                className={`ai-mic-btn ${recording ? "recording" : ""}`}
                onClick={toggleMic}
                title={recording ? "Stop recording" : "Voice input"}
              >
                <MicIcon size={16} />
              </button>

              <textarea
                ref={inputRef}
                className="ai-textarea"
                value={message}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder={lang === "si" ? "නිදීම ගැන අහන්න..." : "Ask about your sleep..."}
                rows={1}
              />

              <button
                className="ai-send-btn"
                onClick={sendMessage}
                disabled={!message.trim() || loading}
              >
                <SendIcon size={15} />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TIPS PANEL ─────────────────────────────────────────────────── */}
        {activeTab === "tips" && (
          <div className="ai-tips-panel">
            {statsLoading ? (
              <div className="ai-empty">Loading your personalized tips...</div>
            ) : tips.length === 0 ? (
              <div className="ai-empty">Start a sleep session to get personalized tips!</div>
            ) : (
              tips.map((tip, i) => <TipCard key={i} tip={tip} />)
            )}
          </div>
        )}

        {/* ── ALERTS PANEL ───────────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="ai-alerts-panel">
            {statsLoading ? (
              <div className="ai-empty">Loading alerts...</div>
            ) : alertItems.length === 0 ? (
              <div className="ai-empty">No alerts yet. Start a sleep session!</div>
            ) : (
              alertItems.map((item, i) => <AlertItem key={i} item={item} />)
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AISleepAssistant;
