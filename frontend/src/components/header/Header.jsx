import { useEffect, useState, useRef } from 'react';
import './Header.css';
import 'material-icons/iconfont/material-icons.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthToken, useCurrentUserType } from '../../auth';

const NAV_ITEMS = [
  { id: '',               label: 'Home',            icon: 'home' },
  { id: 'my-reminders',   label: 'Reminders',       icon: 'medication' },
  { id: 'emotion-monitor',label: 'Emotion Monitor', icon: 'psychology' },
  { id: 'sleep-monitor',  label: 'Sleep Monitor',   icon: 'bedtime' },
  { id: 'fall-detection', label: 'Fall Detection',  icon: 'personal_injury' },
  { id: 'caregiver',      label: 'Caregiver',       icon: 'favorite' },
];

function Header() {
  const authToken  = useAuthToken();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [activePage, setActivePage] = useState('');
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [time,       setTime]       = useState(new Date());
  const indicatorRef = useRef(null);
  const navRef       = useRef(null);

  useEffect(() => {
    setActivePage(getPageId(location.pathname));
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sliding indicator under active nav item
  useEffect(() => {
    if (!navRef.current || !indicatorRef.current) return;
    const activeEl = navRef.current.querySelector('.hdr-nav-item.active');
    if (activeEl) {
      const navRect  = navRef.current.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      indicatorRef.current.style.width   = `${itemRect.width - 16}px`;
      indicatorRef.current.style.left    = `${itemRect.left - navRect.left + 8}px`;
      indicatorRef.current.style.opacity = '1';
    } else {
      indicatorRef.current.style.opacity = '0';
    }
  }, [activePage]);

  const go = (id) => navigate('/' + id);

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      <header className={`hdr ${scrolled ? 'hdr--scrolled' : ''}`}>

        {/* ── Top bar ── */}
        <div className="hdr-top">

          {/* Logo */}
          <button className="hdr-logo" onClick={() => go('')}>
            <div className="hdr-logo-icon">
              <span className="material-icons">favorite</span>
            </div>
            <div className="hdr-logo-text">
              <span className="hdr-logo-name">CareVision</span>
              <span className="hdr-logo-sub">Smart Elder Care</span>
            </div>
          </button>

          {/* Live clock */}
          <div className="hdr-clock">
            <span className="hdr-clock-time">{timeStr}</span>
            <span className="hdr-clock-date">{dateStr}</span>
          </div>

          {/* Right actions */}
          <div className="hdr-actions">
            {authToken != null && (
              <>
                <button className="hdr-icon-btn" onClick={() => navigate('/notification')} title="Notifications">
                  <span className="material-icons">notifications</span>
                  <span className="hdr-icon-dot" />
                </button>
                <button className="hdr-icon-btn" onClick={() => navigate('/profile')} title="Profile">
                  <span className="material-icons">account_circle</span>
                </button>
                <button className="hdr-signout-btn" onClick={() => navigate('/signout')}>
                  <span className="material-icons">logout</span>
                  Sign Out
                </button>
              </>
            )}
            {/* Hamburger for mobile */}
            <button
              className={`hdr-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <nav className="hdr-nav-wrap">
          <div className="hdr-nav" ref={navRef}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`hdr-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => go(item.id)}
              >
                <span className="material-icons hdr-nav-icon">{item.icon}</span>
                <span className="hdr-nav-label">{item.label}</span>
              </button>
            ))}
            <div className="hdr-nav-indicator" ref={indicatorRef} />
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ── */}
      <div className={`hdr-mobile-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="hdr-mobile-drawer" onClick={e => e.stopPropagation()}>
          <div className="hdr-mobile-header">
            <div className="hdr-logo-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
              <span className="material-icons" style={{ fontSize: '1rem' }}>favorite</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f1d2e', marginLeft: 10 }}>CareVision</span>
            <button className="hdr-icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setMenuOpen(false)}>
              <span className="material-icons">close</span>
            </button>
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`hdr-mobile-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              <span className="material-icons">{item.icon}</span>
              {item.label}
            </button>
          ))}
          {authToken != null && (
            <button
              className="hdr-mobile-item"
              style={{ color: '#df5a6a', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}
              onClick={() => navigate('/signout')}
            >
              <span className="material-icons">logout</span>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function getPageId(path) {
  const p = path.substring(1);
  const idx = p.indexOf('/');
  return idx === -1 ? p : p.substring(0, idx);
}

export default Header;