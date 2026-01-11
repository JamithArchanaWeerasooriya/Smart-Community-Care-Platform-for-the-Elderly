import './MyReminders.css';
import { useEffect, useMemo, useState, useRef } from 'react';
const BACKEND_API_ENDPOINT = import.meta.env.VITE_BACKEND_API_ENDPOINT;

function MyReminders() {
    // State
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [textSize, setTextSize] = useState('large');
    const [activeTab, setActiveTab] = useState('today'); // today | upcoming | past | all
    const [statusFilter, setStatusFilter] = useState('all'); // all | due | upcoming | completed

    // Form state
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [formState, setFormState] = useState({
        title: '',
        description: '',
        type: 'Medicine',
        time: '',
        date: '',
        frequency: 'none', // none | daily | weekly | monthly
    });
    const listRef = useRef(null);

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
            data.sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));
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

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const StatusBadge = ({ type, label }) => (
        <span className={`status-badge status-${type}`} aria-label={`Status: ${label}`}>
            {label}
        </span>
    );

    const ReminderStatus = ({ r }) => {
        const now = new Date();
        const remindDate = new Date(r.remindAt);
        const isDue = remindDate <= now && !r.completed && !r.notified;
        if (r.completed) return <StatusBadge type="completed" label="Done" />;
        if (isDue) return <StatusBadge type="due" label="Due Now" />;
        if (!r.notified) return <StatusBadge type="upcoming" label="Upcoming" />;
        return null;
    };

    const grouped = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const today = [];
        const upcoming = [];
        const past = [];
        reminders.forEach((r) => {
            const d = new Date(r.remindAt);
            if (d >= startOfToday && d <= endOfToday) {
                today.push(r);
            } else if (d > endOfToday) {
                upcoming.push(r);
            } else {
                past.push(r);
            }
        });
        return { today, upcoming, past };
    }, [reminders]);

    const filteredByStatus = (items) => {
        if (statusFilter === 'all') return items;
        const now = new Date();
        return items.filter((r) => {
            const remindDate = new Date(r.remindAt);
            const isDue = remindDate <= now && !r.completed && !r.notified;
            if (statusFilter === 'due') return isDue;
            if (statusFilter === 'upcoming') return !r.notified && !r.completed && remindDate > now;
            if (statusFilter === 'completed') return !!r.completed;
            return true;
        });
    };

    const sectionData = useMemo(() => {
        if (activeTab === 'today') return filteredByStatus(grouped.today);
        if (activeTab === 'upcoming') return filteredByStatus(grouped.upcoming);
        if (activeTab === 'past') return filteredByStatus(grouped.past);
        return filteredByStatus(reminders);
    }, [activeTab, statusFilter, grouped, reminders]);

    // Handlers
    const resetForm = () => {
        setSelectedReminder(null);
        setFormState({ title: '', description: '', type: 'Medicine', time: '', date: '', frequency: 'none' });
    };

    const onEdit = (r) => {
        setSelectedReminder(r);
        const dt = new Date(r.remindAt);
        const date = dt.toISOString().slice(0, 10);
        const time = dt.toTimeString().slice(0, 5);
        setFormState({
            title: r.title || '',
            description: r.description || '',
            type: r.type || 'Custom',
            time,
            date,
            frequency: r.frequency || 'none',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (r) => {
        const ok = window.confirm('Delete this reminder?');
        if (!ok) return;
        try {
            await fetch(`${BACKEND_API_ENDPOINT}/reminder/${r._id}`, { method: 'DELETE' });
            await loadData();
        } catch (e) {
            setError('Failed to delete reminder.');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const { title, description, type, time, date, frequency } = formState;
        if (!title || !date || !time) {
            setError('Please fill Title, Date and Time.');
            return;
        }
        const remindAt = new Date(`${date}T${time}:00`).toISOString();
        const payload = { title, description, type, remindAt, frequency };
        try {
            const url = selectedReminder ? `${BACKEND_API_ENDPOINT}/reminder/${selectedReminder._id}` : `${BACKEND_API_ENDPOINT}/reminder`;
            const method = selectedReminder ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Save failed');
            resetForm();
            await loadData();
            if (listRef.current) listRef.current.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            setError('Failed to save reminder.');
        }
    };

    return (
        <div className={`my-reminders-page text-${textSize}`}>
            <header className="page-header" aria-labelledby="page-title">
                <div className="page-title-wrap">
                    <h1 id="page-title" className="page-title">Reminders</h1>
                    <p className="page-subtitle">Simple, clear schedule overview</p>
                </div>
                <div className="header-controls">
                    <div className="text-size-group" role="group" aria-label="Text size">
                        <button className={`size-button ${textSize === 'large' ? 'selected' : ''}`} onClick={() => setTextSize('large')} aria-pressed={textSize === 'large'}>A</button>
                        <button className={`size-button ${textSize === 'xlarge' ? 'selected' : ''}`} onClick={() => setTextSize('xlarge')} aria-pressed={textSize === 'xlarge'}>A+</button>
                    </div>
                    <button className="refresh-button" onClick={loadData} disabled={loading} aria-label="Refresh the list of reminders">
                        {loading ? 'Updating…' : 'Check for Updates'}
                    </button>
                </div>
            </header>

            {error && (
                <div className="message-box error" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <main className="main-container">
                <div className="two-col" role="region" aria-label="Create and view reminders">
                    {/* Left: Form */}
                    <section className="card card--form" aria-labelledby="form-title">
                        <h2 id="form-title" className="card__title">{selectedReminder ? 'Edit Reminder' : 'New Reminder'}</h2>
                        <form onSubmit={onSubmit} className="form" noValidate>
                            <label className="form__label" htmlFor="title">Title</label>
                            <input id="title" className="form__input" type="text" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required />

                            <label className="form__label" htmlFor="description">Description</label>
                            <textarea id="description" className="form__textarea" rows={4} value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />

                            <label className="form__label" htmlFor="type">Reminder Type</label>
                            <select id="type" className="form__select" value={formState.type} onChange={(e) => setFormState({ ...formState, type: e.target.value })}>
                                <option>Medicine</option>
                                <option>Appointment</option>
                                <option>Custom</option>
                            </select>

                            <div className="form__row">
                                <div className="form__col">
                                    <label className="form__label" htmlFor="time">Time</label>
                                    <input id="time" className="form__input" type="time" value={formState.time} onChange={(e) => setFormState({ ...formState, time: e.target.value })} required />
                                </div>
                                <div className="form__col">
                                    <label className="form__label" htmlFor="date">Date</label>
                                    <input id="date" className="form__input" type="date" value={formState.date} onChange={(e) => setFormState({ ...formState, date: e.target.value })} required />
                                </div>
                            </div>

                            <label className="form__label" htmlFor="frequency">Frequency</label>
                            <select id="frequency" className="form__select" value={formState.frequency} onChange={(e) => setFormState({ ...formState, frequency: e.target.value })}>
                                <option value="none">One-time</option>
                                <option value="daily">Every day</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>

                            <div className="form__actions">
                                <button type="submit" className="btn btn--primary" aria-label="Save reminder">{selectedReminder ? 'Save Changes' : 'Save Reminder'}</button>
                                {selectedReminder && (
                                    <button type="button" className="btn btn--secondary" onClick={resetForm} aria-label="Cancel editing">Cancel</button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Right: List */}
                    <section className="card card--list" aria-labelledby="list-title" ref={listRef}>
                        <h2 id="list-title" className="card__title">Your Reminders</h2>

                        <div className="toolbar" role="navigation" aria-label="Reminder views">
                            <div className="tabs" role="tablist">
                                {['today','upcoming','past','all'].map((t) => (
                                    <button key={t} role="tab" aria-selected={activeTab === t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                                        {t === 'today' && 'Today'}
                                        {t === 'upcoming' && 'Upcoming'}
                                        {t === 'past' && 'Past'}
                                        {t === 'all' && 'All'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading && (
                            <div className="skeleton-list" aria-live="polite" aria-busy="true">
                                <div className="skeleton-card" />
                                <div className="skeleton-card" />
                                <div className="skeleton-card" />
                            </div>
                        )}

                        {!loading && reminders.length === 0 ? (
                            <div className="message-box empty" role="status">
                                <p>You have no reminders right now.</p>
                                <p className="hint">Tap "Check for Updates" or add new reminders.</p>
                            </div>
                        ) : (
                            <ul className="reminders-list" aria-label="Reminder items">
                                {sectionData.map((r) => (
                                    <li key={r._id} className={`reminder-item ${r.completed ? 'reminder-item--completed' : ''}`}>
                                        <div className="reminder-item__left">
                                            <div className="reminder-item__time">{formatDate(r.remindAt)}</div>
                                            <h3 className="reminder-item__title">{r.title}</h3>
                                            {r.description && <p className="reminder-item__desc">{r.description}</p>}
                                            <div className="reminder-item__meta">
                                                <span className="meta-label">Type:</span> {r.type || '—'}
                                                {r.frequency && <span className="meta-spacer">•</span>}
                                                {r.frequency && (<span className="meta-label">Freq:</span>)} {r.frequency || ''}
                                            </div>
                                        </div>
                                        <div className="reminder-item__right">
                                            <ReminderStatus r={r} />
                                            <div className="item-actions">
                                                <button className="btn btn--secondary" onClick={() => onEdit(r)} aria-label={`Edit ${r.title}`}>Edit</button>
                                                <button className="btn btn--danger" onClick={() => onDelete(r)} aria-label={`Delete ${r.title}`}>Delete</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default MyReminders;