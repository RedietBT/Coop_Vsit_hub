import React, { useState, useEffect } from 'react';

const CONSENT_KEY = 'coop_cookie_consent';

/**
 * CookieConsentBanner
 * Informs users about session cookies (HttpOnly refresh token) and functional cookies.
 * Accepts or dismisses persistently — stored in localStorage.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash during page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const handleDecline = () => {
    // Session cookies (auth) are strictly necessary — we note the decline but keep essential ones
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur */}
      <div style={styles.backdrop} />

      <div style={styles.banner} role="dialog" aria-modal="true" aria-label="Cookie Policy">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>🍪</div>
          <div>
            <h2 style={styles.title}>We use cookies</h2>
            <p style={styles.subtitle}>CoopBank Visitor Hub — Session & Security Notice</p>
          </div>
        </div>

        {/* Body */}
        <p style={styles.body}>
          This system uses <strong>strictly necessary cookies</strong> to keep you securely signed in.
          Your session refresh token is stored in an{' '}
          <strong>HttpOnly, Secure cookie</strong> — it is never accessible by JavaScript
          and is used solely to maintain your authenticated session.
        </p>

        {/* Expandable details */}
        <button style={styles.detailsToggle} onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? '▲ Hide details' : '▼ View cookie details'}
        </button>

        {showDetails && (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Cookie Name</span>
              <span>Purpose</span>
              <span>Type</span>
              <span>Duration</span>
            </div>
            <div style={styles.tableRow}>
              <code style={styles.code}>coop_refresh_token</code>
              <span>Keeps you signed in between sessions securely</span>
              <span style={{ ...styles.badge, background: '#166534', color: '#bbf7d0' }}>Strictly Necessary</span>
              <span>7 days</span>
            </div>
            <div style={styles.tableRow}>
              <code style={styles.code}>coop_auth_state</code>
              <span>Stores access token &amp; profile in browser memory</span>
              <span style={{ ...styles.badge, background: '#1e3a5f', color: '#bfdbfe' }}>Functional</span>
              <span>Session</span>
            </div>
            <div style={styles.tableRow}>
              <code style={styles.code}>coop_cookie_consent</code>
              <span>Remembers your cookie preference</span>
              <span style={{ ...styles.badge, background: '#4c1d95', color: '#e9d5ff' }}>Functional</span>
              <span>1 year</span>
            </div>
          </div>
        )}

        <p style={styles.note}>
          ⚠️ Strictly necessary cookies cannot be disabled — they are required for login and
          security. No tracking, analytics, or advertising cookies are used.
        </p>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={handleDecline}>
            Manage Preferences
          </button>
          <button style={styles.btnPrimary} onClick={handleAccept}>
            Accept All Cookies
          </button>
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          Cooperative Bank of Oromia · Visitor Hub · Data processed under internal banking security policy
        </p>
      </div>
    </>
  );
}

// ─── Inline styles (no external dependency) ───────────────────────────────────

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(3px)',
    zIndex: 9998,
    pointerEvents: 'none',
  },
  banner: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(92vw, 680px)',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '20px',
    padding: '28px 32px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
    zIndex: 9999,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
    animation: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  iconWrap: {
    fontSize: '32px',
    lineHeight: 1,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#64748b',
    letterSpacing: '0.3px',
  },
  body: {
    fontSize: '14px',
    lineHeight: 1.65,
    color: '#94a3b8',
    margin: '0 0 12px',
  },
  detailsToggle: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: '12px',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
  table: {
    background: 'rgba(15,23,42,0.6)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
    border: '1px solid rgba(148,163,184,0.1)',
    fontSize: '12px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 2fr 1.4fr 0.8fr',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(148,163,184,0.08)',
    color: '#64748b',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontSize: '11px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 2fr 1.4fr 0.8fr',
    gap: '8px',
    padding: '10px 14px',
    color: '#94a3b8',
    borderTop: '1px solid rgba(148,163,184,0.07)',
    alignItems: 'center',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#67e8f9',
    background: 'rgba(103,232,249,0.08)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '999px',
    letterSpacing: '0.3px',
  },
  note: {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  btnPrimary: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(37,99,235,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  btnSecondary: {
    padding: '11px 20px',
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  footer: {
    margin: 0,
    fontSize: '11px',
    color: '#334155',
    textAlign: 'center',
    borderTop: '1px solid rgba(148,163,184,0.08)',
    paddingTop: '12px',
  },
};
