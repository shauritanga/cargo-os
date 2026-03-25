import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Shipment, Booking, FleetVehicle, Route, Warehouse, PageId } from '../types';
import { genShipments, genBookings, genFleet, ROUTE_DATA, genWarehouses } from '../data/mock';

interface Toast {
  message: string;
  color: 'blue' | 'green' | 'red' | 'amber';
}

export type Theme = 'dark' | 'light' | 'rtexpress' | 'rtexpress-light';

interface AppState {
  theme: Theme;
  activePage: PageId;
  sidebarCollapsed: boolean;
  shipments: Shipment[];
  bookings: Booking[];
  fleet: FleetVehicle[];
  routes: Route[];
  warehouses: Warehouse[];
  toast: Toast | null;
}

interface AppActions {
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setActivePage: (p: PageId) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>>;
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  showToast: (message: string, color?: Toast['color']) => void;
}

const AppContext = createContext<AppState & AppActions | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [activePage, setActivePage] = useState<PageId>('shipments');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>(() => genShipments(48));
  const [bookings, setBookings] = useState<Booking[]>(() => genBookings(22));
  const [fleet, setFleet] = useState<FleetVehicle[]>(() => genFleet(24));
  const [routes, setRoutes] = useState<Route[]>([...ROUTE_DATA]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => genWarehouses());
  const [toast, setToast] = useState<Toast | null>(null);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const THEME_CYCLE: Theme[] = ['dark', 'light', 'rtexpress', 'rtexpress-light'];
  const toggleTheme = useCallback(() => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
    setTheme(next);
  }, [theme, setTheme]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(v => !v);
  }, []);

  const showToast = useCallback((message: string, color: Toast['color'] = 'blue') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      theme, activePage, sidebarCollapsed,
      shipments, bookings, fleet, routes, warehouses, toast,
      setTheme, toggleTheme, setActivePage, setSidebarCollapsed, toggleSidebar,
      setShipments, setBookings, setFleet, setRoutes, setWarehouses, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
