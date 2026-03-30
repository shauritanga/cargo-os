import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Badge from "../components/shared/Badge";
import Pagination from "../components/shared/Pagination";
import SearchableSelect from "../components/shared/SearchableSelect";
import { createRoute, deleteRoute, updateRoute } from "../lib/api";
import type { Route } from "../types";

const PER_PAGE = 9;
const MODE_COLORS: Record<string, string> = {
    Sea: "var(--blue)",
    Air: "var(--purple)",
    Road: "var(--amber)",
    Rail: "var(--green)",
};

async function fetchCountries() {
    const res = await fetch("/api/countries");
    return res.json() as Promise<{ id: number; name: string; code: string }[]>;
}

async function fetchCities(code: string): Promise<string[]> {
    if (!code) return [];
    const res = await fetch(`/api/countries/${code}/cities`);
    return res.json();
}

export default function Routes() {
    const { routes, setRoutes, showToast } = useApp();
    const [statusFilter, setStatusFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [page, setPage] = useState(1);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [rrOrigin, setRrOrigin] = useState("");
    const [rrOriginC, setRrOriginC] = useState("");
    const [rrDest, setRrDest] = useState("");
    const [rrDestC, setRrDestC] = useState("");
    const [countryOptions, setCountryOptions] = useState<
        { label: string; value: string; code: string }[]
    >([]);
    const [originCities, setOriginCities] = useState<string[]>([]);
    const [destCities, setDestCities] = useState<string[]>([]);
    const [rrMode, setRrMode] = useState("Sea");
    const [rrType, setRrType] = useState("international");
    const [rrStatus, setRrStatus] = useState("active");
    const [rrCarrier, setRrCarrier] = useState("");
    const [rrFreq, setRrFreq] = useState("Weekly");
    const [rrDays, setRrDays] = useState("");
    const [rrShipments, setRrShipments] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);
    const [deleting, setDeleting] = useState(false);

    const resetRouteForm = () => {
        setRrOrigin("");
        setRrOriginC("");
        setRrDest("");
        setRrDestC("");
        setRrMode("Sea");
        setRrType("international");
        setRrStatus("active");
        setRrCarrier("");
        setRrFreq("Weekly");
        setRrDays("");
        setRrShipments("");
        setEditingId(null);
    };

    const openCreateModal = () => {
        setModalMode("create");
        resetRouteForm();
        setShowModal(true);
    };

    const openEditModal = (route: Route) => {
        setModalMode("edit");
        setEditingId(route.id);
        setRrOrigin(route.origin ?? "");
        setRrOriginC(route.originC === "—" ? "" : route.originC);
        setRrDest(route.dest ?? "");
        setRrDestC(route.destC === "—" ? "" : route.destC);
        setRrMode(route.mode ?? "Sea");
        setRrType(route.type ?? "international");
        setRrStatus(route.status ?? "active");
        setRrCarrier(route.carrier === "—" ? "" : route.carrier);
        setRrFreq(route.freq ?? "Weekly");
        setRrDays(String(route.avgDays ?? ""));
        setRrShipments(String(route.shipments ?? ""));
        setShowModal(true);
    };

    const handleCreateRoute = async () => {
        const origin = rrOrigin.trim();
        const dest = rrDest.trim();
        const carrier = rrCarrier.trim();

        if (!origin || !dest || !carrier) {
            showToast(
                "Origin City, Destination City, and Carrier are required.",
                "red",
            );
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                origin,
                origin_c: rrOriginC || undefined,
                dest,
                dest_c: rrDestC || undefined,
                mode: rrMode,
                type: rrType,
                status: rrStatus,
                carrier,
                freq: rrFreq || undefined,
                avg_days: rrDays ? Number(rrDays) : undefined,
                shipments: rrShipments ? Number(rrShipments) : undefined,
            };

            if (modalMode === "edit" && editingId) {
                const updated = await updateRoute(editingId, payload);
                setRoutes((prev) =>
                    prev.map((item) =>
                        item.id === editingId ? updated : item,
                    ),
                );
                showToast("Route updated successfully.", "green");
            } else {
                const created = await createRoute(payload);
                setRoutes((prev) => [created, ...prev]);
                showToast("Route created successfully.", "green");
            }

            setShowModal(false);
            resetRouteForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} route.`,
                "red",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRoute = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteRoute(deleteTarget.id);
            setRoutes((prev) =>
                prev.filter((item) => item.id !== deleteTarget.id),
            );
            if (detailId === deleteTarget.id) {
                setDetailId(null);
            }
            setDeleteTarget(null);
            showToast("Route deleted successfully.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete route.", "red");
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchCountries().then((data) =>
            setCountryOptions(
                data.map((c) => ({
                    label: c.name,
                    value: c.code,
                    code: c.code,
                })),
            ),
        );
    }, []);

    useEffect(() => {
        fetchCities(rrOriginC).then(setOriginCities);
    }, [rrOriginC]);

    useEffect(() => {
        fetchCities(rrDestC).then(setDestCities);
    }, [rrDestC]);

    const filtered = useMemo(
        () =>
            routes.filter((r) => {
                if (statusFilter !== "all" && r.status !== statusFilter)
                    return false;
                if (modeFilter !== "all" && r.mode !== modeFilter) return false;
                if (typeFilter !== "all" && r.type !== typeFilter) return false;
                const q = search.trim().toLowerCase();
                if (
                    q &&
                    !`${r.origin} ${r.dest} ${r.originC} ${r.destC} ${r.carrier}`
                        .toLowerCase()
                        .includes(q)
                )
                    return false;
                return true;
            }),
        [routes, statusFilter, modeFilter, typeFilter, search],
    );

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const detail = detailId
        ? (routes.find((r) => r.id === detailId) ?? null)
        : null;

    const kpis = {
        total: routes.length,
        active: routes.filter((r) => r.status === "active").length,
        totalShipments: routes.reduce((a, r) => a + r.shipments, 0),
        avgDays: (() => {
            const act = routes.filter((r) => r.status === "active");
            return act.length
                ? Math.round(
                      act.reduce((a, r) => a + r.avgDays, 0) / act.length,
                  )
                : 0;
        })(),
    };

    const total = routes.length || 1;
    const rtKpiItems = [
        {
            label: "Total Routes",
            value: kpis.total,
            color: "var(--blue)",
            progress: 100,
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <circle cx="4" cy="9" r="2" />
                    <circle cx="14" cy="9" r="2" />
                    <path d="M6 9h4M2 5h14M2 13h14" />
                </svg>
            ),
        },
        {
            label: "Active Routes",
            value: kpis.active,
            color: "var(--green)",
            progress: Math.round((kpis.active / total) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M2 9l5 5 9-9" />
                </svg>
            ),
        },
        {
            label: "Active Loads",
            value: kpis.totalShipments,
            color: "var(--amber)",
            progress: Math.min(
                100,
                Math.round(
                    (kpis.totalShipments / Math.max(total * 5, 1)) * 100,
                ),
            ),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <rect x="2" y="4" width="14" height="11" rx="1.5" />
                    <path d="M2 8h14M6 2v4M12 2v4" />
                </svg>
            ),
        },
        {
            label: "Avg Transit (days)",
            value: `${kpis.avgDays}d`,
            color: "var(--purple)",
            progress: Math.min(100, Math.round((kpis.avgDays / 30) * 100)),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <circle cx="9" cy="9" r="7" />
                    <path d="M9 5v4l2.5 2.5" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <div className="content">
                {/* KPI BAR */}
                <div className="stat-grid">
                    {rtKpiItems.map((item) => (
                        <div key={item.label} className="stat-card">
                            <div className="stat-top">
                                <div
                                    className="stat-icon"
                                    style={{
                                        background: `${item.color}20`,
                                        color: item.color,
                                    }}
                                >
                                    {item.icon}
                                </div>
                            </div>
                            <div
                                className="stat-value"
                                style={{
                                    color:
                                        item.label !== "Total Routes"
                                            ? item.color
                                            : undefined,
                                }}
                            >
                                {item.value}
                            </div>
                            <div className="stat-label">{item.label}</div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${item.progress}%`,
                                        background: item.color,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* TOOLBAR CARD */}
                <div className="card" style={{ overflow: "visible" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 16px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            className="search-wrap"
                            style={{ flex: 1, maxWidth: 260, minWidth: 160 }}
                        >
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
                                placeholder="Search routes…"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="filter-tabs" id="rtStatusTabs">
                            {(["all", "active", "inactive"] as const).map(
                                (s) => (
                                    <div
                                        key={s}
                                        className={`filter-tab${statusFilter === s ? " active" : ""}`}
                                        onClick={() => {
                                            setStatusFilter(s);
                                            setPage(1);
                                        }}
                                    >
                                        {s === "all"
                                            ? "All"
                                            : s.charAt(0).toUpperCase() +
                                              s.slice(1)}
                                    </div>
                                ),
                            )}
                        </div>
                        <select
                            className="sh-select"
                            value={modeFilter}
                            onChange={(e) => {
                                setModeFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Modes</option>
                            <option>Sea</option>
                            <option>Air</option>
                            <option>Road</option>
                            <option>Rail</option>
                        </select>
                        <select
                            className="sh-select"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">Intl + Domestic</option>
                            <option value="international">
                                🌐 International
                            </option>
                            <option value="domestic">🏠 Domestic</option>
                        </select>
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <div className="view-toggle">
                                <button
                                    className={`view-btn${view === "grid" ? " active" : ""}`}
                                    onClick={() => setView("grid")}
                                    title="Grid"
                                >
                                    <svg
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                    >
                                        <rect
                                            x="1"
                                            y="1"
                                            width="5"
                                            height="5"
                                            rx="1"
                                        />
                                        <rect
                                            x="8"
                                            y="1"
                                            width="5"
                                            height="5"
                                            rx="1"
                                        />
                                        <rect
                                            x="1"
                                            y="8"
                                            width="5"
                                            height="5"
                                            rx="1"
                                        />
                                        <rect
                                            x="8"
                                            y="8"
                                            width="5"
                                            height="5"
                                            rx="1"
                                        />
                                    </svg>
                                </button>
                                <button
                                    className={`view-btn${view === "list" ? " active" : ""}`}
                                    onClick={() => setView("list")}
                                    title="List"
                                >
                                    <svg
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                    >
                                        <path d="M1 3h12M1 7h12M1 11h12" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                className="btn primary"
                                onClick={openCreateModal}
                            >
                                <svg
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                >
                                    <path d="M7 1v12M1 7h12" />
                                </svg>
                                New Route
                            </button>
                        </div>
                    </div>
                </div>

                {/* GRID / LIST */}
                <div>
                    {view === "grid" ? (
                        <div
                            id="rtGrid"
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill,minmax(320px,1fr))",
                                gap: 12,
                            }}
                        >
                            {pageItems.map((r) => {
                                const mc = MODE_COLORS[r.mode] || "var(--blue)";
                                const isIntl = r.type === "international";
                                return (
                                    <div
                                        key={r.id}
                                        className={`route-card${detailId === r.id ? " selected" : ""}`}
                                        onClick={() => setDetailId(r.id)}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                marginBottom: 14,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily:
                                                            "'DM Mono',monospace",
                                                        fontSize: 11,
                                                        color: "var(--blue)",
                                                    }}
                                                >
                                                    {r.id}
                                                </span>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 5,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            padding: "2px 8px",
                                                            borderRadius: 20,
                                                            background: `${mc}20`,
                                                            color: mc,
                                                        }}
                                                    >
                                                        {r.mode}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            padding: "2px 8px",
                                                            borderRadius: 20,
                                                            background: isIntl
                                                                ? "var(--blue-dim)"
                                                                : "var(--green-dim)",
                                                            color: isIntl
                                                                ? "var(--blue)"
                                                                : "var(--green)",
                                                        }}
                                                    >
                                                        {isIntl
                                                            ? "🌐 Intl"
                                                            : "🏠 Local"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={
                                                    r.status === "active"
                                                        ? "delivered"
                                                        : "delayed"
                                                }
                                            >
                                                {r.status === "active"
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <div className="route-node">
                                                <div className="route-node-label">
                                                    Origin
                                                </div>
                                                <div className="route-node-city">
                                                    {r.origin}
                                                </div>
                                                <div className="route-node-country">
                                                    {r.originC}
                                                </div>
                                            </div>
                                            <svg
                                                viewBox="0 0 20 10"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                style={{
                                                    width: 22,
                                                    flexShrink: 0,
                                                    color: "var(--text-3)",
                                                }}
                                            >
                                                <path d="M2 5h16M14 2l4 3-4 3" />
                                            </svg>
                                            <div className="route-node">
                                                <div className="route-node-label">
                                                    Destination
                                                </div>
                                                <div className="route-node-city">
                                                    {r.dest}
                                                </div>
                                                <div className="route-node-country">
                                                    {r.destC}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-3)",
                                                marginBottom: 10,
                                            }}
                                        >
                                            Carrier:{" "}
                                            <span
                                                style={{
                                                    color: "var(--text-2)",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {r.carrier}
                                            </span>{" "}
                                            · {r.freq}
                                        </div>
                                        <div className="route-stats-row">
                                            <div className="route-stat">
                                                <div className="route-stat-val">
                                                    {r.avgDays}d
                                                </div>
                                                <div className="route-stat-lbl">
                                                    Avg Transit
                                                </div>
                                            </div>
                                            <div className="route-stat">
                                                <div className="route-stat-val">
                                                    {r.shipments}
                                                </div>
                                                <div className="route-stat-lbl">
                                                    Active Loads
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card" style={{ overflow: "hidden" }}>
                            <div className="sh-table-wrap">
                                <table className="sh-table">
                                    <thead>
                                        <tr>
                                            <th>Route ID</th>
                                            <th>Origin</th>
                                            <th>Destination</th>
                                            <th>Mode</th>
                                            <th>Type</th>
                                            <th>Carrier</th>
                                            <th>Frequency</th>
                                            <th>Avg Days</th>
                                            <th>Active Loads</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.map((r) => (
                                            <tr
                                                key={r.id}
                                                className={
                                                    detailId === r.id
                                                        ? "selected"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setDetailId(r.id)
                                                }
                                            >
                                                <td className="mono">{r.id}</td>
                                                <td>
                                                    {r.origin}{" "}
                                                    <span
                                                        style={{
                                                            color: "var(--text-3)",
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        {r.originC}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.dest}{" "}
                                                    <span
                                                        style={{
                                                            color: "var(--text-3)",
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        {r.destC}
                                                    </span>
                                                </td>
                                                <td>{r.mode}</td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color:
                                                                r.type ===
                                                                "international"
                                                                    ? "var(--blue)"
                                                                    : "var(--green)",
                                                        }}
                                                    >
                                                        {r.type ===
                                                        "international"
                                                            ? "🌐 Intl"
                                                            : "🏠 Local"}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {r.carrier}
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {r.freq}
                                                </td>
                                                <td>{r.avgDays}d</td>
                                                <td>{r.shipments}</td>
                                                <td>
                                                    <Badge
                                                        variant={
                                                            r.status ===
                                                            "active"
                                                                ? "delivered"
                                                                : "delayed"
                                                        }
                                                    >
                                                        {r.status === "active"
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div
                        style={{
                            marginTop: 12,
                            background: "var(--bg-2)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                        }}
                    >
                        <Pagination
                            currentPage={page}
                            totalItems={filtered.length}
                            perPage={PER_PAGE}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            </div>

            {/* NEW ROUTE MODAL */}
            {showModal && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (!submitting && e.target === e.currentTarget) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 540 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit"
                                    ? "Edit Route"
                                    : "New Route"}
                            </span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!submitting) {
                                        setShowModal(false);
                                    }
                                }}
                            >
                                <svg
                                    viewBox="0 0 13 13"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                >
                                    <path d="M1 1l11 11M12 1L1 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-divider">Route</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Origin Country
                                    </label>
                                    <SearchableSelect
                                        options={countryOptions}
                                        value={rrOriginC}
                                        placeholder="Select country…"
                                        searchPlaceholder="Search country…"
                                        onChange={(code) => {
                                            setRrOriginC(code);
                                            setRrOrigin("");
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Origin City *
                                    </label>
                                    <SearchableSelect
                                        options={originCities.map((c) => ({
                                            label: c,
                                            value: c,
                                        }))}
                                        value={rrOrigin}
                                        placeholder="Select or type…"
                                        searchPlaceholder="Search or type city…"
                                        onChange={(_, label) =>
                                            setRrOrigin(label)
                                        }
                                        onFreeType={(v) => setRrOrigin(v)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Destination Country
                                    </label>
                                    <SearchableSelect
                                        options={countryOptions}
                                        value={rrDestC}
                                        placeholder="Select country…"
                                        searchPlaceholder="Search country…"
                                        onChange={(code) => {
                                            setRrDestC(code);
                                            setRrDest("");
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Destination City *
                                    </label>
                                    <SearchableSelect
                                        options={destCities.map((c) => ({
                                            label: c,
                                            value: c,
                                        }))}
                                        value={rrDest}
                                        placeholder="Select or type…"
                                        searchPlaceholder="Search or type city…"
                                        onChange={(_, label) =>
                                            setRrDest(label)
                                        }
                                        onFreeType={(v) => setRrDest(v)}
                                    />
                                </div>
                            </div>
                            <div className="form-divider">Details</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Mode</label>
                                    <select
                                        className="form-select"
                                        value={rrMode}
                                        onChange={(e) =>
                                            setRrMode(e.target.value)
                                        }
                                    >
                                        <option>Sea</option>
                                        <option>Air</option>
                                        <option>Road</option>
                                        <option>Rail</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={rrType}
                                        onChange={(e) =>
                                            setRrType(e.target.value)
                                        }
                                    >
                                        <option value="international">
                                            International
                                        </option>
                                        <option value="domestic">
                                            Domestic
                                        </option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={rrStatus}
                                        onChange={(e) =>
                                            setRrStatus(e.target.value)
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Carrier *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Maersk"
                                        value={rrCarrier}
                                        onChange={(e) =>
                                            setRrCarrier(e.target.value)
                                        }
                                    />
                                </div>
                                <div
                                    className="form-group"
                                    style={{ gridColumn: "1 / -1" }}
                                >
                                    <label className="form-label">
                                        Frequency
                                    </label>
                                    <select
                                        className="form-select"
                                        value={rrFreq}
                                        onChange={(e) =>
                                            setRrFreq(e.target.value)
                                        }
                                    >
                                        <option>Daily</option>
                                        <option>Bi-Weekly</option>
                                        <option>Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Avg Transit Days
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 18"
                                        value={rrDays}
                                        onChange={(e) =>
                                            setRrDays(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Active Loads
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 12"
                                        value={rrShipments}
                                        onChange={(e) =>
                                            setRrShipments(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                disabled={submitting}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn primary"
                                disabled={submitting}
                                onClick={handleCreateRoute}
                            >
                                {submitting
                                    ? "Saving…"
                                    : modalMode === "edit"
                                      ? "Save Changes"
                                      : "Create Route"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRAWER OVERLAY */}
            {detail && (
                <div
                    className="drawer-overlay open"
                    onClick={() => setDetailId(null)}
                />
            )}

            {/* DETAIL PANEL */}
            {detail && (
                <div className="bk-detail open">
                    <div className="dp-header">
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>
                                {detail.origin} → {detail.dest}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Badge
                                    variant={
                                        detail.status === "active"
                                            ? "delivered"
                                            : "delayed"
                                    }
                                >
                                    {detail.status === "active"
                                        ? "Active"
                                        : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                        <button
                            className="dp-close"
                            onClick={() => setDetailId(null)}
                        >
                            <svg
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            >
                                <path d="M1 1l10 10M11 1L1 11" />
                            </svg>
                        </button>
                    </div>
                    <div className="bk-detail-scroll">
                        <div className="dp-section">
                            <div className="dp-section-title">
                                Route Details
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Route ID</span>
                                <span className="dp-val mono">{detail.id}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Origin</span>
                                <span className="dp-val">
                                    {detail.origin} ({detail.originC})
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Destination</span>
                                <span className="dp-val">
                                    {detail.dest} ({detail.destC})
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Mode</span>
                                <span className="dp-val">{detail.mode}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Type</span>
                                <span className="dp-val">
                                    {detail.type === "international"
                                        ? "🌐 International"
                                        : "🏠 Domestic"}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Service Info</div>
                            <div className="dp-row">
                                <span className="dp-key">Carrier</span>
                                <span className="dp-val">{detail.carrier}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Frequency</span>
                                <span className="dp-val">{detail.freq}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Avg Transit</span>
                                <span className="dp-val">
                                    {detail.avgDays} days
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Active Loads</span>
                                <span className="dp-val">
                                    {detail.shipments}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn"
                                    onClick={() => openEditModal(detail)}
                                >
                                    Edit Route
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        borderColor: "var(--red)",
                                        color: "var(--red)",
                                    }}
                                    onClick={() => setDeleteTarget(detail)}
                                >
                                    Delete Route
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (!deleting && e.target === e.currentTarget) {
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 460 }}>
                        <div className="modal-header">
                            <span className="modal-title">Delete Route</span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!deleting) {
                                        setDeleteTarget(null);
                                    }
                                }}
                            >
                                <svg
                                    viewBox="0 0 13 13"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                >
                                    <path d="M1 1l11 11M12 1L1 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p
                                style={{
                                    margin: 0,
                                    color: "var(--text-2)",
                                    lineHeight: 1.5,
                                }}
                            >
                                You are about to permanently delete route{" "}
                                <strong>
                                    {deleteTarget.origin} -&gt;{" "}
                                    {deleteTarget.dest}
                                </strong>
                                . This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                disabled={deleting}
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                disabled={deleting}
                                style={{
                                    borderColor: "var(--red)",
                                    color: "var(--red)",
                                }}
                                onClick={handleDeleteRoute}
                            >
                                {deleting ? "Deleting…" : "Delete Route"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
