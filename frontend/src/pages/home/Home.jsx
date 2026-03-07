import './Home.css';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'material-icons/iconfont/material-icons.css';

const BACKEND_API_ENDPOINT = import.meta.env.VITE_BACKEND_API_ENDPOINT;

const WELLNESS_TIPS = [
    "Drink water regularly throughout the day.",
    "Take a short walk in the morning sunlight.",
    "Do gentle stretching after waking up.",
    "Call a family member or a friend today.",
    "Keep your medicine box organized weekly.",
    "Spend 15 minutes reading or listening to music.",
    "Practice deep breathing before bed.",
    "Eat fruits and vegetables with each meal.",
    "Check blood pressure at the same time daily.",
    "Maintain a regular sleep routine.",
    "Write down one happy moment from today.",
    "Keep emergency contacts easy to reach.",
];

const DAILY_CHECKLIST_ITEMS = [
    { id: "water", icon: "water_drop", label: "Drink 8 glasses of water" },
    { id: "medicine", icon: "medication", label: "Take morning medicine" },
    { id: "walk", icon: "directions_walk", label: "Go for a short walk" },
    { id: "meals", icon: "restaurant", label: "Eat 3 balanced meals" },
    { id: "bp", icon: "monitor_heart", label: "Check blood pressure" },
    { id: "connect", icon: "call", label: "Talk to a loved one" },
];

const MOOD_OPTIONS = [
    { emoji: "😊", label: "Happy", value: "happy" },
    { emoji: "😌", label: "Calm", value: "calm" },
    { emoji: "😐", label: "Okay", value: "okay" },
    { emoji: "😔", label: "Sad", value: "sad" },
    { emoji: "😟", label: "Worried", value: "worried" },
];

const SAFETY_TIPS = [
    { icon: "lightbulb", title: "Good Lighting", desc: "Keep hallways and stairs well-lit to prevent falls, especially at night." },
    { icon: "shower", title: "Bathroom Safety", desc: "Use non-slip mats and grab bars in the bathroom for extra support." },
    { icon: "local_pharmacy", title: "Medicine Storage", desc: "Store medicines in a cool, dry place and check expiry dates weekly." },
    { icon: "phone_in_talk", title: "Emergency Contacts", desc: "Keep emergency numbers by your phone and on the fridge." },
    { icon: "lock", title: "Door Safety", desc: "Always lock doors at night and check before opening for strangers." },
    { icon: "fireplace", title: "Fire Safety", desc: "Never leave the kitchen unattended while cooking. Turn off stoves promptly." },
];

const VOICE_COMMANDS = [
    { label: "පිටු වෙත යන්න", desc: "Navigate pages", icon: "explore", example: "මට මුල් පිටුවට යන්න ඕනෑ" },
    { label: "පිටුව අනුචලනය", desc: "Scroll page", icon: "swap_vert", example: "පහලට යන්න" },
    { label: "නවත්වන්න", desc: "Stop / Cancel", icon: "stop_circle", example: "නවත්වන්න" },
];

const FEATURE_ITEMS = [
    {
        route: '/my-reminders',
        cardClass: 'card-reminders',
        icon: 'medication',
        eyebrow: 'Daily Support',
        title: 'My Reminders',
        description: 'Manage medicine, appointment, and custom reminders so you never miss a thing.',
        cta: 'Open reminders',
    },
    {
        route: '/emotion-monitor',
        cardClass: 'card-emotion',
        icon: 'mood',
        eyebrow: 'Well-being',
        title: 'Emotion Monitor',
        description: 'Track how you feel each day and spot patterns to support your well-being.',
        cta: 'Open emotion monitor',
    },
    {
        route: '/sleep-monitor',
        cardClass: 'card-sleep',
        icon: 'bedtime',
        eyebrow: 'Rest & Recovery',
        title: 'Sleep Monitor',
        description: 'Review your sleep habits and get tips for a better night\'s rest.',
        cta: 'Open sleep monitor',
    },
];

const TYPE_ICON_MAP = {
    Medicine: "medication",
    Appointment: "calendar_month",
    Custom: "task_alt",
};

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

function formatDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function Home() {
    const navigate = useNavigate();
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * WELLNESS_TIPS.length));
    const [todayReminders, setTodayReminders] = useState([]);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [checkedItems, setCheckedItems] = useState(() => {
        const saved = localStorage.getItem('daily-checklist-date');
        const today = new Date().toDateString();
        if (saved === today) {
            try { return JSON.parse(localStorage.getItem('daily-checklist') || '{}'); } catch { return {}; }
        }
        return {};
    });
    const [selectedMood, setSelectedMood] = useState(() => {
        const saved = localStorage.getItem('mood-date');
        const today = new Date().toDateString();
        return saved === today ? localStorage.getItem('mood-value') : null;
    });

    const shuffleTip = useCallback(() => {
        setTipIndex((prev) => {
            let next;
            do {
                next = Math.floor(Math.random() * WELLNESS_TIPS.length);
            } while (next === prev && WELLNESS_TIPS.length > 1);
            return next;
        });
    }, []);

    const toggleCheckItem = useCallback((id) => {
        setCheckedItems((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem('daily-checklist', JSON.stringify(next));
            localStorage.setItem('daily-checklist-date', new Date().toDateString());
            return next;
        });
    }, []);

    const handleMoodSelect = useCallback((value) => {
        setSelectedMood(value);
        localStorage.setItem('mood-value', value);
        localStorage.setItem('mood-date', new Date().toDateString());
    }, []);

    const checkedCount = DAILY_CHECKLIST_ITEMS.filter((item) => checkedItems[item.id]).length;
    const checklistPercent = Math.round((checkedCount / DAILY_CHECKLIST_ITEMS.length) * 100);
    const selectedMoodLabel = MOOD_OPTIONS.find((mood) => mood.value === selectedMood)?.label;
    const nextReminder = todayReminders[0] || null;

    useEffect(() => {
        let cancelled = false;
        async function loadTodayReminders() {
            try {
                const res = await fetch(`${BACKEND_API_ENDPOINT}/reminder/list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) throw new Error('Failed');
                const json = await res.json();
                const data = Array.isArray(json.data) ? json.data : [];

                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

                const today = data
                    .filter((r) => {
                        const t = new Date(r.next_trigger_at || r.remindAt);
                        return t >= startOfDay && t < endOfDay;
                    })
                    .sort((a, b) => {
                        const aT = new Date(a.next_trigger_at || a.remindAt);
                        const bT = new Date(b.next_trigger_at || b.remindAt);
                        return aT - bT;
                    })
                    .slice(0, 5);

                if (!cancelled) setTodayReminders(today);
            } catch {
                // silently fail on home – reminders are optional preview
            } finally {
                if (!cancelled) setLoadingReminders(false);
            }
        }
        loadTodayReminders();

        const handler = () => loadTodayReminders();
        window.addEventListener('reminders:updated', handler);
        return () => {
            cancelled = true;
            window.removeEventListener('reminders:updated', handler);
        };
    }, []);

    return (
        <div className="home-page">
            <div className="home-content">

                {/* ── Hero ─────────────────────────────────── */}
                <section className="home-hero">
                    <div className="hero-main">
                        <div className="hero-copy">
                            <p className="hero-date">{formatDate()}</p>
                            <h1 className="hero-title">{getGreeting()} 👋</h1>
                            <p className="hero-subtitle">
                                Stay active, stay connected, and stay safe. Your daily care dashboard is ready with the most important updates for today.
                            </p>
                            <div className="hero-actions">
                                <button className="hero-action primary" type="button" onClick={() => navigate('/my-reminders')}>
                                    <span className="material-icons">calendar_month</span>
                                    Review today&apos;s reminders
                                </button>
                                <button className="hero-action secondary" type="button" onClick={() => navigate('/emotion-monitor')}>
                                    <span className="material-icons">favorite</span>
                                    Log your mood
                                </button>
                            </div>
                        </div>

                        <aside className="hero-highlight" aria-label="Today summary">
                            <p className="hero-highlight-label">What&apos;s next</p>
                            {nextReminder ? (
                                <>
                                    <h2 className="hero-highlight-title">{nextReminder.title}</h2>
                                    <p className="hero-highlight-meta">
                                        {formatTime(nextReminder.next_trigger_at || nextReminder.remindAt)}
                                        {' '}
                                        •
                                        {' '}
                                        {nextReminder.type || 'Custom'} reminder
                                    </p>
                                    {nextReminder.description && (
                                        <p className="hero-highlight-desc">{nextReminder.description}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h2 className="hero-highlight-title">No urgent reminders</h2>
                                    <p className="hero-highlight-desc">
                                        Your schedule looks clear right now. Use the time for rest, movement, or a quick check-in.
                                    </p>
                                </>
                            )}
                        </aside>
                    </div>

                    <div className="hero-stats" aria-label="Daily overview">
                        <div className="hero-stat-card">
                            <span className="material-icons hero-stat-icon">today</span>
                            <div>
                                <p className="hero-stat-label">Today&apos;s reminders</p>
                                <p className="hero-stat-value">{todayReminders.length}</p>
                            </div>
                        </div>
                        <div className="hero-stat-card">
                            <span className="material-icons hero-stat-icon">task_alt</span>
                            <div>
                                <p className="hero-stat-label">Checklist progress</p>
                                <p className="hero-stat-value">{checklistPercent}% complete</p>
                            </div>
                        </div>
                        <div className="hero-stat-card">
                            <span className="material-icons hero-stat-icon">sentiment_satisfied</span>
                            <div>
                                <p className="hero-stat-label">Mood status</p>
                                <p className="hero-stat-value">{selectedMoodLabel || 'Not logged yet'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Quick Access Features ────────────────── */}
                <section className="feature-grid">
                    {FEATURE_ITEMS.map((item) => (
                        <button
                            key={item.route}
                            type="button"
                            className={`feature-card ${item.cardClass}`}
                            onClick={() => navigate(item.route)}
                        >
                            <div className="feature-card-topline">
                                <div className="feature-card-icon">
                                    <span className="material-icons">{item.icon}</span>
                                </div>
                                <span className="feature-card-eyebrow">{item.eyebrow}</span>
                            </div>
                            <h2 className="feature-card-title">{item.title}</h2>
                            <p className="feature-card-desc">{item.description}</p>
                            <span className="feature-card-arrow">
                                {item.cta} <span className="material-icons" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
                            </span>
                        </button>
                    ))}
                </section>

                {/* ── Wellness Tip ─────────────────────────── */}
                <section className="home-panel home-panel-wide">
                    <div className="wellness-banner">
                        <div className="wellness-icon">
                            <span className="material-icons">tips_and_updates</span>
                        </div>
                        <div className="wellness-text">
                            <p className="wellness-label">Daily Wellness Tip</p>
                            <p className="wellness-tip">{WELLNESS_TIPS[tipIndex]}</p>
                        </div>
                        <button
                            className="wellness-refresh"
                            onClick={shuffleTip}
                            aria-label="Show another tip"
                            title="Show another tip"
                        >
                            <span className="material-icons">refresh</span>
                        </button>
                    </div>
                </section>

                {/* ── How Are You Feeling? ─────────────────── */}
                <section className="home-panel mood-section">
                    <div className="section-header">
                        <div className="section-icon amber">
                            <span className="material-icons">sentiment_satisfied</span>
                        </div>
                        <h2 className="section-title">How Are You Feeling Today?</h2>
                    </div>
                    <div className="mood-picker">
                        {MOOD_OPTIONS.map((mood) => (
                            <button
                                key={mood.value}
                                className={`mood-btn ${selectedMood === mood.value ? 'active' : ''}`}
                                onClick={() => handleMoodSelect(mood.value)}
                                aria-label={mood.label}
                            >
                                <span className="mood-emoji">{mood.emoji}</span>
                                <span className="mood-label">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                    {selectedMood && (
                        <div className="mood-feedback">
                            <span className="material-icons">check_circle</span>
                            <p>Mood logged! <button className="link-view-all" onClick={() => navigate('/emotion-monitor')}>View Emotion Monitor <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span></button></p>
                        </div>
                    )}
                </section>

                {/* ── Daily Checklist ──────────────────────── */}
                <section className="home-panel checklist-section">
                    <div className="section-header">
                        <div className="section-icon green">
                            <span className="material-icons">task_alt</span>
                        </div>
                        <h2 className="section-title">Daily Wellness Checklist</h2>
                        <span className="checklist-counter">{checkedCount}/{DAILY_CHECKLIST_ITEMS.length}</span>
                    </div>
                    <div className="checklist-progress-bar">
                        <div
                            className="checklist-progress-fill"
                            style={{ width: `${(checkedCount / DAILY_CHECKLIST_ITEMS.length) * 100}%` }}
                        />
                    </div>
                    <div className="checklist-grid">
                        {DAILY_CHECKLIST_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                className={`checklist-item ${checkedItems[item.id] ? 'checked' : ''}`}
                                onClick={() => toggleCheckItem(item.id)}
                            >
                                <span className="material-icons checklist-item-icon">
                                    {checkedItems[item.id] ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                <span className="material-icons checklist-item-type">{item.icon}</span>
                                <span className="checklist-item-label">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Today's Reminders Preview ────────────── */}
                <section className="home-panel reminders-section">
                    <div className="section-header">
                        <div className="section-icon green">
                            <span className="material-icons">today</span>
                        </div>
                        <h2 className="section-title">Today&apos;s Reminders</h2>
                    </div>

                    {loadingReminders ? (
                        <div className="reminder-preview-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="reminder-preview-item">
                                    <div className="skeleton-line" style={{ width: 44, height: 44, borderRadius: 12 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton-line" style={{ width: '60%', marginBottom: 8 }} />
                                        <div className="skeleton-line" style={{ width: '40%', height: 14 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : todayReminders.length > 0 ? (
                        <>
                            <div className="reminder-preview-list">
                                {todayReminders.map((r, i) => {
                                    const typeLower = (r.type || 'custom').toLowerCase();
                                    const icon = TYPE_ICON_MAP[r.type] || 'task_alt';
                                    return (
                                        <div
                                            className="reminder-preview-item"
                                            key={r._id || i}
                                            style={{ animationDelay: `${i * 0.06}s` }}
                                        >
                                            <div className={`reminder-preview-icon ${typeLower}`}>
                                                <span className="material-icons">{icon}</span>
                                            </div>
                                            <div className="reminder-preview-info">
                                                <p className="reminder-preview-title">{r.title}</p>
                                                {r.description && (
                                                    <p className="reminder-preview-desc">{r.description}</p>
                                                )}
                                            </div>
                                            <span className="reminder-preview-time">
                                                {formatTime(r.next_trigger_at || r.remindAt)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button className="link-view-all" onClick={() => navigate('/my-reminders')}>
                                View all reminders
                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
                            </button>
                        </>
                    ) : (
                        <div className="reminder-preview-empty">
                            <span className="material-icons">event_available</span>
                            <p>No reminders for today — enjoy your free time!</p>
                        </div>
                    )}
                </section>

                {/* ── Voice Commands ───────────────────────── */}
                <section className="home-panel voice-section">
                    <div className="section-header">
                        <div className="section-icon indigo">
                            <span className="material-icons">mic</span>
                        </div>
                        <h2 className="section-title">හඬ විධාන / Voice Commands</h2>
                    </div>
                    <div className="voice-commands-grid">
                        {VOICE_COMMANDS.map((cmd, i) => (
                            <div className="voice-cmd" key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                                <div className="voice-cmd-icon">
                                    <span className="material-icons">{cmd.icon}</span>
                                </div>
                                <div className="voice-cmd-text">
                                    <p className="voice-cmd-label">{cmd.label}</p>
                                    <p className="voice-cmd-desc">{cmd.desc}</p>
                                    <p className="voice-cmd-example">&ldquo;{cmd.example}&rdquo;</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Safety Tips ──────────────────────────── */}
                <section className="home-panel safety-section">
                    <div className="section-header">
                        <div className="section-icon amber">
                            <span className="material-icons">shield</span>
                        </div>
                        <h2 className="section-title">Home Safety Tips</h2>
                    </div>
                    <div className="safety-grid">
                        {SAFETY_TIPS.map((tip, i) => (
                            <div className="safety-card" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="safety-card-icon">
                                    <span className="material-icons">{tip.icon}</span>
                                </div>
                                <div className="safety-card-text">
                                    <h3 className="safety-card-title">{tip.title}</h3>
                                    <p className="safety-card-desc">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Emergency Contact ────────────────────── */}
                <section className="emergency-card">
                    <div className="emergency-icon">
                        <span className="material-icons">emergency</span>
                    </div>
                    <div className="emergency-text">
                        <h2 className="emergency-title">Emergency Assistance</h2>
                        <p className="emergency-desc">
                            If you need urgent help, press the button to quickly reach emergency services.
                        </p>
                    </div>
                    <a href="tel:1990" className="emergency-btn">
                        <span className="material-icons">call</span>
                        Call 1990
                    </a>
                </section>

            </div>
        </div>
    );
}

export default Home;