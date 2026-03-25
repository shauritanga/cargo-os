import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

interface Invoice {
  id: string;
  customer: string;
  shipmentRef: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issued: Date;
  due: Date;
  items: { description: string; qty: number; rate: number }[];
}

const INVOICES: Invoice[] = [
  { id: 'INV-2024-001', customer: 'Unilever Ltd', shipmentRef: 'SHG-22401', amount: 12400, currency: 'USD', status: 'paid', issued: new Date('2026-01-10'), due: new Date('2026-02-10'), items: [{ description: 'Sea Freight - Mombasa → Rotterdam', qty: 1, rate: 9800 }, { description: 'Port Handling Fees', qty: 1, rate: 1800 }, { description: 'Documentation', qty: 1, rate: 800 }] },
  { id: 'INV-2024-002', customer: 'DHL Express', shipmentRef: 'SHG-22402', amount: 8750, currency: 'USD', status: 'paid', issued: new Date('2026-01-15'), due: new Date('2026-02-15'), items: [{ description: 'Air Freight - NBI → AMS', qty: 3, rate: 2500 }, { description: 'Customs Clearance', qty: 1, rate: 750 }] },
  { id: 'INV-2024-003', customer: 'Boeing Parts', shipmentRef: 'SHG-22403', amount: 22100, currency: 'USD', status: 'pending', issued: new Date('2026-02-01'), due: new Date('2026-03-01'), items: [{ description: 'Air Freight - NBI → SEA', qty: 2, rate: 9800 }, { description: 'Insurance', qty: 1, rate: 2500 }] },
  { id: 'INV-2024-004', customer: 'Safaricom PLC', shipmentRef: 'DOM-10021', amount: 3200, currency: 'USD', status: 'overdue', issued: new Date('2026-01-05'), due: new Date('2026-02-05'), items: [{ description: 'Road Freight - NBI → MSA', qty: 1, rate: 2800 }, { description: 'Fuel Surcharge', qty: 1, rate: 400 }] },
  { id: 'INV-2024-005', customer: 'Dangote Group', shipmentRef: 'SHG-22405', amount: 18900, currency: 'USD', status: 'pending', issued: new Date('2026-02-10'), due: new Date('2026-03-10'), items: [{ description: 'Sea Freight - DAR → LOS', qty: 5, rate: 3400 }, { description: 'Port Fees', qty: 1, rate: 2400 }] },
  { id: 'INV-2024-006', customer: 'Total Energies', shipmentRef: 'SHG-22406', amount: 6600, currency: 'USD', status: 'paid', issued: new Date('2026-01-20'), due: new Date('2026-02-20'), items: [{ description: 'Rail Freight - NBI → CPT', qty: 2, rate: 3000 }, { description: 'Handling', qty: 1, rate: 600 }] },
  { id: 'INV-2024-007', customer: 'Apple Inc.', shipmentRef: 'SHG-22407', amount: 14500, currency: 'USD', status: 'draft', issued: new Date('2026-03-01'), due: new Date('2026-04-01'), items: [{ description: 'Air Freight - SHG → NBI', qty: 1, rate: 12000 }, { description: 'Customs Brokerage', qty: 1, rate: 2500 }] },
  { id: 'INV-2024-008', customer: 'Vodacom TZ', shipmentRef: 'DOM-10045', amount: 2800, currency: 'USD', status: 'overdue', issued: new Date('2025-12-15'), due: new Date('2026-01-15'), items: [{ description: 'Road Freight - DAR → ARU', qty: 1, rate: 2800 }] },
];

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  paid: 'var(--green)',
  pending: 'var(--amber)',
  overdue: 'var(--red)',
  draft: 'var(--text-3)',
};

const STATUS_BG: Record<InvoiceStatus, string> = {
  paid: 'var(--green-dim)',
  pending: 'var(--amber-dim)',
  overdue: 'var(--red-dim)',
  draft: 'rgba(107,115,133,0.12)',
};

export default function Billing() {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus>('all');
  const [detail, setDetail] = useState<Invoice | null>(null);

  const filtered = INVOICES.filter(inv => {
    const q = search.toLowerCase();
    const matchQ = !q || inv.id.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q) || inv.shipmentRef.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchQ && matchStatus;
  });

  const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const totalAll = INVOICES.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <div className="content">
        {/* STAT CARDS */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <rect x="2" y="4" width="14" height="11" rx="1.5"/>
                  <path d="M2 7h14"/><path d="M6 11h2M10 11h2"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 9.3%</span>
            </div>
            <div className="stat-value">${(totalAll / 1000).toFixed(1)}K</div>
            <div className="stat-label">Total Invoiced</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '100%' }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M2 9l5 5 9-9"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 4.1%</span>
            </div>
            <div className="stat-value">${(totalPaid / 1000).toFixed(1)}K</div>
            <div className="stat-label">Collected</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(totalPaid / totalAll) * 100}%`, background: 'var(--green)' }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="9" cy="9" r="7.5"/><path d="M9 5v4l3 2"/>
                </svg>
              </div>
              <span className="stat-change" style={{ color: 'var(--amber)' }}>Awaiting</span>
            </div>
            <div className="stat-value">${(totalPending / 1000).toFixed(1)}K</div>
            <div className="stat-label">Pending</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(totalPending / totalAll) * 100}%`, background: 'var(--amber)' }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M9 2l1.5 5h5l-4 3 1.5 5L9 12l-4 3 1.5-5-4-3h5z"/>
                </svg>
              </div>
              <span className="stat-change down">↑ overdue</span>
            </div>
            <div className="stat-value">${(totalOverdue / 1000).toFixed(1)}K</div>
            <div className="stat-label">Overdue</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(totalOverdue / totalAll) * 100}%`, background: 'var(--red)' }}/></div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ flex: 1, maxWidth: 300, minWidth: 160 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
              <input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs">
              {(['all','paid','pending','overdue','draft'] as const).map(s => (
                <div key={s} className={`filter-tab${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 4h10M4 7h6M6 10h2"/></svg>
                Export
              </button>
              <button className="btn primary" onClick={() => showToast('New invoice created', 'green')}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                New Invoice
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card" style={{ padding: 0 }}>
          <table className="sh-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Shipment Ref</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => setDetail(inv)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--blue)', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{inv.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>{inv.customer}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{inv.shipmentRef}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>${inv.amount.toLocaleString()}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: STATUS_BG[inv.status], color: STATUS_COLOR[inv.status] }}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{inv.issued.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ color: inv.status === 'overdue' ? 'var(--red)' : 'var(--text-2)', fontSize: 12, fontWeight: inv.status === 'overdue' ? 600 : 400 }}>
                    {inv.due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button className="row-action-btn" onClick={e => { e.stopPropagation(); setDetail(inv); }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 1l6 6-6 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-3)' }}>No invoices found</div>
          )}
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {detail && <div className="drawer-overlay open" onClick={() => setDetail(null)} />}
      {detail && (
        <div className="detail-panel open">
          <div className="dp-header">
            <div>
              <div className="dp-title">{detail.id}</div>
              <div className="dp-sub">{detail.customer} · {detail.shipmentRef}</div>
            </div>
            <button className="dp-close" onClick={() => setDetail(null)}>✕</button>
          </div>
          <div className="dp-body">
            <div className="dp-section">
              <div className="dp-section-title">Invoice Summary</div>
              <div className="dp-row"><span>Status</span><span style={{ color: STATUS_COLOR[detail.status], fontWeight: 600 }}>{detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}</span></div>
              <div className="dp-row"><span>Amount</span><span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 16 }}>${detail.amount.toLocaleString()} {detail.currency}</span></div>
              <div className="dp-row"><span>Issued</span><span>{detail.issued.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
              <div className="dp-row"><span>Due</span><span style={{ color: detail.status === 'overdue' ? 'var(--red)' : 'inherit' }}>{detail.due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
            </div>
            <div className="dp-section">
              <div className="dp-section-title">Line Items</div>
              {detail.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12, gap: 12 }}>
                  <span style={{ color: 'var(--text-2)', flex: 1 }}>{item.description}</span>
                  <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>×{item.qty}</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 500, whiteSpace: 'nowrap' }}>${(item.qty * item.rate).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}>
                <span>Total</span>
                <span style={{ color: 'var(--green)' }}>${detail.amount.toLocaleString()} {detail.currency}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
              {detail.status !== 'paid' && (
                <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { showToast('Invoice marked as paid', 'green'); setDetail(null); }}>Mark as Paid</button>
              )}
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => showToast('Invoice downloaded', 'blue')}>Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
