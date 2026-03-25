import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Theme, CompanySettings } from '../context/AppContext';

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: 'dark', label: 'Dark', desc: 'Default dark interface' },
  { value: 'light', label: 'Light', desc: 'Clean light interface' },
  { value: 'rtexpress', label: 'RT Express Dark', desc: 'Navy & red brand theme' },
  { value: 'rtexpress-light', label: 'RT Express Light', desc: 'Light brand theme' },
];

export default function Settings() {
  const { theme, setTheme, showToast, companySettings, setCompanySettings } = useApp();

  const [profile, setProfile] = useState({ name: 'Amir Khalil', email: 'amir@rtexpress.com', phone: '+254 700 000 001', role: 'Ops Manager', timezone: 'Africa/Nairobi' });
  const [company, setCompany] = useState({
    name: companySettings.name,
    address: companySettings.address,
    country: companySettings.country,
    currency: companySettings.currency,
    dateFormat: companySettings.dateFormat,
    awbPrefix: companySettings.awbPrefix,
  });
  const [notif, setNotif] = useState({ emailShipment: true, emailBooking: true, emailInvoice: false, desktopAlerts: true, overdueReminder: true, weeklyReport: true });
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'appearance' | 'notifications' | 'security'>('profile');

  const save = (section: string) => {
    if (section === 'Company') {
      setCompanySettings((prev: CompanySettings) => ({
        ...prev,
        name: company.name,
        address: company.address,
        country: company.country,
        currency: company.currency,
        dateFormat: company.dateFormat,
        awbPrefix: company.awbPrefix,
      }));
    }
    showToast(`${section} settings saved`, 'green');
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>
    )},
    { id: 'company' as const, label: 'Company', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M5 4V3a3 3 0 016 0v1"/><path d="M8 9v2"/><circle cx="8" cy="8" r="1"/></svg>
    )},
    { id: 'appearance' as const, label: 'Appearance', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 1.5v13M1.5 8h13"/></svg>
    )},
    { id: 'notifications' as const, label: 'Notifications', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>
    )},
    { id: 'security' as const, label: 'Security', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 1L2 4v5c0 3.5 2.7 6 6 7 3.3-1 6-3.5 6-7V4L8 1z"/></svg>
    )},
  ];

  return (
    <div className="content">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>

        {/* SIDEBAR NAV */}
        <div className="card" style={{ padding: '8px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 7,
              background: activeTab === t.id ? 'var(--blue-dim)' : 'transparent',
              color: activeTab === t.id ? 'var(--blue)' : 'var(--text-2)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              transition: 'background 0.2s, color 0.2s',
            }}>
              <span style={{ width: 16, height: 16, flexShrink: 0 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENT PANEL */}
        <div className="card" style={{ padding: '24px' }}>

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>Profile Settings</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Manage your personal information</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{profile.role}</div>
                </div>
                <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => showToast('Photo upload coming soon', 'blue')}>Change Photo</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="sh-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input className="sh-input" value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="sh-input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="sh-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select className="sh-input" value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>
              <button className="btn primary" onClick={() => save('Profile')}>Save Changes</button>
            </>
          )}

          {/* COMPANY */}
          {activeTab === 'company' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>Company Settings</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Configure your organization details</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input className="sh-input" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input className="sh-input" value={company.country} onChange={e => setCompany(c => ({ ...c, country: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input className="sh-input" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Default Currency</label>
                  <select className="sh-input" value={company.currency} onChange={e => setCompany(c => ({ ...c, currency: e.target.value }))}>
                    <option value="USD">USD — US Dollar</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="TZS">TZS — Tanzanian Shilling</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select className="sh-input" value={company.dateFormat} onChange={e => setCompany(c => ({ ...c, dateFormat: e.target.value }))}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Airwaybill Prefix</label>
                  <input className="sh-input" value={company.awbPrefix} maxLength={8} placeholder="e.g. 02019" onChange={e => setCompany(c => ({ ...c, awbPrefix: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    AWB numbers will be generated as: <strong>{company.awbPrefix || '02019'} 0000001</strong>
                  </div>
                </div>
              </div>
              <button className="btn primary" onClick={() => save('Company')}>Save Changes</button>
            </>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>Appearance</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Choose your preferred theme</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {THEMES.map(t => (
                  <button key={t.value} onClick={() => { setTheme(t.value); showToast(`Theme changed to ${t.label}`, 'blue'); }} style={{
                    padding: '14px 16px', borderRadius: 10, border: `2px solid ${theme === t.value ? 'var(--blue)' : 'var(--border-strong)'}`,
                    background: theme === t.value ? 'var(--blue-dim)' : 'var(--bg-3)',
                    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s, background 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: theme === t.value ? 'var(--blue)' : 'var(--text-1)' }}>{t.label}</span>
                      {theme === t.value && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', display: 'block' }} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>Notifications</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Control what alerts you receive</div>

              {[
                { key: 'emailShipment', label: 'Shipment Status Updates', desc: 'Get notified when shipment status changes' },
                { key: 'emailBooking', label: 'New Booking Requests', desc: 'Alert when new booking arrives' },
                { key: 'emailInvoice', label: 'Invoice Reminders', desc: 'Reminders for pending and overdue invoices' },
                { key: 'desktopAlerts', label: 'Desktop Notifications', desc: 'Show browser desktop notifications' },
                { key: 'overdueReminder', label: 'Overdue Shipment Alerts', desc: 'Alert when shipments pass their ETA' },
                { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Receive a weekly performance digest' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: 13 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: notif[item.key as keyof typeof notif] ? 'var(--blue)' : 'var(--bg-4)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', top: 3, left: notif[item.key as keyof typeof notif] ? 20 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', display: 'block',
                    }} />
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <button className="btn primary" onClick={() => save('Notification')}>Save Preferences</button>
              </div>
            </>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>Security</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Manage your account security settings</div>

              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 16, fontSize: 13 }}>Change Password</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input className="sh-input" type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input className="sh-input" type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input className="sh-input" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <button className="btn primary" style={{ marginTop: 12 }} onClick={() => save('Password')}>Update Password</button>
              </div>

              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Add an extra layer of security to your account</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--red-dim)', color: 'var(--red)' }}>Disabled</span>
                </div>
                <button className="btn" onClick={() => showToast('2FA setup coming soon', 'blue')}>Enable 2FA</button>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13, marginBottom: 12 }}>Active Sessions</div>
                {[
                  { device: 'Chrome on macOS', location: 'Nairobi, Kenya', time: 'Now', current: true },
                  { device: 'Safari on iPhone', location: 'Nairobi, Kenya', time: '2 hours ago', current: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>{s.device} {s.current && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: 'var(--green-dim)', color: 'var(--green)', marginLeft: 6 }}>Current</span>}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.location} · {s.time}</div>
                    </div>
                    {!s.current && <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => showToast('Session revoked', 'amber')}>Revoke</button>}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
