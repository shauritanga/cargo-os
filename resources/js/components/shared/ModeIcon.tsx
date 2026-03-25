import React from 'react';

const style: React.CSSProperties = { width: 12, height: 12, verticalAlign: 'middle', marginRight: 4 };

export function SeaIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={style}>
      <path d="M1 9l2-5h8l2 5H1z"/>
      <path d="M4 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/>
    </svg>
  );
}

export function AirIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={style}>
      <path d="M1 8l3-4 2 2 5-3 1 2-5 2 1 3-2 1-1-2-4 1z"/>
    </svg>
  );
}

export function RoadIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={style}>
      <rect x="1" y="4" width="9" height="6" rx="1"/>
      <path d="M10 7l3 1.5V10h-3V7z"/>
      <circle cx="3.5" cy="10" r="1.5"/>
      <circle cx="8.5" cy="10" r="1.5"/>
    </svg>
  );
}

export function RailIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={style}>
      <rect x="2" y="2" width="10" height="8" rx="1.5"/>
      <path d="M2 6h10"/>
      <circle cx="4" cy="12" r="1"/>
      <circle cx="10" cy="12" r="1"/>
      <path d="M4 10v2M10 10v2M5 12h4"/>
    </svg>
  );
}

export function ModeIcon({ mode }: { mode: string }) {
  switch (mode) {
    case 'Sea': return <SeaIcon />;
    case 'Air': return <AirIcon />;
    case 'Road': return <RoadIcon />;
    case 'Rail': return <RailIcon />;
    default: return null;
  }
}
