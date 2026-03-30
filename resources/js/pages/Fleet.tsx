import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import Badge, { STATUS_LABEL } from "../components/shared/Badge";
import Pagination from "../components/shared/Pagination";
import SearchableSelect from "../components/shared/SearchableSelect";
import { fmtDate } from "../data/mock";
import {
    createFleetVehicle,
    deleteFleetVehicle,
    updateFleetVehicle,
} from "../lib/api";
import type { FleetVehicle, FleetStatus } from "../types";

const PER_PAGE = 10;
const FLT_BADGE: Record<FleetStatus, string> = {
    active: "active-v",
    idle: "idle-v",
    maintenance: "maint",
    retired: "retired-v",
};
const TYPE_COLOR: Record<string, string> = {
    Truck: "var(--amber)",
    Ship: "var(--blue)",
    Aircraft: "var(--purple)",
    Rail: "var(--green)",
};

function TypeIcon({ type }: { type: string }) {
    const s: React.CSSProperties = { width: 14, height: 14 };
    if (type === "Truck")
        return (
            <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={s}
            >
                <rect x="1" y="5" width="12" height="9" rx="1.5" />
                <path d="M13 8l3 2v4h-3V8z" />
                <circle cx="4.5" cy="14" r="1.5" />
                <circle cx="10.5" cy="14" r="1.5" />
                <circle cx="15" cy="14" r="1.5" />
            </svg>
        );
    if (type === "Ship")
        return (
            <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={s}
            >
                <path d="M2 11l2-5h10l2 5H2z" />
                <path d="M5 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                <path d="M1 14s3 2 8 2 8-2 8-2" />
            </svg>
        );
    if (type === "Aircraft")
        return (
            <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={s}
            >
                <path d="M2 10l2-4 2 2 7-4 1 2-7 3 1 4-2 1-2-3-4 1z" />
            </svg>
        );
    return (
        <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={s}
        >
            <rect x="2" y="2" width="14" height="10" rx="2" />
            <path d="M2 8h14" />
            <circle cx="5" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
            <path d="M5 12v3M13 12v3M6 15h6" />
        </svg>
    );
}

export default function Fleet() {
    const { fleet, routes, setFleet, showToast } = useApp();
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("list");
    const [page, setPage] = useState(1);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fvType, setFvType] = useState("Truck");
    const [fvMake, setFvMake] = useState("");
    const [fvYear, setFvYear] = useState("");
    const [fvPlate, setFvPlate] = useState("");
    const [fvCapacity, setFvCapacity] = useState("");
    const [fvCurrentRoute, setFvCurrentRoute] = useState("");
    const [fvFuel, setFvFuel] = useState("Diesel");
    const [fvMileage, setFvMileage] = useState("");
    const [fvBase, setFvBase] = useState("");
    const [fvDriver, setFvDriver] = useState("");
    const [fvStatus, setFvStatus] = useState<FleetStatus>("idle");
    const [fvLastService, setFvLastService] = useState("");
    const [fvNextService, setFvNextService] = useState("");
    const [fvNotes, setFvNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FleetVehicle | null>(null);
    const [deleting, setDeleting] = useState(false);

    const resetVehicleForm = () => {
        setFvType("Truck");
        setFvMake("");
        setFvYear("");
        setFvPlate("");
        setFvCapacity("");
        setFvCurrentRoute("");
        setFvFuel("Diesel");
        setFvMileage("");
        setFvBase("");
        setFvDriver("");
        setFvStatus("idle");
        setFvLastService("");
        setFvNextService("");
        setFvNotes("");
        setEditingId(null);
    };

    const toDateInput = (value: Date | null | undefined) => {
        if (!value) return "";
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 10);
    };

    const openCreateModal = () => {
        setModalMode("create");
        resetVehicleForm();
        setShowModal(true);
    };

    const openEditModal = (vehicle: FleetVehicle) => {
        setModalMode("edit");
        setEditingId(vehicle.id);
        setFvType(vehicle.type);
        setFvMake(vehicle.make ?? "");
        setFvYear(vehicle.year ? String(vehicle.year) : "");
        setFvPlate(vehicle.plate ?? "");
        setFvCapacity(String(vehicle.capacityTons ?? ""));
        setFvCurrentRoute(
            vehicle.currentRoute === "—" ? "" : vehicle.currentRoute,
        );
        setFvFuel(vehicle.fuelType === "—" ? "Diesel" : vehicle.fuelType);
        setFvMileage(vehicle.mileage ? String(vehicle.mileage) : "");
        setFvBase(vehicle.base === "—" ? "" : vehicle.base);
        setFvDriver(vehicle.driver === "—" ? "" : vehicle.driver);
        setFvStatus(vehicle.status);
        setFvLastService(toDateInput(vehicle.lastService));
        setFvNextService(toDateInput(vehicle.nextService));
        setFvNotes(vehicle.notes ?? "");
        setShowModal(true);
    };

    const handleCreateVehicle = async () => {
        const make = fvMake.trim();
        const plate = fvPlate.trim();

        if (!make || !plate) {
            showToast("Make/Model and Registration/Plate are required.", "red");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                type: fvType,
                make,
                plate,
                driver: fvDriver.trim() || undefined,
                capacity_tons: fvCapacity ? Number(fvCapacity) : undefined,
                current_route: fvCurrentRoute.trim() || undefined,
                last_service: fvLastService || undefined,
                next_service: fvNextService || undefined,
                mileage: fvMileage ? Number(fvMileage) : undefined,
                fuel_type: fvFuel || undefined,
                year: fvYear ? Number(fvYear) : undefined,
                status: fvStatus,
                notes: fvNotes.trim() || undefined,
                base: fvBase.trim() || undefined,
            };

            if (modalMode === "edit" && editingId) {
                const updated = await updateFleetVehicle(editingId, payload);
                setFleet((prev) =>
                    prev.map((item) =>
                        item.id === editingId ? updated : item,
                    ),
                );
                showToast("Vehicle updated successfully.", "green");
            } else {
                const created = await createFleetVehicle(payload);
                setFleet((prev) => [created, ...prev]);
                showToast("Vehicle created successfully.", "green");
            }

            setShowModal(false);
            resetVehicleForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} vehicle.`,
                "red",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteVehicle = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteFleetVehicle(deleteTarget.id);
            setFleet((prev) =>
                prev.filter((item) => item.id !== deleteTarget.id),
            );
            if (detailId === deleteTarget.id) {
                setDetailId(null);
            }
            setDeleteTarget(null);
            showToast("Vehicle deleted successfully.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete vehicle.", "red");
        } finally {
            setDeleting(false);
        }
    };

    const filtered = useMemo(
        () =>
            fleet.filter((v) => {
                if (statusFilter !== "all" && v.status !== statusFilter)
                    return false;
                if (typeFilter !== "all" && v.type !== typeFilter) return false;
                const q = search.trim().toLowerCase();
                if (
                    q &&
                    !`${v.id} ${v.make} ${v.plate} ${v.driver} ${v.type}`
                        .toLowerCase()
                        .includes(q)
                )
                    return false;
                return true;
            }),
        [fleet, statusFilter, typeFilter, search],
    );

    const routeOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: { label: string; value: string }[] = [];

        for (const route of routes) {
            const label = `${route.origin} -> ${route.dest}`;
            if (seen.has(label)) continue;
            seen.add(label);
            options.push({ label, value: label });
        }

        return options;
    }, [routes]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const detail = detailId
        ? (fleet.find((v) => v.id === detailId) ?? null)
        : null;

    const kpis = useMemo(() => {
        const c = { active: 0, idle: 0, maintenance: 0, retired: 0 };
        fleet.forEach((v) => {
            if (v.status in c) (c as Record<string, number>)[v.status]++;
        });
        return c;
    }, [fleet]);

    const total = fleet.length || 1;
    const utilPct = Math.round((kpis.active / total) * 100);
    const fltKpiItems = [
        {
            label: "Total Vehicles",
            value: fleet.length,
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
                    <rect x="1" y="5" width="12" height="9" rx="1.5" />
                    <path d="M13 8l3 2v4h-3V8z" />
                </svg>
            ),
        },
        {
            label: "Active / En Route",
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
            label: "Idle / Available",
            value: kpis.idle,
            color: "var(--amber)",
            progress: Math.round((kpis.idle / total) * 100),
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
        {
            label: "In Maintenance",
            value: kpis.maintenance,
            color: "var(--red)",
            progress: Math.round((kpis.maintenance / total) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M9 2L1.5 15h15L9 2z" />
                    <path d="M9 7v4M9 13v.5" />
                </svg>
            ),
        },
        {
            label: "Fleet Utilization",
            value: `${utilPct}%`,
            color: "var(--purple)",
            progress: utilPct,
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <circle cx="9" cy="9" r="7" />
                    <path d="M9 6v3l2 2" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <div className="content">
                {/* KPI BAR */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5,1fr)",
                        gap: 14,
                    }}
                >
                    {fltKpiItems.map((item) => (
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
                                        item.label !== "Total Vehicles"
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
                                placeholder="Search vehicle, driver, plate…"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="filter-tabs" id="fltStatusTabs">
                            {(
                                [
                                    "all",
                                    "active",
                                    "idle",
                                    "maintenance",
                                    "retired",
                                ] as const
                            ).map((s) => (
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
                                        : (STATUS_LABEL[s] ?? s)}
                                </div>
                            ))}
                        </div>
                        <select
                            className="sh-select"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Types</option>
                            <option>Truck</option>
                            <option>Ship</option>
                            <option>Aircraft</option>
                            <option>Rail</option>
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
                                Add Vehicle
                            </button>
                        </div>
                    </div>
                </div>

                {/* GRID / LIST */}
                <div>
                    {view === "grid" ? (
                        <div
                            id="fltGridBody"
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill,minmax(260px,1fr))",
                                gap: 12,
                            }}
                        >
                            {pageItems.map((v) => {
                                const tc = TYPE_COLOR[v.type] || "var(--blue)";
                                return (
                                    <div
                                        key={v.id}
                                        className={`bk-card${detailId === v.id ? " selected" : ""}`}
                                        onClick={() => setDetailId(v.id)}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: "3px 9px",
                                                    borderRadius: 20,
                                                    background: `${tc}20`,
                                                    color: tc,
                                                }}
                                            >
                                                <TypeIcon type={v.type} />
                                                {v.type}
                                            </div>
                                            <Badge
                                                variant={FLT_BADGE[v.status]}
                                            >
                                                {STATUS_LABEL[v.status] ??
                                                    v.status}
                                            </Badge>
                                        </div>
                                        <div
                                            style={{
                                                fontFamily:
                                                    "'DM Mono',monospace",
                                                fontSize: 11,
                                                color: "var(--blue)",
                                                marginBottom: 4,
                                            }}
                                        >
                                            {v.id}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {v.make}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-3)",
                                                marginBottom: 10,
                                            }}
                                        >
                                            {v.plate} · {v.year}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-2)",
                                                marginBottom: 6,
                                            }}
                                        >
                                            👤 {v.driver}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 10,
                                                paddingTop: 10,
                                                borderTop:
                                                    "1px solid var(--border)",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {v.capacityTons.toLocaleString()}
                                                    t
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: "var(--text-3)",
                                                    }}
                                                >
                                                    Capacity
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        maxWidth: 110,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {v.currentRoute}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: "var(--text-3)",
                                                    }}
                                                >
                                                    Route
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
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Make</th>
                                            <th>Plate</th>
                                            <th>Driver</th>
                                            <th>Capacity</th>
                                            <th>Current Route</th>
                                            <th>Base</th>
                                            <th>Next Service</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.map((v) => (
                                            <tr
                                                key={v.id}
                                                className={
                                                    detailId === v.id
                                                        ? "selected"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setDetailId(v.id)
                                                }
                                            >
                                                <td className="mono">{v.id}</td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 5,
                                                            fontSize: 12,
                                                            color: TYPE_COLOR[
                                                                v.type
                                                            ],
                                                        }}
                                                    >
                                                        <TypeIcon
                                                            type={v.type}
                                                        />
                                                        {v.type}
                                                    </div>
                                                </td>
                                                <td>
                                                    {v.make}
                                                    <div className="text-muted">
                                                        {v.year}
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        fontFamily:
                                                            "'DM Mono',monospace",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {v.plate}
                                                </td>
                                                <td>{v.driver}</td>
                                                <td>
                                                    {v.capacityTons.toLocaleString()}
                                                    t
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {v.currentRoute}
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {v.base}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily:
                                                            "'DM Mono',monospace",
                                                    }}
                                                >
                                                    {fmtDate(v.nextService)}
                                                </td>
                                                <td>
                                                    <Badge
                                                        variant={
                                                            FLT_BADGE[v.status]
                                                        }
                                                    >
                                                        {STATUS_LABEL[
                                                            v.status
                                                        ] ?? v.status}
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

            {/* DETAIL PANEL */}
            {/* ADD VEHICLE MODAL */}
            {showModal && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (!submitting && e.target === e.currentTarget)
                            setShowModal(false);
                    }}
                >
                    <div className="modal" style={{ width: 540 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit"
                                    ? "Edit Vehicle"
                                    : "Add Vehicle"}
                            </span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!submitting) setShowModal(false);
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
                            <div className="form-divider">Vehicle Info</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={fvType}
                                        onChange={(e) =>
                                            setFvType(e.target.value)
                                        }
                                    >
                                        <option>Truck</option>
                                        <option>Ship</option>
                                        <option>Aircraft</option>
                                        <option>Rail</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Make / Model *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Volvo FH 500"
                                        value={fvMake}
                                        onChange={(e) =>
                                            setFvMake(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 2021"
                                        value={fvYear}
                                        onChange={(e) =>
                                            setFvYear(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Registration / Plate *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. T 201 BCD"
                                        value={fvPlate}
                                        onChange={(e) =>
                                            setFvPlate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="form-divider">Specs</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Capacity (tons)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 20"
                                        value={fvCapacity}
                                        onChange={(e) =>
                                            setFvCapacity(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Current Route
                                    </label>
                                    <SearchableSelect
                                        options={routeOptions}
                                        value={fvCurrentRoute}
                                        placeholder="Select available route..."
                                        searchPlaceholder="Search route..."
                                        onChange={(value) =>
                                            setFvCurrentRoute(value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Fuel Type
                                    </label>
                                    <select
                                        className="form-select"
                                        value={fvFuel}
                                        onChange={(e) =>
                                            setFvFuel(e.target.value)
                                        }
                                    >
                                        <option>Diesel</option>
                                        <option>Petrol</option>
                                        <option>Electric</option>
                                        <option>Bunker Fuel</option>
                                        <option>Jet A-1</option>
                                        <option>Diesel/Electric</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Odometer (km)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 45000"
                                        value={fvMileage}
                                        onChange={(e) =>
                                            setFvMileage(e.target.value)
                                        }
                                    />
                                </div>
                                <div
                                    className="form-group"
                                    style={{ gridColumn: "1 / -1" }}
                                >
                                    <label className="form-label">
                                        Home Base
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Dar es Salaam"
                                        value={fvBase}
                                        onChange={(e) =>
                                            setFvBase(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="form-divider">Assignment</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Driver (optional)
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="Driver name"
                                        value={fvDriver}
                                        onChange={(e) =>
                                            setFvDriver(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={fvStatus}
                                        onChange={(e) =>
                                            setFvStatus(
                                                e.target.value as FleetStatus,
                                            )
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="idle">Idle</option>
                                        <option value="maintenance">
                                            Maintenance
                                        </option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Last Service
                                    </label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={fvLastService}
                                        onChange={(e) =>
                                            setFvLastService(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Next Service Due
                                    </label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={fvNextService}
                                        onChange={(e) =>
                                            setFvNextService(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div
                                className="form-row"
                                style={{ gridTemplateColumns: "1fr" }}
                            >
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Optional notes"
                                        value={fvNotes}
                                        onChange={(e) =>
                                            setFvNotes(e.target.value)
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
                                onClick={handleCreateVehicle}
                            >
                                {submitting
                                    ? "Saving…"
                                    : modalMode === "edit"
                                      ? "Save Changes"
                                      : "Add Vehicle"}
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

            {detail && (
                <div className="bk-detail open">
                    <div className="dp-header">
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>
                                {detail.make}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Badge variant={FLT_BADGE[detail.status]}>
                                    {STATUS_LABEL[detail.status] ??
                                        detail.status}
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
                            <div className="dp-section-title">Vehicle</div>
                            <div className="dp-row">
                                <span className="dp-key">ID</span>
                                <span className="dp-val mono">{detail.id}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Type</span>
                                <span className="dp-val">{detail.type}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Make / Model</span>
                                <span className="dp-val">{detail.make}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Plate / IMO</span>
                                <span className="dp-val mono">
                                    {detail.plate}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Year</span>
                                <span className="dp-val">{detail.year}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Base</span>
                                <span className="dp-val">{detail.base}</span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Operations</div>
                            <div className="dp-row">
                                <span className="dp-key">Driver</span>
                                <span className="dp-val">{detail.driver}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Current Route</span>
                                <span className="dp-val">
                                    {detail.currentRoute}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Capacity</span>
                                <span className="dp-val">
                                    {detail.capacityTons.toLocaleString()} t
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Fuel Type</span>
                                <span className="dp-val">
                                    {detail.fuelType}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Mileage / Hours</span>
                                <span className="dp-val">
                                    {detail.mileage.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Maintenance</div>
                            <div className="dp-row">
                                <span className="dp-key">Last Service</span>
                                <span className="dp-val mono">
                                    {fmtDate(detail.lastService)}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Next Service</span>
                                <span className="dp-val mono">
                                    {fmtDate(detail.nextService)}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn"
                                    onClick={() => openEditModal(detail)}
                                >
                                    Edit Vehicle
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        borderColor: "var(--red)",
                                        color: "var(--red)",
                                    }}
                                    onClick={() => setDeleteTarget(detail)}
                                >
                                    Delete Vehicle
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
                        if (!deleting && e.target === e.currentTarget)
                            setDeleteTarget(null);
                    }}
                >
                    <div className="modal" style={{ width: 460 }}>
                        <div className="modal-header">
                            <span className="modal-title">Delete Vehicle</span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!deleting) setDeleteTarget(null);
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
                                You are about to permanently delete vehicle{" "}
                                <strong>{deleteTarget.make}</strong> (
                                {deleteTarget.plate}). This action cannot be
                                undone.
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
                                onClick={handleDeleteVehicle}
                            >
                                {deleting ? "Deleting…" : "Delete Vehicle"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
