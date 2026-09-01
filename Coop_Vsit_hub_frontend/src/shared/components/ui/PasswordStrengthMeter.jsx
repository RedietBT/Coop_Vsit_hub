import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

/**
 * PasswordStrengthMeter
 *
 * Reusable visual password strength indicator.
 * Accepts the current password value and renders:
 *  - A segmented strength bar (Weak / Fair / Strong / Very Strong)
 *  - A checklist of policy requirements
 *
 * Props:
 *   password {string} — the current new password value to evaluate
 */
export default function PasswordStrengthMeter({ password = '' }) {
  const checks = useMemo(() => ({
    length:    password.length >= 8,
    upper:     /[A-Z]/.test(password),
    lower:     /[a-z]/.test(password),
    digit:     /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const score = Object.values(checks).filter(Boolean).length; // 0–5

  const strength = useMemo(() => {
    if (!password) return null;
    if (score <= 1) return { label: 'Too Weak',   color: '#ef4444', segments: 1, Icon: ShieldX };
    if (score === 2) return { label: 'Weak',       color: '#f97316', segments: 2, Icon: ShieldAlert };
    if (score === 3) return { label: 'Fair',       color: '#eab308', segments: 3, Icon: ShieldAlert };
    if (score === 4) return { label: 'Strong',     color: '#22c55e', segments: 4, Icon: ShieldCheck };
    return              { label: 'Very Strong', color: '#10b981', segments: 5, Icon: ShieldCheck };
  }, [password, score]);

  if (!password) return null;

  const { label, color, segments, Icon } = strength;

  return (
    <div style={{ marginTop: '6px' }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: i <= segments ? color : 'rgba(148,163,184,0.25)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
        <Icon size={12} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color }}>
          Password strength: {label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3px 8px',
      }}>
        {[
          { ok: checks.length,  label: 'At least 8 characters' },
          { ok: checks.upper,   label: '1 Uppercase letter' },
          { ok: checks.lower,   label: '1 Lowercase letter' },
          { ok: checks.digit,   label: '1 Number (0–9)' },
          { ok: checks.special, label: '1 Special symbol' },
        ].map(({ ok, label }) => (
          <span key={label} style={{
            fontSize: '10.5px',
            color: ok ? '#16a34a' : '#94a3b8',
            fontWeight: ok ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s',
          }}>
            <span style={{
              width: '12px', height: '12px',
              borderRadius: '50%',
              background: ok ? '#16a34a' : 'rgba(148,163,184,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', color: '#fff',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              {ok ? '✓' : ''}
            </span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
