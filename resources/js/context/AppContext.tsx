import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from "react";
import type {
    AuthUser,
    Shipment,
    Booking,
    FleetVehicle,
    Route,
    Warehouse,
    PageId,
} from "../types";
import {
    fetchBookings,
    fetchFleet,
    fetchRoutes,
    fetchShipments,
    fetchWarehouses,
    logoutApi,
    meApi,
} from "../lib/api";

interface Toast {
    message: string;
    color: "blue" | "green" | "red" | "amber";
}

export type Theme = "dark" | "light" | "rtexpress" | "rtexpress-light";

export interface CompanySettings {
    name: string;
    address: string;
    country: string;
    currency: string;
    dateFormat: string;
    awbPrefix: string;
    awbCounter: number;
}

interface AppState {
    theme: Theme;
    activePage: PageId;
    globalSearch: string;
    sidebarCollapsed: boolean;
    shipments: Shipment[];
    shipmentsLoading: boolean;
    shipmentsError: string | null;
    bookings: Booking[];
    fleet: FleetVehicle[];
    routes: Route[];
    warehouses: Warehouse[];
    toast: Toast | null;
    companySettings: CompanySettings;
    currentUser: AuthUser | null;
    authLoading: boolean;
    authError: string | null;
}

interface AppActions {
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
    setActivePage: (p: PageId) => void;
    setGlobalSearch: React.Dispatch<React.SetStateAction<string>>;
    setSidebarCollapsed: (v: boolean) => void;
    toggleSidebar: () => void;
    setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
    reloadShipments: () => Promise<void>;
    reloadBookings: () => Promise<void>;
    reloadFleet: () => Promise<void>;
    reloadRoutes: () => Promise<void>;
    reloadWarehouses: () => Promise<void>;
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
    setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>>;
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
    showToast: (message: string, color?: Toast["color"]) => void;
    setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
    nextAwbNumber: () => string;
    setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
    hasRole: (roleName: string) => boolean;
    hasPermission: (permissionKey: string) => boolean;
    logout: () => Promise<void>;
    refreshCurrentUser: () => Promise<void>;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [activePage, setActivePage] = useState<PageId>("shipments");
    const [globalSearch, setGlobalSearch] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [shipmentsLoading, setShipmentsLoading] = useState(true);
    const [shipmentsError, setShipmentsError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [fleet, setFleet] = useState<FleetVehicle[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [toast, setToast] = useState<Toast | null>(null);
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        name: "RT EXPRESS",
        address: "Westlands, Nairobi",
        country: "Kenya",
        currency: "TZS",
        dateFormat: "DD/MM/YYYY",
        awbPrefix: "0255",
        awbCounter: 1,
    });
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    const awbCounterRef = React.useRef(1);

    const reloadShipments = useCallback(async () => {
        if (currentUser === null) {
            setShipmentsLoading(false);
            return;
        }

        setShipmentsLoading(true);
        setShipmentsError(null);
        try {
            const data = await fetchShipments();
            setShipments(data);
        } catch (e: any) {
            setShipmentsError(e.message ?? "Failed to load shipments");
        } finally {
            setShipmentsLoading(false);
        }
    }, [currentUser]);

    const reloadBookings = useCallback(async () => {
        if (currentUser === null) {
            return;
        }

        try {
            const data = await fetchBookings();
            setBookings(data);
        } catch {
            setBookings([]);
        }
    }, [currentUser]);

    const reloadFleet = useCallback(async () => {
        if (currentUser === null) {
            return;
        }

        try {
            const data = await fetchFleet();
            setFleet(data);
        } catch {
            setFleet([]);
        }
    }, [currentUser]);

    const reloadRoutes = useCallback(async () => {
        if (currentUser === null) {
            return;
        }

        try {
            const data = await fetchRoutes();
            setRoutes(data);
        } catch {
            setRoutes([]);
        }
    }, [currentUser]);

    const reloadWarehouses = useCallback(async () => {
        if (currentUser === null) {
            return;
        }

        try {
            const data = await fetchWarehouses();
            setWarehouses(data);
        } catch {
            setWarehouses([]);
        }
    }, [currentUser]);

    const refreshCurrentUser = useCallback(async () => {
        setAuthLoading(true);
        setAuthError(null);

        try {
            const user = await meApi();
            setCurrentUser(user);
        } catch (e: any) {
            setCurrentUser(null);
            setAuthError(e?.message ?? "Authentication required");
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCurrentUser();
    }, [refreshCurrentUser]);

    useEffect(() => {
        if (currentUser !== null) {
            reloadShipments();
            reloadBookings();
            reloadFleet();
            reloadRoutes();
            reloadWarehouses();
        }
    }, [
        currentUser,
        reloadShipments,
        reloadBookings,
        reloadFleet,
        reloadRoutes,
        reloadWarehouses,
    ]);

    const nextAwbNumber = useCallback((): string => {
        const counter = awbCounterRef.current;
        awbCounterRef.current += 1;
        setCompanySettings((s) => ({
            ...s,
            awbCounter: awbCounterRef.current,
        }));
        return `${companySettings.awbPrefix}${String(counter).padStart(8, "0")}`;
    }, [companySettings.awbPrefix]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        document.documentElement.setAttribute("data-theme", t);
    }, []);

    const THEME_CYCLE: Theme[] = [
        "dark",
        "light",
        "rtexpress",
        "rtexpress-light",
    ];
    const toggleTheme = useCallback(() => {
        const next =
            THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
        setTheme(next);
    }, [theme, setTheme]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((v) => !v);
    }, []);

    const showToast = useCallback(
        (message: string, color: Toast["color"] = "blue") => {
            setToast({ message, color });
            setTimeout(() => setToast(null), 3000);
        },
        [],
    );

    const hasRole = useCallback(
        (roleName: string) => {
            return (currentUser?.roles ?? []).some(
                (role) => role.name === roleName,
            );
        },
        [currentUser],
    );

    const hasPermission = useCallback(
        (permissionKey: string) => {
            return (currentUser?.effectivePermissions ?? []).includes(
                permissionKey,
            );
        },
        [currentUser],
    );

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } catch {
            // Continue local logout flow even if server call fails.
        }

        setCurrentUser(null);
        window.location.assign("/login");
    }, []);

    return (
        <AppContext.Provider
            value={{
                theme,
                activePage,
                globalSearch,
                sidebarCollapsed,
                shipments,
                shipmentsLoading,
                shipmentsError,
                bookings,
                fleet,
                routes,
                warehouses,
                toast,
                companySettings,
                currentUser,
                authLoading,
                authError,
                setTheme,
                toggleTheme,
                setActivePage,
                setGlobalSearch,
                setSidebarCollapsed,
                toggleSidebar,
                setShipments,
                reloadShipments,
                reloadBookings,
                reloadFleet,
                reloadRoutes,
                reloadWarehouses,
                setBookings,
                setFleet,
                setRoutes,
                setWarehouses,
                showToast,
                setCompanySettings,
                nextAwbNumber,
                setCurrentUser,
                hasRole,
                hasPermission,
                logout,
                refreshCurrentUser,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}
