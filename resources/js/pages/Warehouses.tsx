import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Badge from '../components/shared/Badge';

export default function Warehouses() {
  const { warehouses } = useApp();
  const [typeFilter, setTypeFilter] = useState('all');
  const [capFilter, setCapFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfCity, setWfCity] = useState('');
  const [wfCountry, setWfCountry] = useState('TZ');
  const [wfType, setWfType] = useState('General');
  const [wfCapacity, setWfCapacity] = useState('');
  const [wfTemp, setWfTemp] = useState('');
  const [wfZones, setWfZones] = useState('');
  const [wfManager, setWfManager] = useState('');
  const [wfPhone, setWfPhone] = useState('');

  const filtered = useMemo(() => warehouses.filter(w => {
    if (typeFilter !== 'all' && w.type !== typeFilter) return false;
    const fillPct = (w.usedSqm / Math.max(1, w.capacitySqm)) * 100;
    if (capFilter === 'critical' && fillPct <= 85) return false;
    if (capFilter === 'high' && (fillPct <= 70 || fillPct > 85)) return false;
    if (capFilter === 'normal' && fillPct >= 70) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${w.name} ${w.city} ${w.country} ${w.type}`.toLowerCase().includes(q)) return false;
    return true;
  }), [warehouses, typeFilter, capFilter, search]);

  const detail = detailId ? warehouses.find(w => w.id === detailId) ?? null : null;

  const kpis = useMemo(() => {
    const avgFill = warehouses.reduce((a, w) => a + (w.usedSqm / Math.max(1, w.capacitySqm)) * 100, 0) / Math.max(1, warehouses.length);
    const totalSpace = warehouses.reduce((a, w) => a + w.capacitySqm, 0);
    const critical = warehouses.filter(w => (w.usedSqm / Math.max(1, w.capacitySqm)) * 100 > 85).length;
    return { total: warehouses.length, avgFill: avgFill.toFixed(0), totalSpace, critical };
  }, [warehouses]);

  return (
    <>
    <div className="content">
      {/* KPI ROW */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14 }}>
        {[
          { label:'Total Warehouses', value:kpis.total, color:'var(--blue)', icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 8L9 2l7 6v8H2V8z"/><rect x="7" y="11" width="4" height="5"/></svg> },
          { label:'Avg Capacity Used', value:`${kpis.avgFill}%`, color:'var(--amber)', icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M2 8h14M6 12h6"/></svg> },
          { label:'Total Capacity (m²)', value:kpis.totalSpace.toLocaleString(), color:'var(--green)', icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M6 9h6M9 6v6"/></svg> },
          { label:'Near Capacity (>85%)', value:kpis.critical, color:'var(--red)', icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 2L1.5 15h15L9 2z"/><path d="M9 7v4M9 13v.5"/></svg> },
        ].map(item => (
          <div key={item.label} className="stat-card" style={{ padding:'14px 18px',animation:'none' }}>
            <div className="stat-top" style={{ marginBottom:6 }}>
              <div className="stat-icon" style={{ background:`${item.color}20`,color:item.color,width:28,height:28 }}>{item.icon}</div>
            </div>
            <div className="stat-value" style={{ fontSize:22,color:item.label.includes('Capacity Used')||item.label.includes('Near')?item.color:undefined }}>{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="card" style={{ overflow:'visible' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 16px',flexWrap:'wrap' }}>
          <div className="search-wrap" style={{ flex:1,maxWidth:260,minWidth:160 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
            <input type="text" placeholder="Search warehouse, city…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="sh-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option>General</option><option>Cold Storage</option><option>Hazardous</option><option>Bonded</option>
          </select>
          <select className="sh-select" value={capFilter} onChange={e => setCapFilter(e.target.value)}>
            <option value="all">All Capacity</option>
            <option value="critical">Critical (&gt;85%)</option>
            <option value="high">High (70-85%)</option>
            <option value="normal">Normal (&lt;70%)</option>
          </select>
          <div style={{ marginLeft:'auto',display:'flex',gap:8,alignItems:'center' }}>
            <div className="view-toggle">
              <button className={`view-btn${view==='grid'?' active':''}`} onClick={() => setView('grid')} title="Grid">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>
              </button>
              <button className={`view-btn${view==='list'?' active':''}`} onClick={() => setView('list')} title="List">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1 3h12M1 7h12M1 11h12"/></svg>
              </button>
            </div>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
              Add Warehouse
            </button>
          </div>
        </div>
      </div>

      {/* GRID / LIST */}
      {view === 'grid' ? (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14 }}>
          {filtered.map(w => {
            const fillPct = Math.round((w.usedSqm / Math.max(1, w.capacitySqm)) * 100);
            const fillColor = fillPct > 85 ? 'var(--red)' : fillPct > 70 ? 'var(--amber)' : 'var(--green)';
            return (
              <div key={w.id} className="wh-card" style={{ cursor:'pointer' }} onClick={() => setDetailId(w.id)}>
                <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--blue)',marginBottom:2 }}>{w.id}</div>
                    <div style={{ fontSize:14,fontWeight:600 }}>{w.name}</div>
                    <div style={{ fontSize:12,color:'var(--text-3)',marginTop:1 }}>{w.city}, {w.country}</div>
                  </div>
                  <Badge variant={w.status==='operational'?'active-v':w.status==='maintenance'?'maint':'retired-v'}>
                    {w.status.charAt(0).toUpperCase()+w.status.slice(1)}
                  </Badge>
                </div>
                <div style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12 }}>
                    <span style={{ color:'var(--text-3)' }}>Capacity Used</span>
                    <span style={{ fontWeight:600,color:fillColor }}>{fillPct}%</span>
                  </div>
                  <div className="cap-bar"><div className="cap-fill" style={{ width:`${fillPct}%`,background:fillColor }}/></div>
                  <div className="wh-stat-row">
                    <div className="wh-stat"><div className="wh-stat-val">{w.capacitySqm.toLocaleString()}</div><div className="wh-stat-lbl">Total m²</div></div>
                    <div className="wh-stat"><div className="wh-stat-val">{w.activeLoads}</div><div className="wh-stat-lbl">Active Loads</div></div>
                    <div className="wh-stat"><div className="wh-stat-val" style={{ fontSize:13 }}>{w.type}</div><div className="wh-stat-lbl">Type</div></div>
                    <div className="wh-stat"><div className="wh-stat-val" style={{ fontSize:13 }}>{w.manager}</div><div className="wh-stat-lbl">Manager</div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ overflow:'hidden' }}>
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead><tr>
                <th>ID</th><th>Name</th><th>Location</th><th>Type</th>
                <th>Capacity (m²)</th><th>Used</th><th>Fill %</th>
                <th>Active Loads</th><th>Manager</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(w => {
                  const fillPct = Math.round((w.usedSqm / Math.max(1, w.capacitySqm)) * 100);
                  const fillColor = fillPct > 85 ? 'var(--red)' : fillPct > 70 ? 'var(--amber)' : 'var(--green)';
                  return (
                    <tr key={w.id} onClick={() => setDetailId(w.id)}>
                      <td className="mono">{w.id}</td>
                      <td>{w.name}</td>
                      <td style={{ fontSize:12 }}>{w.city}, {w.country}</td>
                      <td style={{ fontSize:12 }}>{w.type}</td>
                      <td>{w.capacitySqm.toLocaleString()}</td>
                      <td>{w.usedSqm.toLocaleString()}</td>
                      <td><span style={{ color:fillColor,fontWeight:600 }}>{fillPct}%</span></td>
                      <td>{w.activeLoads}</td>
                      <td style={{ fontSize:12 }}>{w.manager}</td>
                      <td><Badge variant={w.status==='operational'?'active-v':w.status==='maintenance'?'maint':'retired-v'}>
                        {w.status.charAt(0).toUpperCase()+w.status.slice(1)}
                      </Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>

    {/* ADD WAREHOUSE MODAL */}
    {showModal && (
      <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
        <div className="modal" style={{ width:540 }}>
          <div className="modal-header">
            <span className="modal-title">Add Warehouse</span>
            <button className="modal-close" onClick={() => setShowModal(false)}><svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l11 11M12 1L1 12"/></svg></button>
          </div>
          <div className="modal-body">
            <div className="form-divider">Location</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Warehouse Name *</label><input className="form-input" placeholder="e.g. Mwanza Depot" value={wfName} onChange={e => setWfName(e.target.value)}/></div>
              <div className="form-group"><label className="form-label">City *</label><input className="form-input" placeholder="e.g. Mwanza" value={wfCity} onChange={e => setWfCity(e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Country Code</label><input className="form-input" placeholder="TZ" maxLength={2} style={{ textTransform:'uppercase' }} value={wfCountry} onChange={e => setWfCountry(e.target.value.toUpperCase())}/></div>
              <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={wfType} onChange={e => setWfType(e.target.value)}><option>General</option><option>Cold Storage</option><option>Hazardous</option><option>Bonded</option></select></div>
            </div>
            <div className="form-divider">Specs</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Total Capacity (m²)</label><input className="form-input" type="number" placeholder="e.g. 5000" value={wfCapacity} onChange={e => setWfCapacity(e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Temperature Control</label><input className="form-input" placeholder="e.g. Ambient, -20°C to 4°C" value={wfTemp} onChange={e => setWfTemp(e.target.value)}/></div>
            </div>
            <div className="form-row">
              <div className="form-group full"><label className="form-label">Zones (comma-separated)</label><input className="form-input" placeholder="Zone A, Zone B, Loading Dock" value={wfZones} onChange={e => setWfZones(e.target.value)}/></div>
            </div>
            <div className="form-divider">Contact</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Manager Name</label><input className="form-input" placeholder="Full name" value={wfManager} onChange={e => setWfManager(e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="+255 712 000 000" value={wfPhone} onChange={e => setWfPhone(e.target.value)}/></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn primary" onClick={() => setShowModal(false)}>Add Warehouse</button>
          </div>
        </div>
      </div>
    )}

    {/* DRAWER OVERLAY */}
    {detail && <div className="drawer-overlay open" onClick={() => setDetailId(null)} />}

    {/* DETAIL PANEL */}
    {detail && (
      <div className="bk-detail open">
        <div className="dp-header">
          <div>
            <div style={{ fontSize:15,fontWeight:600 }}>{detail.name}</div>
            <div style={{ marginTop:4 }}>
              <Badge variant={detail.status==='operational'?'active-v':detail.status==='maintenance'?'maint':'retired-v'}>
                {detail.status.charAt(0).toUpperCase()+detail.status.slice(1)}
              </Badge>
            </div>
          </div>
          <button className="dp-close" onClick={() => setDetailId(null)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
          </button>
        </div>
        <div className="bk-detail-scroll">
          <div className="dp-section">
            <div className="dp-section-title">General</div>
            <div className="dp-row"><span className="dp-key">ID</span><span className="dp-val mono">{detail.id}</span></div>
            <div className="dp-row"><span className="dp-key">Name</span><span className="dp-val">{detail.name}</span></div>
            <div className="dp-row"><span className="dp-key">Type</span><span className="dp-val">{detail.type}</span></div>
            <div className="dp-row"><span className="dp-key">Location</span><span className="dp-val">{detail.city}, {detail.country}</span></div>
            <div className="dp-row"><span className="dp-key">Address</span><span className="dp-val" style={{ textAlign:'right',maxWidth:180 }}>{detail.address}</span></div>
          </div>
          <div className="dp-section">
            <div className="dp-section-title">Capacity</div>
            {(() => {
              const fillPct = Math.round((detail.usedSqm / Math.max(1, detail.capacitySqm)) * 100);
              const fillColor = fillPct > 85 ? 'var(--red)' : fillPct > 70 ? 'var(--amber)' : 'var(--green)';
              return <>
                <div className="dp-row"><span className="dp-key">Total (m²)</span><span className="dp-val">{detail.capacitySqm.toLocaleString()}</span></div>
                <div className="dp-row"><span className="dp-key">Used (m²)</span><span className="dp-val">{detail.usedSqm.toLocaleString()}</span></div>
                <div className="dp-row"><span className="dp-key">Fill %</span><span className="dp-val" style={{ color:fillColor,fontWeight:600 }}>{fillPct}%</span></div>
                <div style={{ marginTop:8 }}>
                  <div className="cap-bar"><div className="cap-fill" style={{ width:`${fillPct}%`,background:fillColor }}/></div>
                </div>
                <div className="dp-row" style={{ marginTop:10 }}><span className="dp-key">Active Loads</span><span className="dp-val">{detail.activeLoads}</span></div>
              </>;
            })()}
          </div>
          <div className="dp-section">
            <div className="dp-section-title">Contact</div>
            <div className="dp-row"><span className="dp-key">Manager</span><span className="dp-val">{detail.manager}</span></div>
            <div className="dp-row"><span className="dp-key">Phone</span><span className="dp-val">{detail.phone}</span></div>
            <div className="dp-row"><span className="dp-key">Email</span><span className="dp-val" style={{ color:'var(--blue)' }}>{detail.email}</span></div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
