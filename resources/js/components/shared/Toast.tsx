import React from 'react';

interface ToastProps {
  message: string;
  color: 'blue' | 'green' | 'red' | 'amber';
}

const COLOR_MAP = {
  blue: { bg: 'var(--blue-dim)', icon: 'var(--blue)' },
  green: { bg: 'var(--green-dim)', icon: 'var(--green)' },
  red: { bg: 'var(--red-dim)', icon: 'var(--red)' },
  amber: { bg: 'var(--amber-dim)', icon: 'var(--amber)' },
};

export default function Toast({ message, color }: ToastProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="toast">
      <div className="toast-icon" style={{ background: c.bg, color: c.icon }}>
        {color === 'green' ? (
          <svg viewBox="0 0 11 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 4.5l3 3 6-6"/>
          </svg>
        ) : color === 'red' ? (
          <svg viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l9 9M10 1L1 10"/>
          </svg>
        ) : (
          <svg viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="5.5" cy="5.5" r="4.5"/>
            <path d="M5.5 3v3M5.5 7.5v.5"/>
          </svg>
        )}
      </div>
      {message}
    </div>
  );
}
