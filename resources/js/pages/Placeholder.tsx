import React from 'react';

export default function Placeholder() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-3)' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
        <rect x="4" y="4" width="40" height="40" rx="8"/>
        <path d="M16 24h16M24 16v16"/>
      </svg>
      <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)' }}>Coming soon</p>
      <p style={{ fontSize: 13 }}>This section is under construction.</p>
    </div>
  );
}
