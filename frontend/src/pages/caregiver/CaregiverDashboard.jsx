import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'material-icons/iconfont/material-icons.css';
import './CaregiverDashboard.css';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area,
} from 'recharts';

// ── Config ────────────────────────────────────────────────────────
const API = (import.meta.env.VITE_CAREGIVER_API || 'http://localhost:3001/api') + '/caregiver';

const EMOTION_META = {
  happy:    { color: '#0f9f74', bg: '#e8fbf4', textColor: '#0e5f4a', icon: 'sentiment_very_satisfied',   label: 'Happy' },
  neutral:  { color: '#176b87', bg: '#dff0f7', textColor: '#134e63', icon: 'sentiment_neutral',           label: 'Neutral' },
  sad:      { color: '#5a6b9f', bg: '#eceeff', textColor: '#3a4580', icon: 'sentiment_dissatisfied',      label: 'Sad' },
  angry:    { color: '#df5a6a', bg: '#fff0f2', textColor: '#b42943', icon: 'sentiment_very_dissatisfied', label: 'Angry' },
  fear:     { color: '#9b5de5', bg: '#f3ecff', textColor: '#6b2db5', icon: 'visibility_off',              label: 'Fear' },
  disgust:  { color: '#6a8f3c', bg: '#eef7e0', textColor: '#3d5c17', icon: 'sick',                        label: 'Disgust' },
  surprise: { color: '#f28c28', bg: '#fff1df', textColor: '#8e4d0d', icon: 'celebration',                 label: 'Surprise' },
};

const NAV = [
  { key: 'overview',  label: 'Overview',        icon: 'dashboard' },
  { key: 'patients',  label: 'Patients',         icon: 'people' },
  { key: 'sessions',  label: 'Sessions',         icon: 'history' },
  { key: 'alerts',    label: 'Alerts',           icon: 'notifications_active' },
  { key: 'readings',  label: 'Emotion Log',      icon: 'psychology' },
  { key: 'analytics', label: 'Analytics',        icon: 'bar_chart' },
  { key: 'notes',     label: 'Caregiver Notes',  icon: 'edit_note' },
  { key: 'settings',  label: 'Settings',         icon: 'settings' },
];

// ── Helpers ────────────────────────────────────────────────────────
function formatDt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDur(start, end) {
  if (!start) return '—';
  const ms = (end ? new Date(end) : new Date()) - new Date(start);
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
}

function EmotionPill({ emotion }) {
  const m = EMOTION_META[emotion] || { color: '#94a3b8', bg: '#f1f5f9', textColor: '#475569', icon: 'help', label: emotion };
  return (
    <span className="cg-emotion-pill" style={{ background: m.bg, color: m.textColor }}>
      <span className="material-icons" style={{ fontSize: '0.85rem' }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div className="cg-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`cg-toast ${t.type}`}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>
            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function WellnessRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = score != null ? (score / 100) * circ : 0;
  const color = score >= 70 ? '#0f9f74' : score >= 40 ? '#f28c28' : '#df5a6a';
  return (
    <div className="cg-wellness-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="cg-wellness-score" style={{ color }}>{score != null ? `${score}%` : '—'}</div>
    </div>
  );
}

// ── API helpers ────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

//  MAIN COMPONENT
export default function CaregiverDashboard() {
  const [page,   setPage]   = useState('overview');
  const [toasts, setToasts] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // --- Toast helper ---
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // Poll unread alert count
  useEffect(() => {
    const load = async () => {
      try {
        const d = await apiFetch('/alerts?resolved=false&limit=1');
        if (d.success) setUnreadAlerts(d.total);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const topbarTitles = {
    overview:  { title: 'Overview',         sub: 'Emotion care monitoring at a glance' },
    patients:  { title: 'Patients',          sub: 'Manage patient profiles' },
    sessions:  { title: 'Sessions',          sub: 'Emotion monitoring session history' },
    alerts:    { title: 'Alerts',            sub: 'Distress signals & notifications' },
    readings:  { title: 'Emotion Log',       sub: 'All emotion readings from all patients' },
    analytics: { title: 'Analytics',         sub: 'In-depth emotion trends & wellness scores' },
    notes:     { title: 'Caregiver Notes',   sub: 'Observations and care notes' },
    settings:  { title: 'Settings',          sub: 'Configure dashboard & patients' },
  };

  const tt = topbarTitles[page];

  const navigate = useNavigate();

  return (
    <div className="cg-app">

      {/* ── Site Header Bar ── */}
      <div className="cg-site-header">
        <button className="cg-site-header-back" onClick={() => navigate('/')}>
          <span className="material-icons">arrow_back_ios</span>
          Back to App
        </button>
        <div className="cg-site-header-brand">
          <div className="cg-site-header-icon">
            <span className="material-icons">favorite</span>
          </div>
          <span className="cg-site-header-name">CareVision</span>
          <span className="cg-site-header-sep">·</span>
          <span className="cg-site-header-section">Caregiver Portal</span>
        </div>
        <div className="cg-site-header-nav">
          {[
            { id: '',                label: 'Home',            icon: 'home' },
            { id: 'my-reminders',    label: 'Reminders',       icon: 'medication' },
            { id: 'emotion-monitor', label: 'Emotion Monitor', icon: 'psychology' },
            { id: 'sleep-monitor',   label: 'Sleep',           icon: 'bedtime' },
            { id: 'fall-detection',  label: 'Fall Detection',  icon: 'personal_injury' },
          ].map(item => (
            <button
              key={item.id}
              className="cg-site-header-link"
              onClick={() => navigate('/' + item.id)}
            >
              <span className="material-icons">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cg-layout">

        {/* ── Sidebar ── */}
        <aside className="cg-sidebar">
          <div className="cg-sidebar-logo">
            <div className="cg-sidebar-logo-mark">
              <div className="cg-sidebar-logo-icon">
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>favorite</span>
              </div>
              <div>
                <div className="cg-sidebar-logo-name">CareVision</div>
                <div className="cg-sidebar-logo-sub">Caregiver Portal</div>
              </div>
            </div>
          </div>

          <div className="cg-sidebar-section">
            <div className="cg-sidebar-section-label">Main</div>
            {NAV.slice(0, 4).map(n => (
              <button key={n.key} className={`cg-nav-item ${page === n.key ? 'active' : ''}`}
                onClick={() => setPage(n.key)}>
                <span className="material-icons cg-nav-icon">{n.icon}</span>
                {n.label}
                {n.key === 'alerts' && unreadAlerts > 0 && (
                  <span className="cg-nav-badge">{unreadAlerts}</span>
                )}
              </button>
            ))}
          </div>

          <div className="cg-sidebar-section">
            <div className="cg-sidebar-section-label">Data</div>
            {NAV.slice(4).map(n => (
              <button key={n.key} className={`cg-nav-item ${page === n.key ? 'active' : ''}`}
                onClick={() => setPage(n.key)}>
                <span className="material-icons cg-nav-icon">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>

          <div className="cg-sidebar-footer">
            <div className="cg-sidebar-user">
              <div className="cg-sidebar-avatar">C</div>
              <div>
                <div className="cg-sidebar-user-name">Caregiver</div>
                <div className="cg-sidebar-user-role">Senior Care Staff</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="cg-main">
          <div className="cg-topbar">
            <div>
              <div className="cg-topbar-title">{tt.title}</div>
              <div className="cg-topbar-sub">{tt.sub}</div>
            </div>
            <div className="cg-topbar-right">
              <button className="cg-icon-btn" title="Refresh" onClick={() => setPage(p => p)}>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>refresh</span>
              </button>
              <button className="cg-icon-btn" onClick={() => setPage('alerts')}>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>notifications</span>
                {unreadAlerts > 0 && <span className="cg-badge">{unreadAlerts}</span>}
              </button>
            </div>
          </div>

          <div className="cg-page-content">
            {page === 'overview'  && <PageOverview  toast={toast} setPage={setPage} />}
            {page === 'patients'  && <PagePatients  toast={toast} />}
            {page === 'sessions'  && <PageSessions  toast={toast} />}
            {page === 'alerts'    && <PageAlerts    toast={toast} onResolved={() => setUnreadAlerts(p => Math.max(0, p-1))} />}
            {page === 'readings'  && <PageReadings  toast={toast} />}
            {page === 'analytics' && <PageAnalytics toast={toast} />}
            {page === 'notes'     && <PageNotes     toast={toast} />}
            {page === 'settings'  && <PageSettings  toast={toast} />}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}

//  PAGE: OVERVIEW
function PageOverview({ toast, setPage }) {
  const [overview, setOverview] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ov, rd, al, ss] = await Promise.all([
          apiFetch('/analytics/overview?days=1'),
          apiFetch('/emotions?limit=10'),
          apiFetch('/alerts?resolved=false&limit=5'),
          apiFetch('/sessions?limit=5'),
        ]);
        if (ov.success) setOverview(ov);
        if (rd.success) setRecentReadings(rd.readings);
        if (al.success) setRecentAlerts(al.alerts);
        if (ss.success) setRecentSessions(ss.sessions);
      } catch { toast('Failed to load overview data', 'error'); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="cg-loading"><div className="cg-spinner" /> Loading overview…</div>;

  return (
    <>
      {/* Stat row */}
      <div className="cg-stats-row">
        <div className="cg-stat-card">
          <div className="cg-stat-icon blue"><span className="material-icons">psychology</span></div>
          <div>
            <div className="cg-stat-label">Readings Today</div>
            <div className="cg-stat-value">{overview?.totalReadings ?? 0}</div>
          </div>
        </div>
        <div className="cg-stat-card">
          <div className="cg-stat-icon green"><span className="material-icons">history</span></div>
          <div>
            <div className="cg-stat-label">Sessions Today</div>
            <div className="cg-stat-value">{overview?.totalSessions ?? 0}</div>
          </div>
        </div>
        <div className="cg-stat-card">
          <div className="cg-stat-icon amber"><span className="material-icons">sentiment_stressed</span></div>
          <div>
            <div className="cg-stat-label">Distress Readings</div>
            <div className="cg-stat-value">{overview?.distressReadings ?? 0}</div>
          </div>
        </div>
        <div className="cg-stat-card">
          <div className="cg-stat-icon danger"><span className="material-icons">notifications_active</span></div>
          <div>
            <div className="cg-stat-label">Open Alerts</div>
            <div className="cg-stat-value">{overview?.unresolvedAlerts ?? 0}</div>
          </div>
        </div>
        <div className="cg-stat-card">
          <div className="cg-stat-icon purple"><span className="material-icons">people</span></div>
          <div>
            <div className="cg-stat-label">Active Patients</div>
            <div className="cg-stat-value">{overview?.totalPatients ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="cg-grid-main-side" style={{ gap: 16 }}>
        {/* Recent Readings */}
        <div className="cg-card">
          <div className="cg-card-header">
            <div>
              <div className="cg-card-title">Recent Emotion Readings</div>
              <div className="cg-card-sub">Latest detections across all patients</div>
            </div>
            <button className="cg-btn cg-btn-secondary cg-btn-sm" onClick={() => setPage('readings')}>
              View All <span className="material-icons" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
            </button>
          </div>
          {recentReadings.length === 0 ? (
            <div className="cg-empty">
              <span className="material-icons">psychology</span>
              <h4>No readings yet</h4>
              <p>Start the emotion monitor to see data here.</p>
            </div>
          ) : recentReadings.map(r => (
            <div key={r._id} className="cg-reading-item">
              <span className="cg-reading-time">{formatDt(r.capturedAt)}</span>
              <span className="cg-reading-patient">{r.patientName}</span>
              <EmotionPill emotion={r.emotion} />
              {r.confidence != null && (
                <span className="cg-reading-conf">{r.confidence.toFixed(1)}%</span>
              )}
              {r.flagged && <span className="material-icons" style={{ color: '#df5a6a', fontSize: '0.95rem', marginLeft: 4 }}>flag</span>}
            </div>
          ))}
        </div>

        {/* Alerts sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="cg-card">
            <div className="cg-card-header">
              <div>
                <div className="cg-card-title">Open Alerts</div>
                <div className="cg-card-sub">Needs attention</div>
              </div>
              <button className="cg-btn cg-btn-danger cg-btn-sm" onClick={() => setPage('alerts')}>
                Manage
              </button>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="cg-empty" style={{ padding: '24px' }}>
                <span className="material-icons">check_circle</span>
                <h4>All clear!</h4>
                <p>No open alerts.</p>
              </div>
            ) : recentAlerts.map(a => (
              <div key={a._id} className="cg-alert-item">
                <div className={`cg-alert-dot ${a.severity}`} />
                <div style={{ flex: 1 }}>
                  <div className="cg-alert-msg">{a.message}</div>
                  <div className="cg-alert-meta">{formatDt(a.triggeredAt)} · {a.severity}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cg-card">
            <div className="cg-card-header">
              <div><div className="cg-card-title">Recent Sessions</div></div>
              <button className="cg-btn cg-btn-secondary cg-btn-sm" onClick={() => setPage('sessions')}>All</button>
            </div>
            {recentSessions.length === 0 ? (
              <div className="cg-empty" style={{ padding: '20px' }}>
                <span className="material-icons">history</span>
                <h4>No sessions</h4>
              </div>
            ) : recentSessions.map(s => (
              <div key={s._id} className="cg-reading-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f1d2e' }}>{s.patientName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#8a98a8', marginTop: 2 }}>{formatDt(s.startedAt)} · {s.totalReadings} readings</div>
                </div>
                <span className={`cg-badge ${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

//  PAGE: PATIENTS
function PagePatients({ toast }) {
  const [patients, setPatients]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [form, setForm]             = useState({ patientId: '', name: '', age: '', room: '', condition: '', notes: '' });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/patients');
      if (d.success) setPatients(d.patients);
    } catch { toast('Failed to load patients', 'error'); }
    setLoading(false);
  };

  useEffect(() => { loadPatients(); }, []);

  const loadAnalytics = async (patientId) => {
    try {
      const d = await apiFetch(`/analytics/patient/${patientId}?days=7`);
      if (d.success) setAnalytics(d);
    } catch {}
  };

  const selectPatient = (p) => {
    setSelected(p);
    setAnalytics(null);
    loadAnalytics(p.patientId);
  };

  const savePatient = async () => {
    if (!form.name.trim()) return toast('Name is required', 'error');
    if (!form.patientId.trim()) return toast('Patient ID required', 'error');
    try {
      const d = await apiFetch('/patients', { method: 'POST', body: form });
      if (d.success) {
        toast(editMode ? 'Patient updated' : 'Patient added');
        setShowAdd(false);
        setEditMode(false);
        setForm({ patientId: '', name: '', age: '', room: '', condition: '', notes: '' });
        loadPatients();
      }
    } catch { toast('Save failed', 'error'); }
  };

  const openEdit = (p) => {
    setForm({ patientId: p.patientId, name: p.name, age: p.age || '', room: p.room || '', condition: p.condition || '', notes: p.notes || '' });
    setEditMode(true);
    setShowAdd(true);
  };

  const pieData = analytics ? Object.entries(analytics.emotionCounts).map(([e, v]) => ({
    name: EMOTION_META[e]?.label || e, value: v, fill: EMOTION_META[e]?.color || '#94a3b8',
  })) : [];

  if (loading) return <div className="cg-loading"><div className="cg-spinner" /> Loading patients…</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="cg-section-header" style={{ margin: 0 }}>
          <div className="cg-section-eyebrow">Patients</div>
          <div className="cg-section-title">Patient Management</div>
        </div>
        <button className="cg-btn cg-btn-primary" onClick={() => { setEditMode(false); setShowAdd(true); }}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>person_add</span>
          Add Patient
        </button>
      </div>

      <div className="cg-grid-main-side">
        {/* Patient list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {patients.length === 0 ? (
            <div className="cg-card">
              <div className="cg-empty">
                <span className="material-icons">people</span>
                <h4>No patients yet</h4>
                <p>Add your first patient to get started.</p>
              </div>
            </div>
          ) : patients.map(p => (
            <div key={p.patientId} className={`cg-patient-card ${selected?.patientId === p.patientId ? 'selected' : ''}`}
              onClick={() => selectPatient(p)}>
              <div className="cg-patient-avatar">{p.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="cg-patient-name">{p.name}</div>
                <div className="cg-patient-room">Room {p.room || '—'} · Age {p.age || '—'}</div>
                {p.condition && <div style={{ fontSize: '0.75rem', color: '#5a6b9f', marginTop: 3, fontWeight: 600 }}>{p.condition}</div>}
              </div>
              <button className="cg-btn cg-btn-ghost cg-btn-sm" onClick={e => { e.stopPropagation(); openEdit(p); }}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>edit</span>
              </button>
            </div>
          ))}
        </div>

        {/* Selected patient analytics */}
        <div>
          {!selected ? (
            <div className="cg-card">
              <div className="cg-empty">
                <span className="material-icons">person_search</span>
                <h4>Select a patient</h4>
                <p>Click a patient to see their emotion analytics.</p>
              </div>
            </div>
          ) : (
            <div className="cg-card">
              <div className="cg-card-header">
                <div>
                  <div className="cg-card-title">{selected.name}</div>
                  <div className="cg-card-sub">7-day emotion analytics</div>
                </div>
                {analytics?.summary?.trend && (
                  <span className={`cg-badge ${analytics.summary.trend}`}>
                    <span className="material-icons" style={{ fontSize: '0.85rem' }}>
                      {analytics.summary.trend === 'improving' ? 'trending_up' : analytics.summary.trend === 'declining' ? 'trending_down' : 'trending_flat'}
                    </span>
                    {analytics.summary.trend}
                  </span>
                )}
              </div>

              {!analytics ? (
                <div className="cg-loading"><div className="cg-spinner" /></div>
              ) : (
                <div className="cg-card-body">
                  {/* Wellness score */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                    <WellnessRing score={analytics.summary.wellnessScore} />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#8a98a8', fontWeight: 700 }}>Wellness Score</div>
                      <div style={{ fontSize: '0.82rem', color: '#4a5a6e', marginTop: 4 }}>
                        {analytics.summary.totalReadings} readings · {analytics.summary.totalSessions} sessions
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#4a5a6e', marginTop: 2 }}>
                        <span style={{ color: '#0f9f74', fontWeight: 700 }}>{analytics.summary.positive} positive</span>
                        {' · '}
                        <span style={{ color: '#df5a6a', fontWeight: 700 }}>{analytics.summary.negative} distress</span>
                      </div>
                      {analytics.summary.unresolvedAlerts > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <span className="cg-badge critical">
                            <span className="material-icons" style={{ fontSize: '0.8rem' }}>warning</span>
                            {analytics.summary.unresolvedAlerts} open alerts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dominant emotion */}
                  {analytics.summary.dominant && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: '#8a98a8', fontWeight: 700, marginBottom: 5 }}>DOMINANT EMOTION</div>
                      <EmotionPill emotion={analytics.summary.dominant} />
                    </div>
                  )}

                  {/* Pie */}
                  {pieData.length > 0 && (
                    <div className="cg-chart-wrap">
                      <div style={{ fontSize: '0.75rem', color: '#8a98a8', fontWeight: 700, marginBottom: 8 }}>DISTRIBUTION</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
                            {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Daily trend */}
                  {analytics.dailyTrend?.length > 0 && (
                    <div className="cg-chart-wrap" style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.75rem', color: '#8a98a8', fontWeight: 700, marginBottom: 8 }}>DAILY WELLNESS TREND</div>
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={analytics.dailyTrend} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="positive" stroke="#0f9f74" fill="#e8fbf4" strokeWidth={2} />
                          <Area type="monotone" dataKey="negative" stroke="#df5a6a" fill="#fff0f2" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="cg-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="cg-modal" onClick={e => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-title">{editMode ? 'Edit Patient' : 'Add New Patient'}</div>
              <button className="cg-icon-btn" onClick={() => setShowAdd(false)}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            <div className="cg-modal-body">
              {['patientId', 'name', 'age', 'room', 'condition'].map(f => (
                <div key={f} className="cg-input-group">
                  <label className="cg-input-label">{f.charAt(0).toUpperCase() + f.slice(1)}{f === 'patientId' || f === 'name' ? ' *' : ''}</label>
                  <input className="cg-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                    disabled={editMode && f === 'patientId'}
                    placeholder={f === 'patientId' ? 'e.g. PT-001' : ''} />
                </div>
              ))}
              <div className="cg-input-group">
                <label className="cg-input-label">Notes</label>
                <textarea className="cg-textarea" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
              </div>
            </div>
            <div className="cg-modal-footer">
              <button className="cg-btn cg-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="cg-btn cg-btn-primary" onClick={savePatient}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>save</span>
                {editMode ? 'Save Changes' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  PAGE: SESSIONS
function PageSessions({ toast }) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status: '', patientId: '' });
  const [selected, setSelected] = useState(null);
  const [readings, setReadings] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 20, ...Object.fromEntries(Object.entries(filter).filter(([,v]) => v)) });
      const d = await apiFetch(`/sessions?${q}`);
      if (d.success) { setSessions(d.sessions); setTotal(d.total); }
    } catch { toast('Failed to load sessions', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filter]);

  const openSession = async (s) => {
    setSelected(s);
    try {
      const d = await apiFetch(`/emotions?sessionId=${s.sessionId}&limit=100`);
      if (d.success) setReadings(d.readings);
    } catch {}
  };

  const endSession = async (sessionId) => {
    try {
      await apiFetch(`/sessions/${sessionId}/end`, { method: 'PATCH', body: {} });
      toast('Session ended');
      load();
    } catch { toast('Failed to end session', 'error'); }
  };

  return (
    <>
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">History</div>
        <div className="cg-section-title">Monitoring Sessions</div>
        <div className="cg-section-desc">All emotion monitoring sessions for all patients</div>
      </div>

      <div className="cg-filter-row">
        <select className="cg-filter-select" value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
        <input className="cg-search-input" placeholder="Filter by Patient ID…"
          value={filter.patientId} onChange={e => setFilter(p => ({ ...p, patientId: e.target.value }))} />
        <button className="cg-btn cg-btn-ghost cg-btn-sm" onClick={() => { setFilter({ status: '', patientId: '' }); setPage(1); }}>
          <span className="material-icons" style={{ fontSize: '0.9rem' }}>clear</span> Clear
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#8a98a8', fontWeight: 600 }}>{total} total</span>
      </div>

      {loading ? <div className="cg-loading"><div className="cg-spinner" /> Loading…</div> : (
        <div className="cg-card">
          <div className="cg-table-wrap">
            <table className="cg-table">
              <thead>
                <tr>
                  <th>Patient</th><th>Started</th><th>Duration</th>
                  <th>Readings</th><th>Dominant</th><th>Score</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8a98a8', padding: '32px' }}>No sessions found</td></tr>
                ) : sessions.map(s => {
                  const pos = s.totalReadings ? Math.round((s.positiveCount / s.totalReadings) * 100) : null;
                  return (
                    <tr key={s._id}>
                      <td><span className="patient-name">{s.patientName}</span><div style={{ fontSize: '0.72rem', color: '#8a98a8' }}>{s.patientId}</div></td>
                      <td>{formatDt(s.startedAt)}</td>
                      <td>{formatDur(s.startedAt, s.endedAt)}</td>
                      <td><strong>{s.totalReadings}</strong></td>
                      <td>{s.dominantEmotion ? <EmotionPill emotion={s.dominantEmotion} /> : '—'}</td>
                      <td>{pos != null ? <span style={{ fontWeight: 700, color: pos >= 60 ? '#0f9f74' : pos >= 40 ? '#f28c28' : '#df5a6a' }}>{pos}%</span> : '—'}</td>
                      <td><span className={`cg-badge ${s.status}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="cg-btn cg-btn-secondary cg-btn-sm" onClick={() => openSession(s)}>Details</button>
                          {s.status === 'active' && (
                            <button className="cg-btn cg-btn-danger cg-btn-sm" onClick={() => endSession(s.sessionId)}>End</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {total > 20 && (
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button className="cg-btn cg-btn-ghost cg-btn-sm" disabled={page === 1} onClick={() => setPage(p=>p-1)}>‹ Prev</button>
              <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#8a98a8' }}>Page {page}</span>
              <button className="cg-btn cg-btn-ghost cg-btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p=>p+1)}>Next ›</button>
            </div>
          )}
        </div>
      )}

      {/* Session detail modal */}
      {selected && (
        <div className="cg-modal-overlay" onClick={() => setSelected(null)}>
          <div className="cg-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div>
                <div className="cg-modal-title">Session — {selected.patientName}</div>
                <div style={{ fontSize: '0.75rem', color: '#8a98a8', marginTop: 2 }}>{selected.sessionId}</div>
              </div>
              <button className="cg-icon-btn" onClick={() => setSelected(null)}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            <div className="cg-modal-body">
              <div className="cg-stats-row" style={{ marginBottom: 16 }}>
                <div className="cg-stat-card"><div className="cg-stat-icon green"><span className="material-icons">analytics</span></div><div><div className="cg-stat-label">Readings</div><div className="cg-stat-value">{selected.totalReadings}</div></div></div>
                <div className="cg-stat-card"><div className="cg-stat-icon blue"><span className="material-icons">timer</span></div><div><div className="cg-stat-label">Duration</div><div className="cg-stat-value" style={{ fontSize: '1.1rem' }}>{formatDur(selected.startedAt, selected.endedAt)}</div></div></div>
                <div className="cg-stat-card"><div className="cg-stat-icon amber"><span className="material-icons">speed</span></div><div><div className="cg-stat-label">Avg Confidence</div><div className="cg-stat-value">{selected.averageConfidence != null ? `${selected.averageConfidence}%` : '—'}</div></div></div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                {readings.length === 0 ? <div className="cg-empty"><span className="material-icons">list</span><p>No readings for this session.</p></div>
                : readings.slice(0, 80).map(r => (
                  <div key={r._id} className="cg-reading-item">
                    <span className="cg-reading-time">{formatDt(r.capturedAt)}</span>
                    <EmotionPill emotion={r.emotion} />
                    {r.confidence != null && <span className="cg-reading-conf">{r.confidence.toFixed(1)}%</span>}
                    {r.flagged && <span className="material-icons" style={{ color: '#df5a6a', fontSize: '0.9rem' }}>flag</span>}
                  </div>
                ))}
              </div>
              {selected.caregiverNotes && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: '#fffef2', border: '1px solid #f5e9b5', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: '#8a98a8', fontWeight: 700, marginBottom: 4 }}>CAREGIVER NOTES</div>
                  <div style={{ fontSize: '0.85rem' }}>{selected.caregiverNotes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  PAGE: ALERTS

function PageAlerts({ toast, onResolved }) {
  const [alerts, setAlerts]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ resolved: 'false', severity: '' });
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: 50, ...Object.fromEntries(Object.entries(filter).filter(([,v])=>v)) });
      const d = await apiFetch(`/alerts?${q}`);
      if (d.success) { setAlerts(d.alerts); setTotal(d.total); }
    } catch { toast('Failed to load alerts', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const resolve = async () => {
    try {
      await apiFetch(`/alerts/${resolveModal._id}/resolve`, {
        method: 'PATCH', body: { note: resolveNote, resolvedBy: 'caregiver' },
      });
      toast('Alert resolved');
      onResolved?.();
      setResolveModal(null); setResolveNote('');
      load();
    } catch { toast('Failed to resolve', 'error'); }
  };

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort((a,b) => (severityOrder[a.severity]||4) - (severityOrder[b.severity]||4));

  return (
    <>
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">Notifications</div>
        <div className="cg-section-title">Distress Alerts</div>
        <div className="cg-section-desc">Auto-generated when distress signals are detected</div>
      </div>

      <div className="cg-filter-row">
        <select className="cg-filter-select" value={filter.resolved} onChange={e => setFilter(p=>({...p, resolved: e.target.value}))}>
          <option value="false">Open Alerts</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
        <select className="cg-filter-select" value={filter.severity} onChange={e => setFilter(p=>({...p, severity: e.target.value}))}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#8a98a8', fontWeight: 600 }}>{total} alerts</span>
      </div>

      {loading ? <div className="cg-loading"><div className="cg-spinner" /></div> : (
        <div className="cg-card">
          {sorted.length === 0 ? (
            <div className="cg-empty">
              <span className="material-icons">check_circle</span>
              <h4>No alerts</h4>
              <p>All clear — no alerts matching this filter.</p>
            </div>
          ) : sorted.map(a => (
            <div key={a._id} className="cg-alert-item">
              <div className={`cg-alert-dot ${a.severity}`} style={{ marginTop: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <span className={`cg-badge ${a.severity}`}>{a.severity}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a5a6e' }}>{a.patientName}</span>
                  {a.emotion && <EmotionPill emotion={a.emotion} />}
                </div>
                <div className="cg-alert-msg">{a.message}</div>
                <div className="cg-alert-meta">{formatDt(a.triggeredAt)} · {a.type}</div>
                {a.resolved && a.resolvedNote && (
                  <div style={{ fontSize: '0.75rem', color: '#0f9f74', marginTop: 4 }}>
                    ✓ Resolved: {a.resolvedNote}
                  </div>
                )}
              </div>
              {!a.resolved && (
                <button className="cg-alert-resolve-btn" onClick={() => { setResolveModal(a); setResolveNote(''); }}>
                  <span className="material-icons" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: 3 }}>check</span>
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {resolveModal && (
        <div className="cg-modal-overlay" onClick={() => setResolveModal(null)}>
          <div className="cg-modal" onClick={e => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-title">Resolve Alert</div>
              <button className="cg-icon-btn" onClick={() => setResolveModal(null)}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            <div className="cg-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#4a5a6e', marginBottom: 14 }}>{resolveModal.message}</p>
              <div className="cg-input-group">
                <label className="cg-input-label">Resolution Note (optional)</label>
                <textarea className="cg-textarea" value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                  placeholder="Describe the action taken…" rows={3} />
              </div>
            </div>
            <div className="cg-modal-footer">
              <button className="cg-btn cg-btn-ghost" onClick={() => setResolveModal(null)}>Cancel</button>
              <button className="cg-btn cg-btn-primary" onClick={resolve}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>check_circle</span>
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  PAGE: READINGS (Emotion Log)
function PageReadings({ toast }) {
  const [readings, setReadings] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ emotion: '', flagged: '', patientId: '' });
  const [flagModal, setFlagModal] = useState(null);
  const [flagNote, setFlagNote]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 50, ...Object.fromEntries(Object.entries(filter).filter(([,v])=>v)) });
      const d = await apiFetch(`/emotions?${q}`);
      if (d.success) { setReadings(d.readings); setTotal(d.total); }
    } catch { toast('Failed to load readings', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filter]);

  const saveFlag = async () => {
    try {
      await apiFetch(`/emotions/${flagModal._id}/flag`, {
        method: 'PATCH', body: { flagged: !flagModal.flagged, notes: flagNote },
      });
      toast(flagModal.flagged ? 'Reading unflagged' : 'Reading flagged');
      setFlagModal(null); setFlagNote('');
      load();
    } catch { toast('Failed to update reading', 'error'); }
  };

  return (
    <>
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">Data</div>
        <div className="cg-section-title">Emotion Readings Log</div>
        <div className="cg-section-desc">All captured emotion data. Flag readings that need follow-up.</div>
      </div>

      <div className="cg-filter-row">
        <input className="cg-search-input" placeholder="Patient ID…"
          value={filter.patientId} onChange={e => setFilter(p=>({...p, patientId: e.target.value}))} />
        <select className="cg-filter-select" value={filter.emotion} onChange={e => setFilter(p=>({...p, emotion: e.target.value}))}>
          <option value="">All Emotions</option>
          {Object.keys(EMOTION_META).map(e => <option key={e} value={e}>{EMOTION_META[e].label}</option>)}
        </select>
        <select className="cg-filter-select" value={filter.flagged} onChange={e => setFilter(p=>({...p, flagged: e.target.value}))}>
          <option value="">All Readings</option>
          <option value="true">Flagged Only</option>
        </select>
        <button className="cg-btn cg-btn-ghost cg-btn-sm" onClick={() => { setFilter({ emotion:'', flagged:'', patientId:'' }); setPage(1); }}>
          <span className="material-icons" style={{ fontSize: '0.9rem' }}>clear</span> Clear
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#8a98a8', fontWeight: 600 }}>{total} readings</span>
      </div>

      {loading ? <div className="cg-loading"><div className="cg-spinner" /></div> : (
        <div className="cg-card">
          <div className="cg-table-wrap">
            <table className="cg-table">
              <thead>
                <tr><th>Time</th><th>Patient</th><th>Emotion</th><th>Confidence</th><th>Session</th><th>Notes</th><th>Flag</th></tr>
              </thead>
              <tbody>
                {readings.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#8a98a8', padding: '32px' }}>No readings found</td></tr>
                ) : readings.map(r => (
                  <tr key={r._id} style={r.flagged ? { background: '#fff8f8' } : {}}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDt(r.capturedAt)}</td>
                    <td><span className="patient-name">{r.patientName}</span></td>
                    <td><EmotionPill emotion={r.emotion} /></td>
                    <td>{r.confidence != null ? `${r.confidence.toFixed(1)}%` : '—'}</td>
                    <td><span style={{ fontSize: '0.72rem', color: '#8a98a8', fontFamily: 'monospace' }}>{r.sessionId?.slice(0,8)}…</span></td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                    <td>
                      <button className="cg-btn cg-btn-sm" style={{ background: r.flagged ? '#fff0f2' : '#f1f5f9', color: r.flagged ? '#df5a6a' : '#64748b', border: 'none' }}
                        onClick={() => { setFlagModal(r); setFlagNote(r.notes || ''); }}>
                        <span className="material-icons" style={{ fontSize: '0.9rem' }}>{r.flagged ? 'flag' : 'flag_outlined'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button className="cg-btn cg-btn-ghost cg-btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹ Prev</button>
              <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#8a98a8' }}>Page {page} of {Math.ceil(total/50)}</span>
              <button className="cg-btn cg-btn-ghost cg-btn-sm" disabled={page*50>=total} onClick={() => setPage(p=>p+1)}>Next ›</button>
            </div>
          )}
        </div>
      )}

      {flagModal && (
        <div className="cg-modal-overlay" onClick={() => setFlagModal(null)}>
          <div className="cg-modal" onClick={e => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-title">{flagModal.flagged ? 'Unflag' : 'Flag'} Reading</div>
              <button className="cg-icon-btn" onClick={() => setFlagModal(null)}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            <div className="cg-modal-body">
              <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
                <EmotionPill emotion={flagModal.emotion} />
                <span style={{ fontSize: '0.82rem', color: '#8a98a8' }}>{formatDt(flagModal.capturedAt)}</span>
              </div>
              <div className="cg-input-group">
                <label className="cg-input-label">Note for this reading</label>
                <textarea className="cg-textarea" value={flagNote} onChange={e => setFlagNote(e.target.value)}
                  placeholder="Add context or observation…" rows={3} />
              </div>
            </div>
            <div className="cg-modal-footer">
              <button className="cg-btn cg-btn-ghost" onClick={() => setFlagModal(null)}>Cancel</button>
              <button className="cg-btn cg-btn-primary" onClick={saveFlag}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>save</span>
                {flagModal.flagged ? 'Unflag' : 'Flag'} Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  PAGE: ANALYTICS
function PageAnalytics({ toast }) {
  const [patients, setPatients]   = useState([]);
  const [patientId, setPatientId] = useState('');
  const [days, setDays]           = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    apiFetch('/patients').then(d => { if (d.success) setPatients(d.patients); });
  }, []);

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const d = await apiFetch(`/analytics/patient/${patientId}?days=${days}`);
      if (d.success) setAnalytics(d);
    } catch { toast('Failed to load analytics', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId, days]);

  const barData = analytics ? Object.entries(analytics.emotionCounts).map(([e, v]) => ({
    label: EMOTION_META[e]?.label || e, count: v, fill: EMOTION_META[e]?.color || '#94a3b8',
  })) : [];

  const pieData = analytics ? Object.entries(analytics.emotionCounts).map(([e, v]) => ({
    name: EMOTION_META[e]?.label || e, value: v, fill: EMOTION_META[e]?.color || '#94a3b8',
  })) : [];

  return (
    <>
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">Insights</div>
        <div className="cg-section-title">Emotion Analytics</div>
        <div className="cg-section-desc">Deep-dive into patient emotion trends over time</div>
      </div>

      <div className="cg-filter-row" style={{ marginBottom: 20 }}>
        <select className="cg-filter-select" value={patientId} onChange={e => setPatientId(e.target.value)}>
          <option value="">Select a patient…</option>
          {patients.map(p => <option key={p.patientId} value={p.patientId}>{p.name}</option>)}
        </select>
        <select className="cg-filter-select" value={days} onChange={e => setDays(+e.target.value)}>
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {!patientId ? (
        <div className="cg-card"><div className="cg-empty">
          <span className="material-icons">bar_chart</span>
          <h4>Select a patient</h4>
          <p>Choose a patient above to view their analytics.</p>
        </div></div>
      ) : loading ? <div className="cg-loading"><div className="cg-spinner" /></div> : !analytics ? null : (
        <>
          {/* Summary stats */}
          <div className="cg-stats-row" style={{ marginBottom: 20 }}>
            <div className="cg-stat-card">
              <div className="cg-stat-icon blue"><span className="material-icons">psychology</span></div>
              <div><div className="cg-stat-label">Total Readings</div><div className="cg-stat-value">{analytics.summary.totalReadings}</div></div>
            </div>
            <div className="cg-stat-card">
              <div className="cg-stat-icon green"><span className="material-icons">sentiment_satisfied</span></div>
              <div>
                <div className="cg-stat-label">Wellness Score</div>
                <div className="cg-stat-value" style={{ color: analytics.summary.wellnessScore >= 70 ? '#0f9f74' : analytics.summary.wellnessScore >= 40 ? '#f28c28' : '#df5a6a' }}>
                  {analytics.summary.wellnessScore ?? '—'}%
                </div>
              </div>
            </div>
            <div className="cg-stat-card">
              <div className="cg-stat-icon amber"><span className="material-icons">history</span></div>
              <div><div className="cg-stat-label">Sessions</div><div className="cg-stat-value">{analytics.summary.totalSessions}</div></div>
            </div>
            <div className="cg-stat-card">
              <div className="cg-stat-icon danger"><span className="material-icons">warning</span></div>
              <div><div className="cg-stat-label">Open Alerts</div><div className="cg-stat-value">{analytics.summary.unresolvedAlerts}</div></div>
            </div>
          </div>

          <div className="cg-grid-2" style={{ gap: 16, marginBottom: 16 }}>
            {/* Bar chart */}
            <div className="cg-card">
              <div className="cg-card-header"><div className="cg-card-title">Emotion Frequency</div></div>
              <div className="cg-card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6,6,0,0]} maxBarSize={48}>
                      {barData.map((e,i) => <Cell key={i} fill={e.fill} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart */}
            <div className="cg-card">
              <div className="cg-card-header"><div className="cg-card-title">Emotion Distribution</div></div>
              <div className="cg-card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily trend */}
          {analytics.dailyTrend?.length > 0 && (
            <div className="cg-card">
              <div className="cg-card-header">
                <div><div className="cg-card-title">Daily Wellness Trend</div><div className="cg-card-sub">Positive vs distress readings per day</div></div>
                <span className={`cg-badge ${analytics.summary.trend}`}>
                  <span className="material-icons" style={{ fontSize: '0.85rem' }}>
                    {analytics.summary.trend === 'improving' ? 'trending_up' : analytics.summary.trend === 'declining' ? 'trending_down' : 'trending_flat'}
                  </span>
                  {analytics.summary.trend}
                </span>
              </div>
              <div className="cg-card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.dailyTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="positive" name="Positive" stroke="#0f9f74" fill="#e8fbf4" strokeWidth={2} />
                    <Area type="monotone" dataKey="negative" name="Distress" stroke="#df5a6a" fill="#fff0f2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

//  PAGE: NOTES
function PageNotes({ toast }) {
  const [notes, setNotes]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState({ patientId: '', pinned: '' });
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ patientId: '', note: '', priority: 'normal', pinned: false });
  const [patients, setPatients]   = useState([]);

  useEffect(() => {
    apiFetch('/patients').then(d => { if (d.success) setPatients(d.patients); });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: 50, ...Object.fromEntries(Object.entries(filter).filter(([,v])=>v)) });
      const d = await apiFetch(`/notes?${q}`);
      if (d.success) { setNotes(d.notes); setTotal(d.total); }
    } catch { toast('Failed to load notes', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const saveNote = async () => {
    if (!form.note.trim()) return toast('Note text required', 'error');
    if (!form.patientId)   return toast('Select a patient', 'error');
    try {
      await apiFetch('/notes', { method: 'POST', body: form });
      toast('Note saved');
      setShowAdd(false);
      setForm({ patientId: '', note: '', priority: 'normal', pinned: false });
      load();
    } catch { toast('Failed to save note', 'error'); }
  };

  const togglePin = async (note) => {
    try {
      await apiFetch(`/notes/${note._id}`, { method: 'PATCH', body: { pinned: !note.pinned } });
      load();
    } catch { toast('Failed to update note', 'error'); }
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' });
      toast('Note deleted');
      load();
    } catch { toast('Failed to delete note', 'error'); }
  };

  const priorityColor = { normal: '#94a3b8', important: '#f28c28', urgent: '#df5a6a' };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="cg-section-header" style={{ margin: 0 }}>
          <div className="cg-section-eyebrow">Care Notes</div>
          <div className="cg-section-title">Caregiver Notes</div>
        </div>
        <button className="cg-btn cg-btn-primary" onClick={() => setShowAdd(true)}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
          Add Note
        </button>
      </div>

      <div className="cg-filter-row">
        <select className="cg-filter-select" value={filter.patientId} onChange={e => setFilter(p=>({...p, patientId: e.target.value}))}>
          <option value="">All Patients</option>
          {patients.map(p => <option key={p.patientId} value={p.patientId}>{p.name}</option>)}
        </select>
        <select className="cg-filter-select" value={filter.pinned} onChange={e => setFilter(p=>({...p, pinned: e.target.value}))}>
          <option value="">All Notes</option>
          <option value="true">Pinned Only</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#8a98a8', fontWeight: 600 }}>{total} notes</span>
      </div>

      {loading ? <div className="cg-loading"><div className="cg-spinner" /></div> : notes.length === 0 ? (
        <div className="cg-card"><div className="cg-empty">
          <span className="material-icons">edit_note</span>
          <h4>No notes yet</h4>
          <p>Add observations and care notes here.</p>
        </div></div>
      ) : notes.map(n => (
        <div key={n._id} className={`cg-note-item ${n.pinned ? 'pinned' : ''}`}>
          <div className="cg-note-text">{n.note}</div>
          <div className="cg-note-footer">
            <div className="cg-note-meta">
              {patients.find(p => p.patientId === n.patientId)?.name || n.patientId} · {formatDt(n.createdAt)}
              {' · '}<span style={{ color: priorityColor[n.priority], fontWeight: 700 }}>{n.priority}</span>
            </div>
            <div className="cg-note-actions">
              <button className="cg-btn cg-btn-ghost cg-btn-sm" onClick={() => togglePin(n)}
                title={n.pinned ? 'Unpin' : 'Pin'}>
                <span className="material-icons" style={{ fontSize: '0.88rem' }}>{n.pinned ? 'push_pin' : 'push_pin'}</span>
              </button>
              <button className="cg-btn cg-btn-danger cg-btn-sm" onClick={() => deleteNote(n._id)}>
                <span className="material-icons" style={{ fontSize: '0.88rem' }}>delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {showAdd && (
        <div className="cg-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="cg-modal" onClick={e => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-title">Add Caregiver Note</div>
              <button className="cg-icon-btn" onClick={() => setShowAdd(false)}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            <div className="cg-modal-body">
              <div className="cg-input-group">
                <label className="cg-input-label">Patient *</label>
                <select className="cg-input" value={form.patientId} onChange={e => setForm(p=>({...p, patientId: e.target.value}))}>
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.patientId} value={p.patientId}>{p.name}</option>)}
                </select>
              </div>
              <div className="cg-input-group">
                <label className="cg-input-label">Note *</label>
                <textarea className="cg-textarea" value={form.note} onChange={e => setForm(p=>({...p, note: e.target.value}))}
                  placeholder="Write your observation…" rows={4} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="cg-input-group" style={{ flex: 1 }}>
                  <label className="cg-input-label">Priority</label>
                  <select className="cg-input" value={form.priority} onChange={e => setForm(p=>({...p, priority: e.target.value}))}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="cg-input-group" style={{ flex: 1 }}>
                  <label className="cg-input-label">Pin Note</label>
                  <select className="cg-input" value={form.pinned ? 'true' : 'false'}
                    onChange={e => setForm(p=>({...p, pinned: e.target.value === 'true'}))}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="cg-modal-footer">
              <button className="cg-btn cg-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="cg-btn cg-btn-primary" onClick={saveNote}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>save</span>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  PAGE: SETTINGS
function PageSettings({ toast }) {
  const [apiUrl, setApiUrl] = useState(API);
  const [emotionApi, setEmotionApi] = useState('http://localhost:8000/detect-emotion');
  const [interval, setIntervalVal] = useState(2);
  const [autoFlag, setAutoFlag] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(3);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    toast('Settings saved (restart app to apply API changes)');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">Configuration</div>
        <div className="cg-section-title">Dashboard Settings</div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="cg-card" style={{ marginBottom: 16 }}>
          <div className="cg-card-header"><div className="cg-card-title">API Configuration</div></div>
          <div className="cg-card-body">
            <div className="cg-input-group">
              <label className="cg-input-label">Caregiver Backend URL</label>
              <input className="cg-input" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
              <div style={{ fontSize: '0.72rem', color: '#8a98a8', marginTop: 4 }}>Set via VITE_CAREGIVER_API env variable</div>
            </div>
            <div className="cg-input-group">
              <label className="cg-input-label">Emotion Detection API URL</label>
              <input className="cg-input" value={emotionApi} onChange={e => setEmotionApi(e.target.value)} />
              <div style={{ fontSize: '0.72rem', color: '#8a98a8', marginTop: 4 }}>Set via VITE_BACKEND_API_ENDPOINT env variable</div>
            </div>
          </div>
        </div>

        <div className="cg-card" style={{ marginBottom: 16 }}>
          <div className="cg-card-header"><div className="cg-card-title">Monitoring Settings</div></div>
          <div className="cg-card-body">
            <div className="cg-input-group">
              <label className="cg-input-label">Capture Interval (seconds)</label>
              <input className="cg-input" type="number" min={1} max={30} value={interval}
                onChange={e => setIntervalVal(+e.target.value)} />
            </div>
            <div className="cg-input-group">
              <label className="cg-input-label">Distress Alert Threshold</label>
              <input className="cg-input" type="number" min={1} max={20} value={alertThreshold}
                onChange={e => setAlertThreshold(+e.target.value)} />
              <div style={{ fontSize: '0.72rem', color: '#8a98a8', marginTop: 4 }}>Number of distress readings in 10 min to trigger alert</div>
            </div>
            <div className="cg-input-group">
              <label className="cg-input-label">Auto-flag High-Confidence Distress</label>
              <select className="cg-input" value={autoFlag ? 'true' : 'false'}
                onChange={e => setAutoFlag(e.target.value === 'true')}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="cg-card" style={{ marginBottom: 16 }}>
          <div className="cg-card-header"><div className="cg-card-title">Database</div></div>
          <div className="cg-card-body">
            <div style={{ fontSize: '0.84rem', color: '#4a5a6e', marginBottom: 10 }}>
              Connected to MongoDB Atlas
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8a98a8', fontFamily: 'monospace', background: '#f8fafb', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              mongodb+srv://cluster0.j3emosp.mongodb.net/emotion_care
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['EmotionReading','Session','Patient','Alert','CaregiverNote'].map(col => (
                <span key={col} className="cg-badge stable" style={{ fontSize: '0.72rem' }}>
                  <span className="material-icons" style={{ fontSize: '0.75rem' }}>storage</span>
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button className="cg-btn cg-btn-primary" onClick={save}>
          <span className="material-icons" style={{ fontSize: '0.9rem' }}>{saved ? 'check' : 'save'}</span>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </>
  );
}
