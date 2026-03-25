import React from 'react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

interface NavItemProps {
  pageId: PageId;
  label: string;
  badge?: number | string;
  badgeColor?: string;
  icon: React.ReactNode;
}

function NavItem({ pageId, label, badge, badgeColor, icon }: NavItemProps) {
  const { activePage, setActivePage } = useApp();
  const isActive = activePage === pageId;
  return (
    <div
      className={`nav-item${isActive ? ' active' : ''}`}
      onClick={() => setActivePage(pageId)}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {badge !== undefined && (
        <span className="nav-badge" style={badgeColor ? { background: badgeColor } : undefined}>
          {badge}
        </span>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, shipments, bookings } = useApp();

  const transitCount = shipments.filter(s => s.status === 'transit' || s.status === 'delayed').length;
  const pendingBookings = bookings.filter(b => b.status === 'new' || b.status === 'reviewing').length;

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-mark">
          <img src="/logo.png" alt="RTEXPRESS" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <span className="logo-text">RTEXPRESS</span>
      </div>


      <nav className="sidebar-nav">
        <div className="nav-section-label">Operations</div>

        <NavItem pageId="dashboard" label="Dashboard" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="1.5" y="1.5" width="6" height="6" rx="1.5"/>
            <rect x="10.5" y="1.5" width="6" height="6" rx="1.5"/>
            <rect x="1.5" y="10.5" width="6" height="6" rx="1.5"/>
            <rect x="10.5" y="10.5" width="6" height="6" rx="1.5"/>
          </svg>
        }/>

        <NavItem pageId="shipments" label="Shipments" badge={transitCount || undefined} icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/>
            <path d="M6 4V2.5A.5.5 0 016.5 2h5a.5.5 0 01.5.5V4"/>
            <path d="M2 8h14"/>
          </svg>
        }/>

        <NavItem pageId="bookings" label="Bookings"
          badge={pendingBookings > 0 ? pendingBookings : undefined}
          badgeColor={pendingBookings > 0 ? 'var(--amber)' : undefined}
          icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="2" y="3" width="14" height="13" rx="1.5"/>
            <path d="M2 7h14"/>
            <path d="M6 1v4M12 1v4"/>
            <path d="M6 11h2M10 11h2M6 14h2"/>
          </svg>
        }/>

        <NavItem pageId="fleet" label="Fleet" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="1" y="5" width="12" height="9" rx="1.5"/>
            <path d="M13 8l3 2v4h-3V8z"/>
            <circle cx="4.5" cy="14" r="1.5"/>
            <circle cx="10.5" cy="14" r="1.5"/>
            <circle cx="15" cy="14" r="1.5"/>
          </svg>
        }/>

        <NavItem pageId="routes" label="Routes" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="4" cy="4" r="2"/>
            <circle cx="14" cy="14" r="2"/>
            <path d="M4 6c0 5 10 3 10 8"/>
          </svg>
        }/>

        <NavItem pageId="warehouses" label="Warehouses" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 8L9 2l7 6v8H2V8z"/>
            <rect x="7" y="11" width="4" height="5"/>
          </svg>
        }/>

        <div className="nav-section-label" style={{ marginTop: 8 }}>Management</div>

        <NavItem pageId="customers" label="Customers" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="6" r="3"/>
            <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
          </svg>
        }/>

        <NavItem pageId="billing" label="Billing" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="2" y="4" width="14" height="11" rx="1.5"/>
            <path d="M2 8h14"/>
            <path d="M6 12h2M10 12h2"/>
          </svg>
        }/>

        <NavItem pageId="reports" label="Reports" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 14V9M8 14V5M12 14v-3M16 14v-7"/>
          </svg>
        }/>

        <div className="nav-section-label" style={{ marginTop: 8 }}>System</div>

        <NavItem pageId="settings" label="Settings" icon={
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="9" r="2.5"/>
            <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M3.1 14.9l1.4-1.4M13.5 4.5l1.4-1.4"/>
          </svg>
        }/>
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">AK</div>
        <div className="user-info">
          <div className="user-name">Amir Khalil</div>
          <div className="user-role">Ops Manager</div>
        </div>
      </div>
    </aside>
  );
}
