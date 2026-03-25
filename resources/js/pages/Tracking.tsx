import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Badge, { STATUS_LABEL } from '../components/shared/Badge';
import { fmtDate } from '../data/mock';
import type { Shipment, TimelineStep } from '../types';

/* ─── Timeline data (mirrors Shipments.tsx) ───────────────────────────────── */
const TIMELINE_INT: Record<string, TimelineStep[]> = {
  transit:   [{label:'Order Created',done:true},{label:'Picked Up',done:true},{label:'Origin Port Cleared',done:true},{label:'In Transit',active:true},{label:'Destination Customs',pending:true},{label:'Out for Delivery',pending:true},{label:'Delivered',pending:true}],
  delivered: [{label:'Order Created',done:true},{label:'Picked Up',done:true},{label:'Origin Port Cleared',done:true},{label:'In Transit',done:true},{label:'Destination Customs',done:true},{label:'Out for Delivery',done:true},{label:'Delivered',done:true}],
  pending:   [{label:'Order Created',done:true},{label:'Awaiting Pickup',active:true},{label:'Origin Port Cleared',pending:true},{label:'In Transit',pending:true},{label:'Destination Customs',pending:true},{label:'Delivered',pending:true}],
  delayed:   [{label:'Order Created',done:true},{label:'Picked Up',done:true},{label:'In Transit',active:true},{label:'Delay — Port Congestion',done:true,warn:true},{label:'Destination Customs',pending:true},{label:'Delivered',pending:true}],
  customs:   [{label:'Order Created',done:true},{label:'Picked Up',done:true},{label:'In Transit',done:true},{label:'Customs Hold',active:true},{label:'Out for Delivery',pending:true},{label:'Delivered',pending:true}],
};
const TIMELINE_DOM: Record<string, TimelineStep[]> = {
  transit:   [{label:'Order Created',done:true},{label:'Driver Assigned',done:true},{label:'Picked Up',done:true},{label:'En Route',active:true},{label:'Out for Delivery',pending:true},{label:'Delivered',pending:true}],
  delivered: [{label:'Order Created',done:true},{label:'Driver Assigned',done:true},{label:'Picked Up',done:true},{label:'En Route',done:true},{label:'Out for Delivery',done:true},{label:'POD Confirmed',done:true}],
  pending:   [{label:'Order Created',done:true},{label:'Awaiting Driver',active:true},{label:'Picked Up',pending:true},{label:'En Route',pending:true},{label:'Delivered',pending:true}],
  delayed:   [{label:'Order Created',done:true},{label:'Driver Assigned',done:true},{label:'Picked Up',done:true},{label:'Delay — Traffic/Road',done:true,warn:true},{label:'En Route',active:true},{label:'Delivered',pending:true}],
  customs:   [{label:'Order Created',done:true},{label:'Driver Assigned',done:true},{label:'En Route',active:true},{label:'Out for Delivery',pending:true},{label:'Delivered',pending:true}],
};

function getTimeline(s: Shipment): TimelineStep[] {
  const map = s.type === 'international' ? TIMELINE_INT : TIMELINE_DOM;
  return map[s.status] || map.transit;
}

/* ─── Mode icon ──────────────────────────────────────────────────────────── */
function ModeIcon({ mode }: { mode: string }) {
  const s: React.CSSProperties = { width: 14, height: 14 };
  if (mode === 'Air')  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={s}><path d="M2 10l2-4 2 2 7-4 1 2-7 3 1 4-2 1-2-3-4 1z"/></svg>;
  if (mode === 'Sea')  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={s}><path d="M2 11l2-5h10l2 5H2z"/><path d="M5 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M1 14s3 2 8 2 8-2 8-2"/></svg>;
  if (mode === 'Rail') return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={s}><rect x="2" y="2" width="14" height="10" rx="2"/><path d="M2 8h14"/><circle cx="5" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/><path d="M5 12v3M13 12v3M6 15h6"/></svg>;
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={s}><rect x="1" y="5" width="12" height="9" rx="1.5"/><path d="M13 8l3 2v4h-3V8z"/><circle cx="4.5" cy="14" r="1.5"/><circle cx="10.5" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>;
}

/* ─── Horizontal step progress bar ──────────────────────────────────────── */
function Stepper({ steps }: { steps: TimelineStep[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '24px 0 8px', overflowX: 'auto' }}>
      {steps.map((st, i) => {
        const isLast = i === steps.length - 1;
        const color = st.done ? 'var(--green)' : st.active ? 'var(--blue)' : 'var(--bg-4)';
        const lineColor = st.done ? 'var(--green)' : 'var(--bg-4)';
        const textColor = st.done ? 'var(--green)' : st.active ? 'var(--blue)' : 'var(--text-4)';
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70, flexShrink: 0 }}>
              {/* Circle */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', border: `2.5px solid ${color}`,
                background: st.done ? color : st.active ? 'var(--bg-2)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: st.active ? `0 0 0 4px ${color}22` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {st.done ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" style={{ width: 12, height: 12 }}>
                    <path d="M2 6l3 3 5-5"/>
                  </svg>
                ) : st.warn ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ width: 12, height: 12 }}>
                    <path d="M6 3v4M6 9v.5"/>
                  </svg>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.active ? color : 'var(--bg-4)' }}/>
                )}
              </div>
              {/* Label */}
              <div style={{ fontSize: 10, textAlign: 'center', marginTop: 6, color: textColor, fontWeight: st.active ? 600 : 400, lineHeight: 1.3, maxWidth: 65 }}>
                {st.label}
              </div>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div style={{ flex: 1, height: 2.5, background: lineColor, marginTop: 13, minWidth: 20, borderRadius: 2, transition: 'background 0.3s' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Detail row ─────────────────────────────────────────────────────────── */
function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="dp-row">
      <span className="dp-key">{label}</span>
      <span className="dp-val" style={accent ? { color: 'var(--blue)' } : {}}>{value || '—'}</span>
    </div>
  );
}

const MODE_COLOR: Record<string, string> = { Air: 'var(--purple)', Sea: 'var(--blue)', Road: 'var(--amber)', Rail: 'var(--green)' };

const ALL_COLS = [
  { key: 'awb',      label: 'AWB / ID',  always: true },
  { key: 'customer', label: 'Customer',  always: true },
  { key: 'route',    label: 'Route',     always: false },
  { key: 'type',     label: 'Type',      always: false },
  { key: 'mode',     label: 'Mode',      always: false },
  { key: 'weight',   label: 'Weight',    always: false },
  { key: 'pieces',   label: 'Pieces',    always: false },
  { key: 'eta',      label: 'ETA',       always: false },
  { key: 'created',  label: 'Created',   always: false },
  { key: 'status',   label: 'Status',    always: true },
];
const DEFAULT_VISIBLE = new Set(['awb','customer','route','mode','weight','created','status']);

/* ─── Recent shipments panel (grid / list) ───────────────────────────────── */
function RecentShipments({ recentSearches, onPick }: { recentSearches: Shipment[]; onPick: (s: Shipment) => void }) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(DEFAULT_VISIBLE));
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const rows = recentSearches.slice(0, 5);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggleCol(key: string) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const activeCols = ALL_COLS.filter(c => c.always || visibleCols.has(c.key));

  /* ── Grid card ── */
  function GridCard({ s }: { s: Shipment }) {
    const steps = getTimeline(s);
    const done = steps.filter(st => st.done).length;
    const pct = Math.round((done / steps.length) * 100);
    const statusColor = { transit:'var(--amber)', delivered:'var(--green)', pending:'var(--blue)', delayed:'var(--red)', customs:'var(--purple)' }[s.status] || 'var(--blue)';
    return (
      <div onClick={() => onPick(s)} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
        {/* AWB + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{s.awbNumber || s.id}</div>
          <Badge variant={s.status}>{STATUS_LABEL[s.status]}</Badge>
        </div>
        {/* Customer */}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.customer}</div>
        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-3)', marginBottom: 12 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.origin}</span>
          <svg viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 14, flexShrink: 0 }}><path d="M1 4h12M9 1l3 3-3 3"/></svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dest}</span>
        </div>
        {/* Progress */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: MODE_COLOR[s.mode] || 'var(--text-3)', fontWeight: 500 }}>
              <ModeIcon mode={s.mode}/>{s.mode}
            </span>
            <span style={{ color: statusColor, fontWeight: 600 }}>{pct}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: statusColor }}/></div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-3)', marginTop: 6 }}>
          <span>{s.weight.toLocaleString()} kg{s.pieces ? ` · ${s.pieces} pcs` : ''}</span>
          <span>ETA {fmtDate(s.eta)}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>
          Recent Shipments <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>— click to track</span>
        </span>

        {/* Column toggle (list only) */}
        {view === 'list' && (
          <div style={{ position: 'relative' }} ref={colMenuRef}>
            <button className="btn" style={{ fontSize: 11, padding: '4px 10px', gap: 5 }} onClick={() => setShowColMenu(p => !p)}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 12, height: 12 }}><path d="M1 3h12M3 7h8M5 11h4"/></svg>
              Columns
            </button>
            {showColMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 0', zIndex: 50, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
                {ALL_COLS.filter(c => !c.always).map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: 'var(--blue)' }}/>
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 7, padding: 2, gap: 2 }}>
          {(['list','grid'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '4px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: view === v ? 'var(--bg-2)' : 'transparent', color: view === v ? 'var(--text-1)' : 'var(--text-3)', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.15)' : 'none', display: 'flex', alignItems: 'center', transition: 'all .15s' }}>
              {v === 'list'
                ? <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M1 3h12M1 7h12M1 11h12"/></svg>
                : <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 14, height: 14 }}><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No shipments yet — create one to see it here.
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {view === 'grid' && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, padding: 20 }}>
          {rows.map(s => <GridCard key={s.id} s={s} />)}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && rows.length > 0 && (
        <div>
          {/* Column header */}
          <div style={{ display: 'grid', gridTemplateColumns: `${activeCols.map(c => c.key === 'awb' ? '148px' : c.key === 'status' ? '110px' : '1fr').join(' ')} 28px`, gap: 12, padding: '8px 20px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
            {activeCols.map(c => (
              <div key={c.key} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{c.label}</div>
            ))}
            <div/>
          </div>

          {/* Rows */}
          {rows.map((s, i) => (
            <div key={s.id} onClick={() => onPick(s)}
              style={{ display: 'grid', gridTemplateColumns: `${activeCols.map(c => c.key === 'awb' ? '148px' : c.key === 'status' ? '110px' : '1fr').join(' ')} 28px`, gap: 12, padding: '13px 20px', alignItems: 'center', cursor: 'pointer', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              {activeCols.map(c => (
                <div key={c.key} style={{ minWidth: 0 }}>
                  {c.key === 'awb'      && <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', letterSpacing: .5 }}>{s.awbNumber || s.id}</span>}
                  {c.key === 'customer' && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{s.customer}</span>}
                  {c.key === 'route'    && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.origin}</span><svg viewBox="0 0 14 8" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ width: 14, flexShrink: 0 }}><path d="M1 4h12M9 1l3 3-3 3"/></svg><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dest}</span></span>}
                  {c.key === 'type'     && <span style={{ fontSize: 11.5 }}>{s.type === 'international' ? '🌐 Intl' : '🏠 Domestic'}</span>}
                  {c.key === 'mode'     && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MODE_COLOR[s.mode] || 'var(--text-3)', fontWeight: 500 }}><ModeIcon mode={s.mode}/>{s.mode}</span>}
                  {c.key === 'weight'   && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.weight.toLocaleString()} kg</span>}
                  {c.key === 'pieces'   && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.pieces ?? '—'}</span>}
                  {c.key === 'eta'      && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(s.eta)}</span>}
                  {c.key === 'created'  && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDate(s.created)}</span>}
                  {c.key === 'status'   && <Badge variant={s.status}>{STATUS_LABEL[s.status]}</Badge>}
                </div>
              ))}
              <svg viewBox="0 0 8 14" fill="none" stroke="var(--text-4)" strokeWidth="1.6" strokeLinecap="round" style={{ width: 8 }}><path d="M1 1l6 6-6 6"/></svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Tracking() {
  const { shipments, companySettings } = useApp();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<Shipment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function doSearch(q: string) {
    const norm = q.trim().toLowerCase().replace(/\s/g, '');
    if (!norm) return;
    const found = shipments.find(s =>
      (s.awbNumber?.toLowerCase().replace(/\s/g, '') === norm) ||
      (s.id.toLowerCase() === norm) ||
      s.customer.toLowerCase().includes(norm)
    ) ?? null;
    setResult(found);
    setSearched(true);
  }

  function handleSearch() { doSearch(query); }
  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter') handleSearch(); }

  function pickRecent(s: Shipment) {
    setQuery(s.awbNumber || s.id);
    setResult(s);
    setSearched(true);
  }

  const steps = result ? getTimeline(result) : [];
  const doneCount = steps.filter(s => s.done).length;
  const progressPct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const recentShipments = shipments.slice(0, 5);

  const statusColors: Record<string, string> = {
    transit: 'var(--amber)', delivered: 'var(--green)', pending: 'var(--blue)',
    delayed: 'var(--red)', customs: 'var(--purple)',
  };

  return (
    <div className="content">

      {/* ── SEARCH CARD ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Icon */}
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 18 18" fill="none" stroke="var(--blue)" strokeWidth="1.7" strokeLinecap="round" style={{ width: 18, height: 18 }}>
              <circle cx="8" cy="8" r="6"/><path d="M13 13l4 4"/>
              <path d="M6 8h4M8 6v4"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>Shipment Tracker</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Look up any shipment by AWB number, ID, or customer name</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter AWB number, tracking ID or customer name…"
              value={query}
              onChange={e => { setQuery(e.target.value); if (searched) { setSearched(false); setResult(null); } }}
              onKeyDown={handleKey}
            />
            {query && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '0 6px', display: 'flex', alignItems: 'center' }}
                onClick={() => { setQuery(''); setSearched(false); setResult(null); inputRef.current?.focus(); }}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 12, height: 12 }}><path d="M1 1l10 10M11 1L1 11"/></svg>
              </button>
            )}
          </div>
          <button className="btn primary" onClick={handleSearch} style={{ paddingLeft: 20, paddingRight: 20, gap: 7 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={{ width: 13, height: 13 }}>
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
            </svg>
            Track
          </button>
        </div>
      </div>

      {/* ── NOT FOUND ───────────────────────────────────────────────── */}
      {searched && !result && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No shipment found</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 320, margin: '0 auto' }}>
            No results for <strong>"{query}"</strong>. Try a different AWB number, ID or customer name.
          </div>
        </div>
      )}

      {/* ── RESULT ──────────────────────────────────────────────────── */}
      {result && (() => {
        const con = result.consignor;
        const cee = result.consignee;
        const statusColor = statusColors[result.status] || 'var(--blue)';

        return (
          <>
            {/* Header card */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 1, color: 'var(--text-1)' }}>
                      {result.awbNumber || result.id}
                    </div>
                    <Badge variant={result.status}>{STATUS_LABEL[result.status]}</Badge>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: result.type === 'international' ? 'var(--blue-dim)' : 'var(--green-dim)', color: result.type === 'international' ? 'var(--blue)' : 'var(--green)' }}>
                      {result.type === 'international' ? '🌐 International' : '🏠 Domestic'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{result.customer}</span>
                    &nbsp;·&nbsp;Created {fmtDate(result.created)}
                    &nbsp;·&nbsp;
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ModeIcon mode={result.mode}/> {result.mode}
                    </span>
                  </div>
                </div>

                {/* ETA chip */}
                <div style={{ textAlign: 'right', background: 'var(--bg-3)', borderRadius: 10, padding: '10px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
                    {result.status === 'delivered' ? 'Delivered' : 'ETA'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtDate(result.eta)}</div>
                </div>
              </div>

              {/* Route bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px', padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 10 }}>
                {/* Origin */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{result.originCountry}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.origin}</div>
                </div>

                {/* Progress track */}
                <div style={{ flex: 1, position: 'relative', margin: '0 8px' }}>
                  <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 3, overflow: 'visible', position: 'relative' }}>
                    <div style={{ height: '100%', background: statusColor, borderRadius: 3, width: `${progressPct}%`, transition: 'width 0.6s ease' }}/>
                    {/* Dot on progress point */}
                    <div style={{
                      position: 'absolute', top: '50%', left: `${progressPct}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 12, height: 12, borderRadius: '50%',
                      background: result.status === 'delivered' ? 'var(--green)' : statusColor,
                      border: '2.5px solid var(--bg-2)',
                      boxShadow: `0 0 0 3px ${statusColor}33`,
                    }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text-3)' }}>
                    <span>Departed</span>
                    <span style={{ color: statusColor, fontWeight: 600 }}>{progressPct}% complete</span>
                    <span>Arrived</span>
                  </div>
                </div>

                {/* Destination */}
                <div style={{ minWidth: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{result.destCountry}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.dest}</div>
                </div>
              </div>

              {/* Horizontal stepper */}
              <Stepper steps={steps} />
            </div>

            {/* Two columns: timeline | details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14, alignItems: 'start' }}>

              {/* LEFT – Timeline */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)' }}>Tracking Timeline</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{doneCount}/{steps.length} steps</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, background: 'var(--bg-4)' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: statusColor, transition: 'width 0.5s ease' }}/>
                </div>
                <div className="timeline" style={{ paddingTop: 8, paddingBottom: 8 }}>
                  {steps.map((st, i) => (
                    <div key={i} className="tl-item">
                      <div className={`tl-dot${st.done ? ' done' : st.active ? ' active' : ' pending'}`}/>
                      <div className="tl-body">
                        <div className="tl-label" style={st.warn ? { color: 'var(--amber)' } : st.active ? { color: statusColor, fontWeight: 600 } : {}}>
                          {st.label}
                          {st.active && (
                            <span style={{ marginLeft: 7, fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${statusColor}20`, color: statusColor, fontWeight: 600 }}>
                              Current
                            </span>
                          )}
                        </div>
                        <div className="tl-meta">
                          {st.done
                            ? (i === 0 ? fmtDate(result.created) : 'Completed')
                            : st.active ? 'In progress'
                            : 'Awaiting'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT – Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Shipment info */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)' }}>Shipment Details</span>
                  </div>
                  {/* Mini stat chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Mode',   value: result.mode },
                      { label: 'Pieces', value: result.pieces ?? '—' },
                      { label: 'Weight', value: result.weight ? `${result.weight} kg` : '—' },
                      { label: 'Cargo',  value: result.cargoType },
                    ].map((item, i) => (
                      <div key={item.label} style={{ padding: '10px 12px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="dp-section" style={{ marginTop: 0 }}>
                    <Row label="Customer"       value={result.customer} />
                    {result.contents && <Row label="Contents"      value={result.contents} />}
                    {result.declaredValue && <Row label="Declared Value" value={result.declaredValue} />}
                    {result.insurance && result.insurance !== '—' && <Row label="Insurance" value={result.insurance} />}
                    {result.notes && <Row label="Notes"         value={result.notes} />}
                  </div>
                </div>

                {/* Consignor */}
                {con ? (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)' }}>Consignor (Sender)</span>
                    </div>
                    <div className="dp-section" style={{ marginTop: 0 }}>
                      <Row label="Company"  value={con.companyName} />
                      <Row label="Contact"  value={con.contactName} />
                      <Row label="Address"  value={`${con.streetAddress}, ${con.cityTown}`} />
                      <Row label="Country"  value={con.country} />
                      <Row label="Tel"      value={con.tel} />
                      <Row label="Email"    value={con.email} accent />
                    </div>
                  </div>
                ) : result.contact ? (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)' }}>Contact</span>
                    </div>
                    <div className="dp-section" style={{ marginTop: 0 }}>
                      <Row label="Name"  value={result.contact} />
                      <Row label="Email" value={result.email} accent />
                      <Row label="Phone" value={result.phone} />
                    </div>
                  </div>
                ) : null}

                {/* Consignee */}
                {cee && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)' }}>Consignee (Recipient)</span>
                    </div>
                    <div className="dp-section" style={{ marginTop: 0 }}>
                      <Row label="Company"  value={cee.companyName} />
                      <Row label="Contact"  value={cee.contactName} />
                      <Row label="Address"  value={`${cee.streetAddress}, ${cee.cityTown}`} />
                      <Row label="Country"  value={cee.country} />
                      <Row label="Tel"      value={cee.tel} />
                      <Row label="Email"    value={cee.email} accent />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        );
      })()}

      {/* ── INITIAL / RECENT ────────────────────────────────────────── */}
      {!searched && (
        <div className="card" style={{ padding: 0, overflow: 'visible', animation: 'fadeUp 0.3s ease both' }}>
          <RecentShipments recentSearches={recentShipments} onPick={pickRecent} />
        </div>
      )}

    </div>
  );
}
