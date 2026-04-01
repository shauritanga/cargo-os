import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { PageId } from "../../types";

interface NavItemProps {
    pageId: PageId;
    label: string;
    badge?: number | string;
    badgeColor?: string;
    icon: React.ReactNode;
}

interface DeferredPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
}

function NavItem({ pageId, label, badge, badgeColor, icon }: NavItemProps) {
    const {
        activePage,
        setActivePage,
        sidebarCollapsed,
        isMobile,
        setSidebarCollapsed,
    } = useApp();
    const isActive = activePage === pageId;
    return (
        <div
            className={`nav-item${isActive ? " active" : ""}`}
            title={sidebarCollapsed ? label : undefined}
            onClick={() => {
                setActivePage(pageId);
                if (isMobile) {
                    setSidebarCollapsed(true);
                }
            }}
        >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
            {badge !== undefined && (
                <span
                    className="nav-badge"
                    style={badgeColor ? { background: badgeColor } : undefined}
                >
                    {badge}
                </span>
            )}
        </div>
    );
}

export default function Sidebar() {
    const {
        sidebarCollapsed,
        shipments,
        bookings,
        setActivePage,
        hasRole,
        currentUser,
        logout,
    } = useApp();

    // PWA install prompt
    const [installPrompt, setInstallPrompt] =
        useState<DeferredPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [accountMenuPos, setAccountMenuPos] = useState({
        left: 0,
        bottom: 0,
    });
    const footerRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const accountMenuStyle = useMemo(
        () => ({
            left: `${accountMenuPos.left}px`,
            bottom: `${accountMenuPos.bottom}px`,
            width: "210px",
        }),
        [accountMenuPos],
    );

    const updateAccountMenuPos = () => {
        if (!footerRef.current) return;

        const rect = footerRef.current.getBoundingClientRect();
        const menuWidth = 240;
        const rawLeft = rect.left;
        const boundedLeft = Math.max(
            8,
            Math.min(rawLeft, window.innerWidth - menuWidth - 8),
        );

        setAccountMenuPos({
            left: boundedLeft,
            bottom: Math.max(8, window.innerHeight - rect.top + 8),
        });
    };

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as DeferredPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", () => {
            setInstalled(true);
            setInstallPrompt(null);
        });
        // If already running as standalone PWA, mark as installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setInstalled(true);
        }
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    useEffect(() => {
        if (!accountMenuOpen) return;

        updateAccountMenuPos();

        const onOutsideClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!target) return;
            if (
                panelRef.current?.contains(target) ||
                footerRef.current?.contains(target)
            ) {
                return;
            }
            setAccountMenuOpen(false);
        };

        const onEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setAccountMenuOpen(false);
            }
        };

        window.addEventListener("resize", updateAccountMenuPos);
        window.addEventListener("scroll", updateAccountMenuPos, true);
        document.addEventListener("mousedown", onOutsideClick);
        document.addEventListener("keydown", onEscape);

        return () => {
            window.removeEventListener("resize", updateAccountMenuPos);
            window.removeEventListener("scroll", updateAccountMenuPos, true);
            document.removeEventListener("mousedown", onOutsideClick);
            document.removeEventListener("keydown", onEscape);
        };
    }, [accountMenuOpen]);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
            setInstalled(true);
            setInstallPrompt(null);
        }
    };

    const handleAccountMenuToggle = () => {
        if (!accountMenuOpen) {
            updateAccountMenuPos();
        }
        setAccountMenuOpen((prev) => !prev);
    };

    const openSettingsTab = (tab: "profile" | "company") => {
        try {
            window.sessionStorage.setItem("cargoos:settings-tab", tab);
        } catch {
            // Ignore storage errors in restricted browser contexts.
        }
        setActivePage("settings");
        window.dispatchEvent(
            new CustomEvent("cargoos:open-settings-tab", { detail: { tab } }),
        );
        setAccountMenuOpen(false);
    };

    const handleLogout = () => {
        setAccountMenuOpen(false);
        void logout();
    };

    const initials =
        (currentUser?.name ?? "")
            .trim()
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "NA";
    const primaryRole = currentUser?.roles?.[0]?.name ?? "User";

    const transitCount = shipments.filter(
        (s) => s.status === "transit" || s.status === "delayed",
    ).length;
    const pendingBookings = bookings.filter(
        (b) => b.status === "new" || b.status === "reviewing",
    ).length;

    return (
        <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="logo-mark">
                    <img
                        src="/logo.png"
                        alt="RTEXPRESS"
                        style={{
                            width: "24px",
                            height: "24px",
                            objectFit: "cover",
                            borderRadius: "50%",
                        }}
                    />
                </div>
                <span className="logo-text">RT EXPRESS</span>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Operations</div>

                <NavItem
                    pageId="dashboard"
                    label="Dashboard"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <rect
                                x="1.5"
                                y="1.5"
                                width="6"
                                height="6"
                                rx="1.5"
                            />
                            <rect
                                x="10.5"
                                y="1.5"
                                width="6"
                                height="6"
                                rx="1.5"
                            />
                            <rect
                                x="1.5"
                                y="10.5"
                                width="6"
                                height="6"
                                rx="1.5"
                            />
                            <rect
                                x="10.5"
                                y="10.5"
                                width="6"
                                height="6"
                                rx="1.5"
                            />
                        </svg>
                    }
                />

                <NavItem
                    pageId="shipments"
                    label="Shipments"
                    badge={transitCount || undefined}
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <path d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
                            <path d="M6 4V2.5A.5.5 0 016.5 2h5a.5.5 0 01.5.5V4" />
                            <path d="M2 8h14" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="tracking"
                    label="Track Shipment"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <circle cx="8" cy="8" r="6" />
                            <path d="M13 13l4 4" />
                            <path d="M6 8h4M8 6v4" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="bookings"
                    label="Bookings"
                    badge={pendingBookings > 0 ? pendingBookings : undefined}
                    badgeColor={
                        pendingBookings > 0 ? "var(--amber)" : undefined
                    }
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <rect x="2" y="3" width="14" height="13" rx="1.5" />
                            <path d="M2 7h14" />
                            <path d="M6 1v4M12 1v4" />
                            <path d="M6 11h2M10 11h2M6 14h2" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="fleet"
                    label="Fleet"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <rect x="1" y="5" width="12" height="9" rx="1.5" />
                            <path d="M13 8l3 2v4h-3V8z" />
                            <circle cx="4.5" cy="14" r="1.5" />
                            <circle cx="10.5" cy="14" r="1.5" />
                            <circle cx="15" cy="14" r="1.5" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="routes"
                    label="Routes"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <circle cx="4" cy="4" r="2" />
                            <circle cx="14" cy="14" r="2" />
                            <path d="M4 6c0 5 10 3 10 8" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="warehouses"
                    label="Warehouses"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <path d="M2 8L9 2l7 6v8H2V8z" />
                            <rect x="7" y="11" width="4" height="5" />
                        </svg>
                    }
                />

                <div className="nav-section-label" style={{ marginTop: 8 }}>
                    Management
                </div>

                <NavItem
                    pageId="customers"
                    label="Customers"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <circle cx="9" cy="6" r="3" />
                            <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="billing"
                    label="Billing"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <rect x="2" y="4" width="14" height="11" rx="1.5" />
                            <path d="M2 8h14" />
                            <path d="M6 12h2M10 12h2" />
                        </svg>
                    }
                />

                <NavItem
                    pageId="reports"
                    label="Reports"
                    icon={
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <path d="M4 14V9M8 14V5M12 14v-3M16 14v-7" />
                        </svg>
                    }
                />

                {hasRole("admin") && (
                    <NavItem
                        pageId="access-control"
                        label="Access Control"
                        icon={
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M9 1l6 2v4c0 4.5-2.6 7.3-6 9-3.4-1.7-6-4.5-6-9V3l6-2z" />
                                <path d="M6.5 8.5L8.5 10.5L12 7" />
                            </svg>
                        }
                    />
                )}

                {hasRole("admin") && (
                    <NavItem
                        pageId="branches"
                        label="Branches"
                        icon={
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M7 4a2 2 0 11-4 0 2 2 0 014 0zM15 9a2 2 0 11-4 0 2 2 0 014 0zM7 14a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path d="M5 6v6M7 4h4a2 2 0 012 2v1M7 14h4a2 2 0 002-2v-1" />
                            </svg>
                        }
                    />
                )}

                {hasRole("admin") && (
                    <NavItem
                        pageId="audit-logs"
                        label="Audit Logs"
                        icon={
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M4 2h10a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                                <path d="M6 6h6M6 9h6M6 12h4" />
                            </svg>
                        }
                    />
                )}
            </nav>

            <div className="sidebar-footer-wrap" ref={footerRef}>
                {accountMenuOpen && (
                    <div
                        ref={panelRef}
                        id="sidebar-account-menu"
                        className="sidebar-account-menu"
                        style={accountMenuStyle}
                    >
                        <div className="account-menu-header">
                            {currentUser?.email ?? "Unknown user"}
                        </div>

                        <button
                            className="account-menu-item"
                            onClick={() => openSettingsTab("profile")}
                        >
                            <span className="account-menu-icon">
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    <circle cx="9" cy="6" r="3" />
                                    <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                                </svg>
                            </span>
                            <span>Profile</span>
                        </button>

                        <button
                            className="account-menu-item"
                            onClick={() => openSettingsTab("company")}
                        >
                            <span className="account-menu-icon">
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    <circle cx="9" cy="9" r="3" />
                                    <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3 3l1.4 1.4M13.6 13.6L15 15M3 15l1.4-1.4M13.6 4.4L15 3" />
                                </svg>
                            </span>
                            <span>Settings</span>
                        </button>

                        <div className="account-menu-divider" />

                        <button
                            className="account-menu-item"
                            onClick={handleLogout}
                        >
                            <span className="account-menu-icon">
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    <path d="M7 3H3v12h4" />
                                    <path d="M11 6l4 3-4 3" />
                                    <path d="M15 9H7" />
                                </svg>
                            </span>
                            <span>Log out</span>
                        </button>
                    </div>
                )}

                <div
                    className={`sidebar-footer${accountMenuOpen ? " open" : ""}`}
                    title={
                        sidebarCollapsed
                            ? (currentUser?.name ?? "Unknown")
                            : undefined
                    }
                    role="button"
                    tabIndex={0}
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    aria-controls="sidebar-account-menu"
                    onClick={handleAccountMenuToggle}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAccountMenuToggle();
                        }
                    }}
                >
                    <div className="avatar sidebar-avatar">{initials}</div>
                    <div className="user-info">
                        <div className="user-name">
                            {currentUser?.name ?? "Unknown"}
                        </div>
                        <div className="user-role">{primaryRole}</div>
                    </div>

                    <div className="sidebar-footer-controls">
                        {installPrompt && !installed && (
                            <button
                                type="button"
                                className="sidebar-footer-icon-btn"
                                title="Install App"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void handleInstall();
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M9 1v10M5 8l4 4 4-4" />
                                    <path d="M2 14v1a1 1 0 001 1h12a1 1 0 001-1v-1" />
                                </svg>
                            </button>
                        )}

                        <span
                            className="sidebar-footer-chevron-stack"
                            aria-hidden="true"
                        >
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            >
                                <path d="M6 10l3-3 3 3" />
                            </svg>
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            >
                                <path d="M6 8l3 3 3-3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
