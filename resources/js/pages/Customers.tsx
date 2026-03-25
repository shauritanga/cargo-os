import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  type: 'Enterprise' | 'SME' | 'Individual';
  status: 'active' | 'inactive';
  shipments: number;
  revenue: string;
  since: Date;
}

const CUSTOMERS: Customer[] = [
  { id: 'C-001', name: 'Unilever Ltd', contact: 'James Omondi', email: 'james@unilever.com', phone: '+254 700 123 456', country: 'Kenya', type: 'Enterprise', status: 'active', shipments: 84, revenue: '$142,500', since: new Date('2021-03-15') },
  { id: 'C-002', name: 'DHL Express', contact: 'Sarah Kimani', email: 'sarah@dhl.com', phone: '+254 722 987 654', country: 'Kenya', type: 'Enterprise', status: 'active', shipments: 212, revenue: '$389,200', since: new Date('2020-07-01') },
  { id: 'C-003', name: 'Boeing Parts', contact: 'Mike Waweru', email: 'mike@boeing.com', phone: '+1 206 555 0100', country: 'USA', type: 'Enterprise', status: 'active', shipments: 47, revenue: '$98,400', since: new Date('2022-01-20') },
  { id: 'C-004', name: 'Apple Inc.', contact: 'Tim Chen', email: 'tim@apple.com', phone: '+1 408 996 1010', country: 'USA', type: 'Enterprise', status: 'active', shipments: 31, revenue: '$77,800', since: new Date('2022-06-10') },
  { id: 'C-005', name: 'Safaricom PLC', contact: 'Grace Njoroge', email: 'grace@safaricom.co.ke', phone: '+254 722 000 100', country: 'Kenya', type: 'Enterprise', status: 'active', shipments: 65, revenue: '$124,600', since: new Date('2021-09-05') },
  { id: 'C-006', name: 'Vodacom TZ', contact: 'Ali Hassan', email: 'ali@vodacom.co.tz', phone: '+255 754 100 200', country: 'Tanzania', type: 'Enterprise', status: 'active', shipments: 38, revenue: '$68,900', since: new Date('2022-03-18') },
  { id: 'C-007', name: 'East Africa Breweries', contact: 'Peter Mwangi', email: 'pmwangi@eabl.com', phone: '+254 733 400 500', country: 'Kenya', type: 'SME', status: 'active', shipments: 22, revenue: '$41,200', since: new Date('2023-01-08') },
  { id: 'C-008', name: 'Jumia Kenya', contact: 'Amina Abdalla', email: 'amina@jumia.co.ke', phone: '+254 711 200 300', country: 'Kenya', type: 'SME', status: 'inactive', shipments: 14, revenue: '$19,800', since: new Date('2023-05-22') },
  { id: 'C-009', name: 'Total Energies', contact: 'Claude Dupont', email: 'claude@total.com', phone: '+33 1 47 44 45 46', country: 'France', type: 'Enterprise', status: 'active', shipments: 56, revenue: '$108,700', since: new Date('2021-11-30') },
  { id: 'C-010', name: 'Dangote Group', contact: 'Emeka Obi', email: 'emeka@dangote.com', phone: '+234 801 234 5678', country: 'Nigeria', type: 'Enterprise', status: 'active', shipments: 73, revenue: '$157,300', since: new Date('2020-12-14') },
  { id: 'C-011', name: 'Nakumatt Holdings', contact: 'Raj Patel', email: 'raj@nakumatt.com', phone: '+254 777 888 999', country: 'Kenya', type: 'SME', status: 'inactive', shipments: 8, revenue: '$12,400', since: new Date('2023-08-01') },
  { id: 'C-012', name: 'Zambia Sugar', contact: 'David Banda', email: 'dbanda@zamsugar.co.zm', phone: '+260 97 123 4567', country: 'Zambia', type: 'SME', status: 'active', shipments: 17, revenue: '$31,600', since: new Date('2022-10-19') },
];

const TYPE_COLOR: Record<string, string> = {
  Enterprise: 'var(--blue)',
  SME: 'var(--purple)',
  Individual: 'var(--amber)',
};

export default function Customers() {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Enterprise' | 'SME' | 'Individual'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [detail, setDetail] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', country: '', type: 'SME' as Customer['type'] });

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
    const matchType = filterType === 'all' || c.type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchQ && matchType && matchStatus;
  });

  const totalRevenue = CUSTOMERS.filter(c => c.status === 'active').reduce((s, c) => s + parseFloat(c.revenue.replace(/[$,]/g, '')), 0);
  const activeCount = CUSTOMERS.filter(c => c.status === 'active').length;
  const totalShipments = CUSTOMERS.reduce((s, c) => s + c.shipments, 0);

  const handleAdd = () => {
    if (!form.name || !form.email) { showToast('Name and email are required', 'red'); return; }
    showToast(`Customer "${form.name}" added`, 'green');
    setShowModal(false);
    setForm({ name: '', contact: '', email: '', phone: '', country: '', type: 'SME' });
  };

  return (
    <>
      <div className="content">
        {/* STAT CARDS */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="9" cy="6" r="3.5"/>
                  <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 5.2%</span>
            </div>
            <div className="stat-value">{CUSTOMERS.length}</div>
            <div className="stat-label">Total Customers</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(activeCount / CUSTOMERS.length) * 100}%` }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M9 2v14M5 6h6a2 2 0 010 4H7a2 2 0 000 4h7"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 12.4%</span>
            </div>
            <div className="stat-value">${(totalRevenue / 1000).toFixed(0)}K</div>
            <div className="stat-label">Total Revenue</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '78%', background: 'var(--green)' }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <rect x="1" y="5" width="12" height="9" rx="1.5"/>
                  <path d="M13 8l3 2v4h-3V8z"/>
                  <circle cx="4.5" cy="14" r="1.5"/><circle cx="10.5" cy="14" r="1.5"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 3.8%</span>
            </div>
            <div className="stat-value">{totalShipments}</div>
            <div className="stat-label">Total Shipments</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '65%', background: 'var(--amber)' }}/></div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5z"/>
                </svg>
              </div>
              <span className="stat-change up">↑ 2.1%</span>
            </div>
            <div className="stat-value">{CUSTOMERS.filter(c => c.type === 'Enterprise').length}</div>
            <div className="stat-label">Enterprise Clients</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '55%', background: 'var(--purple)' }}/></div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ flex: 1, maxWidth: 300, minWidth: 160 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
              <input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs">
              {(['all','active','inactive'] as const).map(s => (
                <div key={s} className={`filter-tab${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              ))}
            </div>
            <select className="sh-select" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
              <option value="all">All Types</option>
              <option value="Enterprise">Enterprise</option>
              <option value="SME">SME</option>
              <option value="Individual">Individual</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={() => setShowModal(true)}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card" style={{ padding: 0 }}>
          <table className="sh-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Country</th>
                <th>Type</th>
                <th>Shipments</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setDetail(c)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-dim)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--blue)', flexShrink: 0 }}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.contact}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.email}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{c.country}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${TYPE_COLOR[c.type]}18`, color: TYPE_COLOR[c.type] }}>{c.type}</span></td>
                  <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{c.shipments}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 500 }}>{c.revenue}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: c.status === 'active' ? 'var(--green-dim)' : 'var(--red-dim)', color: c.status === 'active' ? 'var(--green)' : 'var(--red)' }}>
                      {c.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.since.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td><button className="row-action-btn" onClick={e => { e.stopPropagation(); setDetail(c); }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 1l6 6-6 6"/></svg>
                  </button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-3)' }}>No customers found</div>
          )}
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {detail && <div className="drawer-overlay open" onClick={() => setDetail(null)} />}
      {detail && (
        <div className="detail-panel open">
          <div className="dp-header">
            <div>
              <div className="dp-title">{detail.name}</div>
              <div className="dp-sub">{detail.id} · {detail.type}</div>
            </div>
            <button className="dp-close" onClick={() => setDetail(null)}>✕</button>
          </div>
          <div className="dp-body">
            <div className="dp-section">
              <div className="dp-section-title">Contact Information</div>
              <div className="dp-row"><span>Contact</span><span>{detail.contact}</span></div>
              <div className="dp-row"><span>Email</span><span>{detail.email}</span></div>
              <div className="dp-row"><span>Phone</span><span>{detail.phone}</span></div>
              <div className="dp-row"><span>Country</span><span>{detail.country}</span></div>
            </div>
            <div className="dp-section">
              <div className="dp-section-title">Account Details</div>
              <div className="dp-row"><span>Type</span><span style={{ color: TYPE_COLOR[detail.type] }}>{detail.type}</span></div>
              <div className="dp-row"><span>Status</span><span style={{ color: detail.status === 'active' ? 'var(--green)' : 'var(--red)' }}>{detail.status}</span></div>
              <div className="dp-row"><span>Customer Since</span><span>{detail.since.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
            </div>
            <div className="dp-section">
              <div className="dp-section-title">Statistics</div>
              <div className="dp-row"><span>Total Shipments</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{detail.shipments}</span></div>
              <div className="dp-row"><span>Total Revenue</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{detail.revenue}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Customer</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section-label">Customer Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Company / Name</label>
                  <input className="sh-input" placeholder="e.g. Acme Corp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="sh-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                    <option value="Enterprise">Enterprise</option>
                    <option value="SME">SME</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person</label>
                  <input className="sh-input" placeholder="Full name" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input className="sh-input" placeholder="e.g. Kenya" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input className="sh-input" type="email" placeholder="email@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="sh-input" placeholder="+254 700 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn primary" onClick={handleAdd}>Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
