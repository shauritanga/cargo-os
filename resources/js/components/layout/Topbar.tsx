import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import type { Theme } from "../../context/AppContext";

const THEME_LABELS: Record<Theme, string> = {
    dark: "Switch to Light",
    light: "Switch to RT Express Dark",
    rtexpress: "Switch to RT Express Light",
    "rtexpress-light": "Switch to Dark",
};

const PAGE_TITLES: Record<string, string> = {
    dashboard: "Dashboard",
    shipments: "Shipments",
    tracking: "Track Shipment",
    bookings: "Bookings",
    fleet: "Fleet",
    routes: "Routes",
    warehouses: "Warehouses",
    customers: "Customers",
    billing: "Billing",
    reports: "Reports",
    settings: "Settings",
    "access-control": "Access Control",
    placeholder: "Coming Soon",
};

interface TopbarProps {
    onNewShipment: () => void;
}

export default function Topbar({ onNewShipment }: TopbarProps) {
    const { theme, toggleTheme, activePage, toggleSidebar } = useApp();
    const [search, setSearch] = useState("");

    return (
        <header className="topbar">
            <button
                className="icon-btn"
                onClick={toggleSidebar}
                data-tip="Toggle sidebar"
            >
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="1" y="1" width="14" height="14" rx="2" />
                    <path d="M5 1v14" />
                    <path d="M8 5h4M8 8h4M8 11h4" />
                </svg>
            </button>
            <span className="topbar-title">
                {PAGE_TITLES[activePage] ?? activePage}
            </span>
            <div className="topbar-actions">
                <div className="tb-search-wrap">
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                    >
                        <circle cx="7" cy="7" r="5" />
                        <path d="M11 11l3 3" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    className="icon-btn"
                    onClick={toggleTheme}
                    data-tip={THEME_LABELS[theme]}
                >
                    {theme === "dark" && (
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <path d="M8 1a7 7 0 000 14A7 7 0 008 1z" />
                        </svg>
                    )}
                    {theme === "light" && (
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <circle cx="8" cy="8" r="3" />
                            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
                        </svg>
                    )}
                    {(theme === "rtexpress" || theme === "rtexpress-light") && (
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        >
                            <circle cx="8" cy="8" r="6.5" />
                            <path d="M8 1.5C8 1.5 5 4 5 8s3 6.5 3 6.5" />
                            <path d="M8 1.5C8 1.5 11 4 11 8s-3 6.5-3 6.5" />
                            <path d="M1.5 8h13" />
                            <path d="M2 5h12M2 11h12" />
                        </svg>
                    )}
                </button>

                <button
                    className="icon-btn"
                    data-tip="Notifications"
                    style={{ position: "relative" }}
                >
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    >
                        <path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5z" />
                        <path d="M6.5 13a1.5 1.5 0 003 0" />
                    </svg>
                    <span
                        style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "var(--red)",
                            border: "1.5px solid var(--bg-2)",
                        }}
                    />
                </button>

                <button className="btn primary" onClick={onNewShipment}>
                    <svg
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    >
                        <path d="M7 1v12M1 7h12" />
                    </svg>
                    New Shipment
                </button>
            </div>
        </header>
    );
}
