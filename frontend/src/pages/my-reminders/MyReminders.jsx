import './MyReminders.css';
import { useEffect, useMemo, useState } from 'react';
import 'material-icons/iconfont/material-icons.css';
const BACKEND_API_ENDPOINT = import.meta.env.VITE_BACKEND_API_ENDPOINT;

function MyReminders() {
    // State
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('today'); // today | upcoming | past | all
    const [statusFilter] = useState('all'); // all | due | upcoming | completed
    const [now, setNow] = useState(() => new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [formState, setFormState] = useState({
        title: '',
        description: '',
        type: 'Medicine',
        time: '',
        date: '',
        repeat: 'none', // none | daily | weekly | monthly
        repeatTimePeriod: 0,
    });

    const TEN_MINUTES_MS = 1 * 60 * 1000; // 1 minute window
    const HOUR_MS = 60 * 60 * 1000;
    const DAY_MS = 24 * HOUR_MS;
    const WEEK_MS = 7 * DAY_MS;
    const MONTH_MS = 30 * DAY_MS;

    // Update "now" every minute so countdowns stay fresh
    useEffect(() => {
        const id = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(id);
    }, []);

    // Periodically ask backend which reminders are due within the last
    // 1 minute; this also lets the backend auto-advance reminders that
    // are more than 1 minute old (markNotified logic).
    useEffect(() => {
        const pollDue = async () => {
            try {
                await fetch(`${BACKEND_API_ENDPOINT}/reminder/due`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                // After backend updates repeating/expired reminders,
                // refresh full list so UI stays in sync.
                await loadData();
            } catch (e) {
                console.error('Error polling due reminders:', e);
            }
        };

        // Run once on mount, then every 60 seconds
        pollDue();
        const id = setInterval(pollDue, 60000);
        return () => clearInterval(id);
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BACKEND_API_ENDPOINT}/reminder/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const res = await response.json();
            const data = Array.isArray(res.data) ? res.data : [];
            console.log("Fetched reminders:", data);
            data.sort((a, b) => {
                const aDate = new Date(a.next_trigger_at || a.remindAt || 0);
                const bDate = new Date(b.next_trigger_at || b.remindAt || 0);
                return aDate - bDate;
            });
            setReminders(data);
        } catch (error) {
            setError("We couldn't load your reminders. Please try again.");
            console.error('Error loading reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);



    const getNextReminderDate = (r, reference) => {
        if (!r) return null;
        const nowRef = reference || new Date();

        const candidates = [];

        if (r.remindAt) {
            const d = new Date(r.remindAt);
            if (!Number.isNaN(d.getTime()) && d.getTime() > nowRef.getTime()) {
                candidates.push(d);
            }
        }

        if (r.next_trigger_at) {
            const d = new Date(r.next_trigger_at);
            if (!Number.isNaN(d.getTime()) && d.getTime() > nowRef.getTime()) {
                candidates.push(d);
            }
        }

        if (candidates.length > 0) {
            candidates.sort((a, b) => a.getTime() - b.getTime());
            return candidates[0];
        }

        // If everything is in the past, fall back to remindAt or next_trigger_at as-is
        if (r.remindAt) {
            const d = new Date(r.remindAt);
            if (!Number.isNaN(d.getTime())) return d;
        }

        if (r.next_trigger_at) {
            const d = new Date(r.next_trigger_at);
            if (!Number.isNaN(d.getTime())) return d;
        }

        return null;
    };

    const isRepeatingReminder = (r) => {
        if (!r) return false;
        if (r.repeat_time_period && r.repeat_time_period > 0) return true;
        if (r.repeat && r.repeat !== 'none') return true;
        if (r.repeat_type && r.repeat_time_period && r.repeat_time_period > 0) return true;
        return false;
    };

    const getRepeatMeta = (r) => {
        const repeatMs = Number(r?.repeat_time_period || 0);
        const hasInterval = Number.isFinite(repeatMs) && repeatMs > 0;
        if (!hasInterval) {
            return { hasInterval: false, freq: null, every: 0, repeatMs: 0 };
        }

        const explicitType = r.repeat_type;
        if (explicitType === 'weekly') return { hasInterval: true, freq: 'weekly', every: Math.max(1, Math.round(repeatMs / WEEK_MS)), repeatMs };
        if (explicitType === 'daily') return { hasInterval: true, freq: 'daily', every: Math.max(1, Math.round(repeatMs / DAY_MS)), repeatMs };
        if (explicitType === 'monthly') return { hasInterval: true, freq: 'monthly', every: Math.max(1, Math.round(repeatMs / MONTH_MS)), repeatMs };
        if (explicitType === 'hourly') return { hasInterval: true, freq: 'hourly', every: Math.max(1, Math.round(repeatMs / HOUR_MS)), repeatMs };

        if (repeatMs % WEEK_MS === 0) return { hasInterval: true, freq: 'weekly', every: repeatMs / WEEK_MS, repeatMs };
        if (repeatMs % DAY_MS === 0) return { hasInterval: true, freq: 'daily', every: repeatMs / DAY_MS, repeatMs };
        if (repeatMs % HOUR_MS === 0) return { hasInterval: true, freq: 'hourly', every: repeatMs / HOUR_MS, repeatMs };
        return { hasInterval: true, freq: 'custom', every: 1, repeatMs };
    };

    const getRepeatOptionFromReminder = (r) => {
        if (!r) return 'none';
        if (r.repeat && ['daily', 'weekly', 'monthly'].includes(r.repeat)) return r.repeat;
        if (r.frequency && ['daily', 'weekly', 'monthly'].includes(r.frequency)) return r.frequency;

        const meta = getRepeatMeta(r);
        if (!meta.hasInterval) return 'none';
        if (meta.freq === 'daily' && meta.every === 1) return 'daily';
        if (meta.freq === 'weekly' && meta.every === 1) return 'weekly';
        if (meta.freq === 'monthly' && meta.every === 1) return 'monthly';
        return 'none';
    };

    const getRepeatTimePeriodFromOption = (repeat) => {
        if (repeat === 'daily') return DAY_MS;
        if (repeat === 'weekly') return WEEK_MS;
        if (repeat === 'monthly') return MONTH_MS;
        return 0;
    };

    const formatDate = (r, reference) => {
        if (!r) return '';

        const nextDate = getNextReminderDate(r, reference);
        if (!nextDate) return '';

        const label = nextDate.toLocaleString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

        return isRepeatingReminder(r) ? `Next: ${label}` : label;
    };

    const formatFrequencyDetail = (r) => {
        if (!r) return 'One-time reminder';

        const repeatMeta = getRepeatMeta(r);
        let freq = r.repeat || r.frequency || 'none';
        let every = 1;
        let timeLabel = null;

        const nextDate = getNextReminderDate(r);
        if (nextDate) {
            const hours = nextDate.getHours();
            const minutes = nextDate.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = (hours % 12) || 12;
            const paddedMinutes = minutes.toString().padStart(2, '0');
            timeLabel = `${displayHours}:${paddedMinutes} ${period}`;
        }

        if (repeatMeta.hasInterval) {
            freq = repeatMeta.freq;
            every = repeatMeta.every;
        }

        if (!freq || freq === 'none') {
            return timeLabel ? `At ${timeLabel}` : 'One-time reminder';
        }

        // Choose a reference date to derive weekday / day-of-month if available
        const refDateIso = r.remindAt || r.createdAt || null;
        const refDate = refDateIso ? new Date(refDateIso) : null;
        const hasValidRefDate = refDate && !Number.isNaN(refDate.getTime());

        if (freq === 'daily') {
            if (every > 1) return timeLabel ? `Repeats every ${every} days at ${timeLabel}` : `Repeats every ${every} days`;
            return timeLabel ? `Repeats every day at ${timeLabel}` : 'Repeats every day';
        }

        if (freq === 'hourly') {
            if (every > 1) return `Repeats every ${every} hours`;
            return 'Repeats every hour';
        }

        if (freq === 'weekly') {
            if (hasValidRefDate) {
                const weekday = refDate.toLocaleDateString('en-US', { weekday: 'long' });
                if (every > 1) {
                    if (timeLabel) return `Repeats every ${every} weeks on ${weekday} at ${timeLabel}`;
                    return `Repeats every ${every} weeks on ${weekday}`;
                }
                if (timeLabel) return `Repeats every week on ${weekday} at ${timeLabel}`;
                return `Repeats every week on ${weekday}`;
            }
            if (every > 1) return timeLabel ? `Repeats every ${every} weeks at this time` : `Repeats every ${every} weeks`;
            return timeLabel ? 'Repeats every week at this time' : 'Repeats every week';
        }

        if (freq === 'monthly') {
            let day = null;
            if (hasValidRefDate) {
                day = refDate.getDate();
            }
            if (day != null) {
                const suffixes = ['th', 'st', 'nd', 'rd'];
                const v = day % 100;
                const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
                if (every > 1) {
                    if (timeLabel) return `Repeats every ${every} months on the ${day}${suffix} at ${timeLabel}`;
                    return `Repeats every ${every} months on the ${day}${suffix}`;
                }
                if (timeLabel) return `Repeats every month on the ${day}${suffix} at ${timeLabel}`;
                return `Repeats every month on the ${day}${suffix}`;
            }
            if (every > 1) return timeLabel ? `Repeats every ${every} months at this time` : `Repeats every ${every} months`;
            return timeLabel ? 'Repeats every month at this time' : 'Repeats every month';
        }

        if (freq === 'custom' && repeatMeta.repeatMs > 0) {
            const mins = Math.floor(repeatMeta.repeatMs / 60000);
            return `Repeats every ${mins} minutes`;
        }

        // Fallback for any other repeat type
        return timeLabel ? `Repeats at ${timeLabel}` : 'Repeats';
    };

    const formatCountdown = (r, current) => {
        if (!r || !current) return '';
        if (r.completed) return '';

        const hasRepeatPattern = isRepeatingReminder(r);
        if (r.notified && !hasRepeatPattern) return '';

        const target = getNextReminderDate(r, current);
        if (!target) return '';

        const diffMs = target.getTime() - current.getTime();
        if (diffMs <= 0) return 'Now';

        const totalMinutes = Math.ceil(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours <= 0) return `${minutes} min`;
        return `${hours} h ${minutes} min`;
    };

    const StatusBadge = ({ type, label }) => {
        const icons = {
            upcoming: 'event',
            due: 'warning',
            completed: 'check_circle',
            expired: 'error_outline'
        };
        return (
            <span className={`status-badge status-${type}`} aria-label={`Status: ${label}`}>
                {icons[type] && <span className="material-icons status-icon">{icons[type]}</span>}
                {label}
            </span>
        );
    };

    const isReminderDueWithinWindow = (r, now) => {
        if (!r || !now) return false;
        const checkWithinWindow = (value) => {
            if (!value) return false;
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return false;
            const diff = now.getTime() - d.getTime();
            return diff >= 0 && diff <= TEN_MINUTES_MS;
        };

        const dueByRemindAt = checkWithinWindow(r.remindAt);
        const dueByNext = checkWithinWindow(r.next_trigger_at);

        return (dueByRemindAt || dueByNext) && !r.completed;
    };

    const filteredByStatus = useMemo(() => {
        return (items) => {
            if (statusFilter === 'all') return items;
            const nowRef = new Date();
            return items.filter((r) => {
                const baseDateStr = r.next_trigger_at || r.remindAt;
                const hasFixedTime = !!baseDateStr;
                const remindDate = hasFixedTime ? new Date(baseDateStr) : null;
                const isRepeating = isRepeatingReminder(r);
                const isCompleted = !!r.completed;
                const isDue = isReminderDueWithinWindow(r, nowRef);
                const isUpcomingFixed = hasFixedTime && !Number.isNaN(remindDate.getTime()) && remindDate > nowRef && !isCompleted && (!r.notified || isRepeating);
                const isActiveRepeating = isRepeating && !isCompleted;

                if (statusFilter === 'completed') return isCompleted;
                if (statusFilter === 'due') return isDue;
                if (statusFilter === 'upcoming') return isUpcomingFixed || isActiveRepeating;
                return true;
            });
        };
    }, [statusFilter]);

    const ReminderStatus = ({ r }) => {
        const isDue = isReminderDueWithinWindow(r, now);
        const repeating = isRepeatingReminder(r);

        if (r.completed) return <StatusBadge type="completed" label="Done" />;

        if (repeating) {
            if (isDue) return <StatusBadge type="due" label="Due Now" />;
            return <StatusBadge type="upcoming" label="Upcoming" />;
        }

        // Expired: one-time reminders that have been notified and are outside the 10 minute window
        let isExpired = false;
        if (!r.completed && r.notified && r.remindAt) {
            const remindDate = new Date(r.remindAt);
            if (!Number.isNaN(remindDate.getTime())) {
                const diff = now.getTime() - remindDate.getTime();
                if (diff > TEN_MINUTES_MS) {
                    isExpired = true;
                }
            }
        }

        if (isExpired) return <StatusBadge type="expired" label="Expired" />;
        if (isDue) return <StatusBadge type="due" label="Due Now" />;
        if (!r.notified) return <StatusBadge type="upcoming" label="Upcoming" />;
        return null;
    };

    const grouped = useMemo(() => {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const today = [];
        const upcoming = [];
        const past = [];
        reminders.forEach((r) => {
            const baseDateStr = r.next_trigger_at || r.remindAt;
            if (baseDateStr) {
                const d = new Date(baseDateStr);
                if (!Number.isNaN(d.getTime())) {
                    if (d >= startOfToday && d <= endOfToday) {
                        today.push(r);
                    } else if (d > endOfToday) {
                        upcoming.push(r);
                    } else {
                        past.push(r);
                    }
                    return;
                }
            }

            // Fallback classification
            if (isRepeatingReminder(r)) {
                upcoming.push(r);
            } else {
                past.push(r);
            }
        });
        return { today, upcoming, past };
    }, [reminders, now]);

    const sectionData = useMemo(() => {
        if (activeTab === 'today') return filteredByStatus(grouped.today);
        if (activeTab === 'upcoming') return filteredByStatus(grouped.upcoming);
        if (activeTab === 'past') return filteredByStatus(grouped.past);
        return filteredByStatus(reminders);
    }, [activeTab, grouped, reminders, filteredByStatus]);

    // Handlers
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedReminder(null);
        setFormState({ title: '', description: '', type: 'Medicine', time: '', date: '', repeat: 'none', repeatTimePeriod: 0 });
    };

    const onEdit = (r) => {
        setSelectedReminder(r);
        const dt = new Date(r.remindAt || r.next_trigger_at || new Date().toISOString());
        const date = !Number.isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : '';
        const time = !Number.isNaN(dt.getTime()) ? dt.toTimeString().slice(0, 5) : '';
        setFormState({
            title: r.title || '',
            description: r.description || '',
            type: r.type || 'Custom',
            time,
            date,
            // Prefer backend `repeat`, but support older `frequency` field if present
            repeat: getRepeatOptionFromReminder(r),
            repeatTimePeriod: Number(r.repeat_time_period || 0),
        });
        openModal();
    };

    const onDelete = async (r) => {
        const ok = window.confirm('Delete this reminder?');
        if (!ok) return;
        try {
            await fetch(`${BACKEND_API_ENDPOINT}/reminder/${r._id}`, { method: 'DELETE' });
            await loadData();
        } catch {
            setError('Failed to delete reminder.');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const { title, description, type, time, date, repeat, repeatTimePeriod } = formState;
        if (!title || !date || !time) {
            setError('Please fill Title, Date and Time.');
            return;
        }
        const remindAt = new Date(`${date}T${time}:00`).toISOString();
        const derivedPeriod = getRepeatTimePeriodFromOption(repeat);
        const effectiveRepeatTimePeriod = derivedPeriod > 0 ? derivedPeriod : Number(repeatTimePeriod || 0);
        const payload = { title, description, type, remindAt, repeat, repeat_time_period: effectiveRepeatTimePeriod };
        try {
            const url = selectedReminder ? `${BACKEND_API_ENDPOINT}/reminder/${selectedReminder._id}` : `${BACKEND_API_ENDPOINT}/reminder`;
            const method = selectedReminder ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Save failed');
            closeModal();
            await loadData();
        } catch {
            setError('Failed to save reminder.');
        }
    };

    // Determine greeting
    const currentHour = now.getHours();
    let greeting = 'Good evening';
    if (currentHour < 12) greeting = 'Good morning';
    else if (currentHour < 18) greeting = 'Good afternoon';

    const headerDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="my-reminders-app">

            <div className="app-content">
                <header className="app-header">
                    <div className="header-text">
                        <p className="greeting-date">{headerDate}</p>
                        <h1 className="greeting-title">{greeting}!</h1>
                        <p className="greeting-subtitle">Here is your schedule for {activeTab}.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-icon" onClick={loadData} disabled={loading} aria-label="Refresh">
                            <span className="material-icons">{loading ? 'sync' : 'refresh'}</span>
                        </button>
                        <button className="btn-primary" onClick={openModal}>
                            <span className="material-icons">add</span>
                            New Reminder
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="alert-glass error-alert">
                        <span className="material-icons">error_outline</span>
                        <p>{error}</p>
                    </div>
                )}

                <main className="main-board">
                    <div className="segmented-control">
                        {['today', 'upcoming', 'past', 'all'].map((t) => {
                            const labels = { today: 'Today', upcoming: 'Upcoming', past: 'Past', all: 'All' };
                            return (
                                <button
                                    key={t}
                                    className={`segment-btn ${activeTab === t ? 'active' : ''}`}
                                    onClick={() => setActiveTab(t)}
                                >
                                    {labels[t]}
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="cards-grid skeleton-grid">
                            <div className="skeleton-card"></div>
                            <div className="skeleton-card"></div>
                            <div className="skeleton-card"></div>
                        </div>
                    ) : reminders.length === 0 ? (
                        <div className="empty-state-glass">
                            <div className="empty-icon-wrap">
                                <span className="material-icons">event_available</span>
                            </div>
                            <h3>All Caught Up</h3>
                            <p>You have no reminders to display right now.</p>
                            <button className="btn-secondary mt-4" onClick={openModal}>Get Started</button>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            {sectionData.map((r, i) => {
                                // Assigning a border color class based on type
                                const typeClass = (r.type || 'Custom').toLowerCase();
                                const staggerDelay = `${0.1 + (i * 0.05)}s`;
                                return (
                                    <div
                                        key={r._id}
                                        className={`reminder-card type-${typeClass} ${r.completed ? 'is-completed' : ''}`}
                                        style={{ animationDelay: staggerDelay }}
                                    >
                                        <div className="card-top">
                                            <div className="card-time">
                                                <span className="material-icons schedule-icon">schedule</span>
                                                {formatDate(r, now)}
                                            </div>
                                            <ReminderStatus r={r} />
                                        </div>

                                        <div className="card-body">
                                            <h3 className="card-title">{r.title}</h3>
                                            {r.description && <p className="card-desc">{r.description}</p>}
                                        </div>

                                        <div className="card-tags">
                                            <span className="tag type-tag">
                                                <span className="material-icons">local_pharmacy</span>
                                                {r.type || 'Custom'}
                                            </span>
                                            <span className="tag freq-tag">
                                                <span className="material-icons">autorenew</span>
                                                {formatFrequencyDetail(r)}
                                            </span>
                                            {formatCountdown(r, now) && (
                                                <span className="tag countdown-tag">
                                                    <span className="material-icons">hourglass_empty</span>
                                                    {formatCountdown(r, now)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="card-actions-hover">
                                            <button className="icon-action-btn edit-btn" onClick={() => onEdit(r)} title="Edit">
                                                <span className="material-icons">edit</span>
                                            </button>
                                            <button className="icon-action-btn delete-btn" onClick={() => onDelete(r)} title="Delete">
                                                <span className="material-icons">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* Mobile Floating Action Button */}
                <button className="mobile-fab" onClick={openModal} aria-label="Add Reminder">
                    <span className="material-icons">add</span>
                </button>
            </div>

            {/* Glassmorphic Modal overlay */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                            <span className="material-icons">close</span>
                        </button>
                        <h2 className="modal-title">{selectedReminder ? 'Edit Reminder' : 'Create Reminder'}</h2>

                        <form onSubmit={onSubmit} className="modern-form" noValidate>
                            <div className="input-group">
                                <label htmlFor="title">Title</label>
                                <input id="title" type="text" placeholder="e.g. Take Blood Pressure Meds" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required />
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="date">Date</label>
                                    <input id="date" type="date" value={formState.date} onChange={(e) => setFormState({ ...formState, date: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="time">Time</label>
                                    <input id="time" type="time" value={formState.time} onChange={(e) => setFormState({ ...formState, time: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="type">Category</label>
                                    <select id="type" value={formState.type} onChange={(e) => setFormState({ ...formState, type: e.target.value })}>
                                        <option>Medicine</option>
                                        <option>Appointment</option>
                                        <option>Custom</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="repeat">Frequency</label>
                                    <select
                                        id="repeat"
                                        value={formState.repeat}
                                        onChange={(e) => {
                                            const nextRepeat = e.target.value;
                                            setFormState({
                                                ...formState,
                                                repeat: nextRepeat,
                                                repeatTimePeriod: getRepeatTimePeriodFromOption(nextRepeat),
                                            });
                                        }}
                                    >
                                        <option value="none">One-time</option>
                                        <option value="daily">Every day</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="description">Notes / Instructions (Optional)</label>
                                <textarea id="description" rows={3} placeholder="e.g. Take after eating" value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-text" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {selectedReminder ? 'Save Changes' : 'Create Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyReminders;