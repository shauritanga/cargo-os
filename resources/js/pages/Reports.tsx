import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const MONTHLY_SHIPMENTS = [
  { month: 'Jul', value: 68 }, { month: 'Aug', value: 74 }, { month: 'Sep', value: 82 },
  { month: 'Oct', value: 91 }, { month: 'Nov', value: 87 }, { month: 'Dec', value: 95 },
  { month: 'Jan', value: 103 }, { month: 'Feb', value: 89 }, { month: 'Mar', value: 112 },
];

const REVENUE_DATA = [
  { month: 'Jul', value: 42 }, { month: 'Aug', value: 51 }, { month: 'Sep', value: 48 },
  { month: 'Oct', value: 63 }, { month: 'Nov', value: 58 }, { month: 'Dec', value: 71 },
  { month: 'Jan', value: 79 }, { month: 'Feb', value: 66 }, { month: 'Mar', value: 84 },
];

const MODE_SPLIT = [
  { label: 'Sea', value: 42, color: 'var(--blue)' },
  { label: 'Air', value: 28, color: 'var(--purple)' },
  { label: 'Road', value: 22, color: 'var(--amber)' },
  { label: 'Rail', value: 8, color: 'var(--green)' },
];

const TOP_ROUTES = [
  { route: 'Mombasa → Rotterdam', mode: 'Sea', shipments: 34, revenue: '$142K', change: 8.2 },
  { route: 'Nairobi → Dubai', mode: 'Air', shipments: 28, revenue: '$98K', change: 12.4 },
  { route: 'Lagos → Antwerp', mode: 'Sea', shipments: 22, revenue: '$86K', change: -2.1 },
  { route: 'Dar es Salaam → Shanghai', mode: 'Sea', shipments: 19, revenue: '$74K', change: 5.7 },
  { route: 'Nairobi → Johannesburg', mode: 'Road', shipments: 41, revenue: '$61K', change: 3.3 },
  { route: 'Karachi → Amsterdam', mode: 'Sea', shipments: 16, revenue: '$58K', change: 9.1 },
];

const PERF_METRICS = [
  { label: 'On-Time Delivery', value: 94.7, target: 95, color: 'var(--green)' },
  { label: 'Customer Satisfaction', value: 88.3, target: 90, color: 'var(--blue)' },
  { label: 'Fleet Utilization', value: 76.2, target: 80, color: 'var(--amber)' },
  { label: 'Customs Clearance Rate', value: 91.5, target: 95, color: 'var(--purple)' },
];

function BarChart({ data, color = 'var(--blue)' }: { data: { month: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: color, opacity: 0.9, height: `${(d.value / max) * 88}%`, transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)', minHeight: 3 }} />
          <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { shipments } = useApp();
  const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

  const totalShipments = MONTHLY_SHIPMENTS.reduce((s, d) => s + d.value, 0);
  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.value, 0);

  return (
    <div className="content">
      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <rect x="1" y="5" width="12" height="9" rx="1.5"/>
                <path d="M13 8l3 2v4h-3V8z"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 8.4%</span>
          </div>
          <div className="stat-value">{totalShipments}</div>
          <div className="stat-label">Shipments (9mo)</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '72%' }}/></div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M9 2v14M5 6h6a2 2 0 010 4H7a2 2 0 000 4h7"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 11.2%</span>
          </div>
          <div className="stat-value">${totalRevenue}K</div>
          <div className="stat-label">Revenue (9mo)</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '80%', background: 'var(--green)' }}/></div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M2 9l5 5 9-9"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 1.3%</span>
          </div>
          <div className="stat-value">94.7%</div>
          <div className="stat-label">On-Time Rate</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '94.7%', background: 'var(--amber)' }}/></div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="9" cy="9" r="7.5"/>
                <path d="M9 5v4l3 2"/>
              </svg>
            </div>
            <span className="stat-change up">↑ 0.8%</span>
          </div>
          <div className="stat-value">4.8d</div>
          <div className="stat-label">Avg Transit Time</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '60%', background: 'var(--purple)' }}/></div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Shipments Chart */}
        <div className="card" style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>Shipment Volume</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Monthly trend</div>
            </div>
            <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', borderRadius: 7, padding: 3, border: '1px solid var(--border)' }}>
              {(['3m','6m','1y'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: 'none', background: period === p ? 'var(--blue)' : 'transparent', color: period === p ? 'white' : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s' }}>{p}</button>
              ))}
            </div>
          </div>
          <BarChart data={MONTHLY_SHIPMENTS} color="var(--blue)" />
        </div>

        {/* Revenue Chart */}
        <div className="card" style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>Revenue ($K)</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Monthly trend</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.03em' }}>${totalRevenue}K</div>
          </div>
          <BarChart data={REVENUE_DATA} color="var(--green)" />
        </div>
      </div>

      {/* MODE SPLIT + PERFORMANCE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Mode Split */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 4 }}>Shipment by Mode</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Distribution across transport modes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MODE_SPLIT.map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize: 13, color: m.color, fontWeight: 700 }}>{m.value}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-4)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.value}%`, borderRadius: 4, background: m.color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 4 }}>Performance vs Target</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Current period KPIs against goals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {PERF_METRICS.map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, color: m.color, fontWeight: 700 }}>{m.value}%</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>/ {m.target}% target</span>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-4)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.value}%`, borderRadius: 4, background: m.color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: m.value >= m.target ? 'var(--green)' : 'var(--amber)' }}>
                    {m.value >= m.target ? '✓ On target' : `${(m.target - m.value).toFixed(1)}% below target`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP ROUTES */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-1)' }}>Top Performing Routes</div>
        <table className="sh-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Mode</th>
              <th>Shipments</th>
              <th>Revenue</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {TOP_ROUTES.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>{r.route}</td>
                <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--blue-dim)', color: 'var(--blue)' }}>{r.mode}</span></td>
                <td style={{ color: 'var(--text-2)' }}>{r.shipments}</td>
                <td style={{ fontWeight: 600, color: 'var(--green)' }}>{r.revenue}</td>
                <td style={{ color: r.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, fontSize: 12 }}>
                  {r.change >= 0 ? '↑' : '↓'} {Math.abs(r.change)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
