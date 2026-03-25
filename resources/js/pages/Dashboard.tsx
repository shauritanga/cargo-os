import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Badge from '../components/shared/Badge';
import { fmtDate } from '../data/mock';

const WEEK_VALS = [68, 82, 74, 91, 87, 95, 78, 103];
const WEEK_LABELS = ['W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23'];

export default function Dashboard() {
  const { shipments, setActivePage } = useApp();
  const barsRef = useRef<HTMLDivElement>(null);

  const counts = { transit: 0, delivered: 0, pending: 0, customs: 0, delayed: 0 };
  shipments.forEach(s => { if (s.status in counts) (counts as Record<string, number>)[s.status]++; });

  const onTimeRate = shipments.length
    ? ((shipments.filter(s => s.status === 'delivered').length / shipments.length) * 100).toFixed(1)
    : '94.7';

  const recentShipments = shipments.slice(0, 5);
  const maxVal = Math.max(...WEEK_VALS);

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll<HTMLDivElement>('[data-height]');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bars.forEach((b, i) => {
        b.style.transition = `height 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 0.05}s`;
        b.style.height = b.dataset.height ?? '0%';
      });
    }));
  }, []);

  return (
    <div className="content">
      {/* STAT CARDS */}
      <div className="stat-grid">
        {/* Active Shipments */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <rect x="1" y="5" width="12" height="9" rx="1.5"/>
                <path d="M13 8l3 2v4h-3V8z"/>
                <circle cx="4.5" cy="14" r="1.5"/><circle cx="10.5" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 8.4%</span>
          </div>
          <div className="stat-value">1,284</div>
          <div className="stat-label">Active Shipments</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '72%' }}/></div>
        </div>

        {/* On-time Delivery */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M2 9l5 5 9-9"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 2.1%</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>94.7%</div>
          <div className="stat-label">On-time Delivery</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '94.7%', background: 'var(--green)' }}/></div>
        </div>

        {/* Pending Clearance */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="9" cy="9" r="7"/>
                <path d="M9 5v4l2.5 2.5"/>
              </svg>
            </div>
            <span className="stat-change down">↓ 1.2%</span>
          </div>
          <div className="stat-value">38</div>
          <div className="stat-label">Pending Clearance</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '38%', background: 'var(--amber)' }}/></div>
        </div>

        {/* Revenue This Month */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <rect x="2" y="4" width="14" height="11" rx="1.5"/>
                <path d="M2 8h14M6 2v4M12 2v4"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 12.8%</span>
          </div>
          <div className="stat-value">$2.4M</div>
          <div className="stat-label">Revenue This Month</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '60%', background: 'var(--purple)' }}/></div>
        </div>
      </div>

      {/* CARGO VOLUME + ACTIVE ROUTES */}
      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Cargo Volume</div>
              <div className="card-subtitle">Shipments per week</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Weekly</button>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 12, background: 'var(--blue-dim)', borderColor: 'var(--blue-border)', color: 'var(--blue)' }}>Monthly</button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="bar-chart" ref={barsRef}>
              {WEEK_VALS.map((v, i) => (
                <div key={i} className="bar-col">
                  <div
                    className="bar-fill"
                    style={{ height: 0 }}
                    data-height={`${(v / maxVal * 100).toFixed(1)}%`}
                  />
                  <span className="bar-label">{WEEK_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--blue)' }}/> Dispatched</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green)' }}/> Delivered</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Active Routes</div>
              <div className="card-subtitle">Live corridors</div>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--blue)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setActivePage('routes')}>View all →</span>
          </div>
          <div className="route-list">
            {[
              { name: 'Shanghai → Rotterdam', meta: 'Sea freight · 28 days avg', count: '142', color: 'var(--green)' },
              { name: 'Dubai → New York',     meta: 'Air + sea · 7 days avg',    count: '89',  color: 'var(--blue)' },
              { name: 'Singapore → Los Angeles', meta: 'Sea freight · 22 days avg', count: '61', color: 'var(--amber)' },
              { name: 'Frankfurt → Chicago',  meta: 'Air freight · 2 days avg',  count: '47',  color: 'var(--purple)' },
              { name: 'Dar es Salaam → Mumbai', meta: 'Sea freight · 18 days avg', count: '33', color: 'var(--green)' },
            ].map((r, i) => (
              <div key={i} className="route-item">
                <div className="route-dot" style={{ background: r.color }}/>
                <div className="route-info">
                  <div className="route-name">{r.name}</div>
                  <div className="route-meta">{r.meta}</div>
                </div>
                <span className="route-count">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLEET STATUS + ALERTS + WAREHOUSE CAPACITY */}
      <div className="three-col">
        {/* Fleet Status */}
        <div className="card">
          <div className="card-header"><div className="card-title">Fleet Status</div></div>
          <div className="mini-stat-row">
            <div className="mini-stat">
              <div className="mini-stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="1" y="5" width="12" height="9" rx="1.5"/><path d="M13 8l3 2v4h-3V8z"/><circle cx="4.5" cy="14" r="1.5"/><circle cx="10.5" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-label">Trucks En Route</div><div className="mini-stat-value">48 / 64</div></div>
              <div className="mini-stat-bar-wrap"><div className="mini-stat-bar"><div className="mini-stat-bar-fill" style={{ width: '75%', background: 'var(--green)' }}/></div></div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 2L2 6v10h14V6L9 2z"/><path d="M6 16V10h6v6"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-label">Container Ships</div><div className="mini-stat-value">7 / 12</div></div>
              <div className="mini-stat-bar-wrap"><div className="mini-stat-bar"><div className="mini-stat-bar-fill" style={{ width: '58%' }}/></div></div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 2l1.5 4.5H15l-3.75 2.75 1.5 4.5L9 11 5.25 13.75l1.5-4.5L3 6.5h4.5L9 2z"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-label">Aircraft Cargo</div><div className="mini-stat-value">3 / 5</div></div>
              <div className="mini-stat-bar-wrap"><div className="mini-stat-bar"><div className="mini-stat-bar-fill" style={{ width: '60%', background: 'var(--amber)' }}/></div></div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4M9 12.5v.5"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-label">In Maintenance</div><div className="mini-stat-value">6 vehicles</div></div>
              <div className="mini-stat-bar-wrap"><div className="mini-stat-bar"><div className="mini-stat-bar-fill" style={{ width: '12%', background: 'var(--red)' }}/></div></div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Alerts</div>
            <span className="badge delayed" style={{ fontSize: 11 }}>3 critical</span>
          </div>
          <div className="mini-stat-row">
            <div className="mini-stat" style={{ alignItems: 'flex-start' }}>
              <div className="mini-stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)', marginTop: 2 }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 2L1.5 15h15L9 2z"/><path d="M9 7v4M9 13.5v.5"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-value" style={{ fontSize: 13 }}>Port Congestion</div><div className="mini-stat-label">Rotterdam — 24h delay</div></div>
            </div>
            <div className="mini-stat" style={{ alignItems: 'flex-start' }}>
              <div className="mini-stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', marginTop: 2 }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4M9 12.5v.5"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-value" style={{ fontSize: 13 }}>Customs Hold</div><div className="mini-stat-label">SHG-0091 awaiting docs</div></div>
            </div>
            <div className="mini-stat" style={{ alignItems: 'flex-start' }}>
              <div className="mini-stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)', marginTop: 2 }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 2L1.5 15h15L9 2z"/><path d="M9 7v4M9 13.5v.5"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-value" style={{ fontSize: 13 }}>Temp Exceedance</div><div className="mini-stat-label">Cold chain SG-441 &gt;4°C</div></div>
            </div>
            <div className="mini-stat" style={{ alignItems: 'flex-start' }}>
              <div className="mini-stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', marginTop: 2 }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 6v3l2 2"/></svg>
              </div>
              <div className="mini-stat-body"><div className="mini-stat-value" style={{ fontSize: 13 }}>Route Diversion</div><div className="mini-stat-label">TK-210 rerouted — weather</div></div>
            </div>
          </div>
        </div>

        {/* Warehouse Capacity */}
        <div className="card">
          <div className="card-header"><div className="card-title">Warehouse Capacity</div></div>
          <div className="mini-stat-row">
            {[
              { label: 'Dubai Hub',        pct: 87, color: 'var(--red)' },
              { label: 'Singapore DHL',    pct: 62, color: 'var(--blue)' },
              { label: 'Rotterdam Port',   pct: 45, color: 'var(--green)' },
              { label: "Chicago O'Hare",   pct: 71, color: 'var(--amber)' },
            ].map(w => (
              <div key={w.label} className="mini-stat">
                <div className="mini-stat-body">
                  <div className="mini-stat-label">{w.label}</div>
                  <div className="mini-stat-value">{w.pct}%</div>
                  <div className="mini-stat-bar">
                    <div className="mini-stat-bar-fill" style={{ width: `${w.pct}%`, background: w.color, height: 4, borderRadius: 2 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
