import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import Badge from "../components/shared/Badge";
import { createWarehouse, deleteWarehouse, updateWarehouse } from "../lib/api";
import type { Warehouse, WarehouseStatus, WarehouseType } from "../types";

export default function Warehouses() {
    const { warehouses, setWarehouses, showToast } = useApp();
    const [typeFilter, setTypeFilter] = useState("all");
    const [capFilter, setCapFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [detailId, setDetailId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [wfName, setWfName] = useState("");
    const [wfCity, setWfCity] = useState("");
    const [wfCountry, setWfCountry] = useState("TZ");
    const [wfType, setWfType] = useState<WarehouseType>("General");
    const [wfCapacity, setWfCapacity] = useState("");
    const [wfUsed, setWfUsed] = useState("");
    const [wfActiveLoads, setWfActiveLoads] = useState("");
    const [wfManager, setWfManager] = useState("");
    const [wfStatus, setWfStatus] = useState<WarehouseStatus>("operational");
    const [wfPhone, setWfPhone] = useState("");
    const [wfEmail, setWfEmail] = useState("");
    const [wfAddress, setWfAddress] = useState("");
    const [wfNotes, setWfNotes] = useState("");

    const resetForm = () => {
        setWfName("");
        setWfCity("");
        setWfCountry("TZ");
        setWfType("General");
        setWfCapacity("");
        setWfUsed("");
        setWfActiveLoads("");
        setWfManager("");
        setWfStatus("operational");
        setWfPhone("");
        setWfEmail("");
        setWfAddress("");
        setWfNotes("");
        setEditingId(null);
    };

    const openCreateModal = () => {
        setModalMode("create");
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (warehouse: Warehouse) => {
        setModalMode("edit");
        setEditingId(warehouse.id);
        setWfName(warehouse.name ?? "");
        setWfCity(warehouse.city ?? "");
        setWfCountry(warehouse.country ?? "TZ");
        setWfType(warehouse.type);
        setWfCapacity(String(warehouse.capacitySqm ?? ""));
        setWfUsed(String(warehouse.usedSqm ?? ""));
        setWfActiveLoads(String(warehouse.activeLoads ?? ""));
        setWfManager(warehouse.manager === "—" ? "" : warehouse.manager);
        setWfStatus(warehouse.status);
        setWfPhone(warehouse.phone === "—" ? "" : warehouse.phone);
        setWfEmail(warehouse.email === "—" ? "" : warehouse.email);
        setWfAddress(warehouse.address === "—" ? "" : warehouse.address);
        setWfNotes(warehouse.notes ?? "");
        setShowModal(true);
    };

    const handleSave = async () => {
        const name = wfName.trim();
        const city = wfCity.trim();

        if (!name || !city) {
            showToast("Warehouse Name and City are required.", "red");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name,
                city,
                country: wfCountry.trim() || "TZ",
                type: wfType,
                capacity_sqm: wfCapacity ? Number(wfCapacity) : 0,
                used_sqm: wfUsed ? Number(wfUsed) : 0,
                active_loads: wfActiveLoads ? Number(wfActiveLoads) : 0,
                manager: wfManager.trim() || undefined,
                status: wfStatus,
                phone: wfPhone.trim() || undefined,
                email: wfEmail.trim() || undefined,
                address: wfAddress.trim() || undefined,
                notes: wfNotes.trim() || undefined,
            };

            if (modalMode === "edit" && editingId) {
                const updated = await updateWarehouse(editingId, payload);
                setWarehouses((prev) =>
                    prev.map((item) =>
                        item.id === editingId ? updated : item,
                    ),
                );
                showToast("Warehouse updated successfully.", "green");
            } else {
                const created = await createWarehouse(payload);
                setWarehouses((prev) => [created, ...prev]);
                showToast("Warehouse created successfully.", "green");
            }

            setShowModal(false);
            resetForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} warehouse.`,
                "red",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteWarehouse = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteWarehouse(deleteTarget.id);
            setWarehouses((prev) =>
                prev.filter((item) => item.id !== deleteTarget.id),
            );
            if (detailId === deleteTarget.id) {
                setDetailId(null);
            }
            setDeleteTarget(null);
            showToast("Warehouse deleted successfully.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete warehouse.", "red");
        } finally {
            setDeleting(false);
        }
    };

    const filtered = useMemo(
        () =>
            warehouses.filter((w) => {
                if (typeFilter !== "all" && w.type !== typeFilter) return false;
                const fillPct = (w.usedSqm / Math.max(1, w.capacitySqm)) * 100;
                if (capFilter === "critical" && fillPct <= 85) return false;
                if (capFilter === "high" && (fillPct <= 70 || fillPct > 85))
                    return false;
                if (capFilter === "normal" && fillPct >= 70) return false;
                const q = search.trim().toLowerCase();
                if (
                    q &&
                    !`${w.name} ${w.city} ${w.country} ${w.type}`
                        .toLowerCase()
                        .includes(q)
                )
                    return false;
                return true;
            }),
        [warehouses, typeFilter, capFilter, search],
    );

    const detail = detailId
        ? (warehouses.find((w) => w.id === detailId) ?? null)
        : null;

    const kpis = useMemo(() => {
        const avgFill =
            warehouses.reduce(
                (a, w) => a + (w.usedSqm / Math.max(1, w.capacitySqm)) * 100,
                0,
            ) / Math.max(1, warehouses.length);
        const totalSpace = warehouses.reduce((a, w) => a + w.capacitySqm, 0);
        const critical = warehouses.filter(
            (w) => (w.usedSqm / Math.max(1, w.capacitySqm)) * 100 > 85,
        ).length;
        return {
            total: warehouses.length,
            avgFill: avgFill.toFixed(0),
            totalSpace,
            critical,
        };
    }, [warehouses]);

    return (
        <>
            <div className="content">
                <div className="stat-grid">
                    {[
                        {
                            label: "Total Warehouses",
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
                                    <path d="M2 8L9 2l7 6v8H2V8z" />
                                    <rect x="7" y="11" width="4" height="5" />
                                </svg>
                            ),
                        },
                        {
                            label: "Avg Capacity Used",
                            value: `${kpis.avgFill}%`,
                            color: "var(--amber)",
                            progress: Number(kpis.avgFill),
                            icon: (
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <rect
                                        x="2"
                                        y="4"
                                        width="14"
                                        height="11"
                                        rx="1.5"
                                    />
                                    <path d="M2 8h14M6 12h6" />
                                </svg>
                            ),
                        },
                        {
                            label: "Total Capacity (m²)",
                            value: kpis.totalSpace.toLocaleString(),
                            color: "var(--green)",
                            progress: Math.min(
                                100,
                                Math.round((kpis.totalSpace / 50000) * 100),
                            ),
                            icon: (
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <rect
                                        x="2"
                                        y="2"
                                        width="14"
                                        height="14"
                                        rx="2"
                                    />
                                    <path d="M6 9h6M9 6v6" />
                                </svg>
                            ),
                        },
                        {
                            label: "Near Capacity (>85%)",
                            value: kpis.critical,
                            color: "var(--red)",
                            progress: warehouses.length
                                ? Math.round(
                                      (kpis.critical / warehouses.length) * 100,
                                  )
                                : 0,
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
                    ].map((item) => (
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
                                        item.label.includes("Capacity Used") ||
                                        item.label.includes("Near")
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
                                placeholder="Search warehouse, city..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="sh-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option>General</option>
                            <option>Cold Storage</option>
                            <option>Hazardous</option>
                            <option>Bonded</option>
                        </select>
                        <select
                            className="sh-select"
                            value={capFilter}
                            onChange={(e) => setCapFilter(e.target.value)}
                        >
                            <option value="all">All Capacity</option>
                            <option value="critical">Critical (&gt;85%)</option>
                            <option value="high">High (70-85%)</option>
                            <option value="normal">Normal (&lt;70%)</option>
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
                                Add Warehouse
                            </button>
                        </div>
                    </div>
                </div>

                {view === "grid" ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill,minmax(340px,1fr))",
                            gap: 14,
                        }}
                    >
                        {filtered.map((w) => {
                            const fillPct = Math.round(
                                (w.usedSqm / Math.max(1, w.capacitySqm)) * 100,
                            );
                            const fillColor =
                                fillPct > 85
                                    ? "var(--red)"
                                    : fillPct > 70
                                      ? "var(--amber)"
                                      : "var(--green)";
                            return (
                                <div
                                    key={w.id}
                                    className="wh-card"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setDetailId(w.id)}
                                >
                                    <div
                                        style={{
                                            padding: "14px 16px",
                                            borderBottom:
                                                "1px solid var(--border)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontFamily:
                                                        "'DM Mono',monospace",
                                                    fontSize: 11,
                                                    color: "var(--blue)",
                                                    marginBottom: 2,
                                                }}
                                            >
                                                {w.id}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {w.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--text-3)",
                                                    marginTop: 1,
                                                }}
                                            >
                                                {w.city}, {w.country}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                w.status === "operational"
                                                    ? "active-v"
                                                    : w.status === "maintenance"
                                                      ? "maint"
                                                      : "retired-v"
                                            }
                                        >
                                            {w.status.charAt(0).toUpperCase() +
                                                w.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <div style={{ padding: "12px 16px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: 4,
                                                fontSize: 12,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: "var(--text-3)",
                                                }}
                                            >
                                                Capacity Used
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: fillColor,
                                                }}
                                            >
                                                {fillPct}%
                                            </span>
                                        </div>
                                        <div className="cap-bar">
                                            <div
                                                className="cap-fill"
                                                style={{
                                                    width: `${fillPct}%`,
                                                    background: fillColor,
                                                }}
                                            />
                                        </div>
                                        <div className="wh-stat-row">
                                            <div className="wh-stat">
                                                <div className="wh-stat-val">
                                                    {w.capacitySqm.toLocaleString()}
                                                </div>
                                                <div className="wh-stat-lbl">
                                                    Total m²
                                                </div>
                                            </div>
                                            <div className="wh-stat">
                                                <div className="wh-stat-val">
                                                    {w.activeLoads}
                                                </div>
                                                <div className="wh-stat-lbl">
                                                    Active Loads
                                                </div>
                                            </div>
                                            <div className="wh-stat">
                                                <div
                                                    className="wh-stat-val"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    {w.type}
                                                </div>
                                                <div className="wh-stat-lbl">
                                                    Type
                                                </div>
                                            </div>
                                            <div className="wh-stat">
                                                <div
                                                    className="wh-stat-val"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    {w.manager}
                                                </div>
                                                <div className="wh-stat-lbl">
                                                    Manager
                                                </div>
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
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Type</th>
                                        <th>Capacity (m²)</th>
                                        <th>Used</th>
                                        <th>Fill %</th>
                                        <th>Active Loads</th>
                                        <th>Manager</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((w) => {
                                        const fillPct = Math.round(
                                            (w.usedSqm /
                                                Math.max(1, w.capacitySqm)) *
                                                100,
                                        );
                                        const fillColor =
                                            fillPct > 85
                                                ? "var(--red)"
                                                : fillPct > 70
                                                  ? "var(--amber)"
                                                  : "var(--green)";
                                        return (
                                            <tr
                                                key={w.id}
                                                onClick={() =>
                                                    setDetailId(w.id)
                                                }
                                            >
                                                <td className="mono">{w.id}</td>
                                                <td>{w.name}</td>
                                                <td style={{ fontSize: 12 }}>
                                                    {w.city}, {w.country}
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {w.type}
                                                </td>
                                                <td>
                                                    {w.capacitySqm.toLocaleString()}
                                                </td>
                                                <td>
                                                    {w.usedSqm.toLocaleString()}
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            color: fillColor,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {fillPct}%
                                                    </span>
                                                </td>
                                                <td>{w.activeLoads}</td>
                                                <td style={{ fontSize: 12 }}>
                                                    {w.manager}
                                                </td>
                                                <td>
                                                    <Badge
                                                        variant={
                                                            w.status ===
                                                            "operational"
                                                                ? "active-v"
                                                                : w.status ===
                                                                    "maintenance"
                                                                  ? "maint"
                                                                  : "retired-v"
                                                        }
                                                    >
                                                        {w.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            w.status.slice(1)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (!submitting && e.target === e.currentTarget) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 620 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit"
                                    ? "Edit Warehouse"
                                    : "Add Warehouse"}
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
                            <div className="form-divider">Location</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Warehouse Name *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Mwanza Depot"
                                        value={wfName}
                                        onChange={(e) =>
                                            setWfName(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Mwanza"
                                        value={wfCity}
                                        onChange={(e) =>
                                            setWfCity(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Country Code
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="TZ"
                                        maxLength={10}
                                        style={{ textTransform: "uppercase" }}
                                        value={wfCountry}
                                        onChange={(e) =>
                                            setWfCountry(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={wfType}
                                        onChange={(e) =>
                                            setWfType(
                                                e.target.value as WarehouseType,
                                            )
                                        }
                                    >
                                        <option>General</option>
                                        <option>Cold Storage</option>
                                        <option>Hazardous</option>
                                        <option>Bonded</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-divider">
                                Capacity & Operations
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Total Capacity (m²)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 5000"
                                        value={wfCapacity}
                                        onChange={(e) =>
                                            setWfCapacity(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Used Space (m²)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="e.g. 1800"
                                        value={wfUsed}
                                        onChange={(e) =>
                                            setWfUsed(e.target.value)
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
                                        placeholder="e.g. 22"
                                        value={wfActiveLoads}
                                        onChange={(e) =>
                                            setWfActiveLoads(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={wfStatus}
                                        onChange={(e) =>
                                            setWfStatus(
                                                e.target
                                                    .value as WarehouseStatus,
                                            )
                                        }
                                    >
                                        <option value="operational">
                                            Operational
                                        </option>
                                        <option value="maintenance">
                                            Maintenance
                                        </option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-divider">Contact</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Manager Name
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="Full name"
                                        value={wfManager}
                                        onChange={(e) =>
                                            setWfManager(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-input"
                                        placeholder="+255 712 000 000"
                                        value={wfPhone}
                                        onChange={(e) =>
                                            setWfPhone(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        placeholder="warehouse@example.com"
                                        value={wfEmail}
                                        onChange={(e) =>
                                            setWfEmail(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Address
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="Street and landmark"
                                        value={wfAddress}
                                        onChange={(e) =>
                                            setWfAddress(e.target.value)
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
                                        value={wfNotes}
                                        onChange={(e) =>
                                            setWfNotes(e.target.value)
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
                                onClick={handleSave}
                            >
                                {submitting
                                    ? "Saving..."
                                    : modalMode === "edit"
                                      ? "Save Changes"
                                      : "Add Warehouse"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                {detail.name}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Badge
                                    variant={
                                        detail.status === "operational"
                                            ? "active-v"
                                            : detail.status === "maintenance"
                                              ? "maint"
                                              : "retired-v"
                                    }
                                >
                                    {detail.status.charAt(0).toUpperCase() +
                                        detail.status.slice(1)}
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
                            <div className="dp-section-title">General</div>
                            <div className="dp-row">
                                <span className="dp-key">ID</span>
                                <span className="dp-val mono">{detail.id}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Name</span>
                                <span className="dp-val">{detail.name}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Type</span>
                                <span className="dp-val">{detail.type}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Location</span>
                                <span className="dp-val">
                                    {detail.city}, {detail.country}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Address</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        textAlign: "right",
                                        maxWidth: 180,
                                    }}
                                >
                                    {detail.address}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Capacity</div>
                            {(() => {
                                const fillPct = Math.round(
                                    (detail.usedSqm /
                                        Math.max(1, detail.capacitySqm)) *
                                        100,
                                );
                                const fillColor =
                                    fillPct > 85
                                        ? "var(--red)"
                                        : fillPct > 70
                                          ? "var(--amber)"
                                          : "var(--green)";
                                return (
                                    <>
                                        <div className="dp-row">
                                            <span className="dp-key">
                                                Total (m²)
                                            </span>
                                            <span className="dp-val">
                                                {detail.capacitySqm.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="dp-row">
                                            <span className="dp-key">
                                                Used (m²)
                                            </span>
                                            <span className="dp-val">
                                                {detail.usedSqm.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="dp-row">
                                            <span className="dp-key">
                                                Fill %
                                            </span>
                                            <span
                                                className="dp-val"
                                                style={{
                                                    color: fillColor,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {fillPct}%
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <div className="cap-bar">
                                                <div
                                                    className="cap-fill"
                                                    style={{
                                                        width: `${fillPct}%`,
                                                        background: fillColor,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className="dp-row"
                                            style={{ marginTop: 10 }}
                                        >
                                            <span className="dp-key">
                                                Active Loads
                                            </span>
                                            <span className="dp-val">
                                                {detail.activeLoads}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Contact</div>
                            <div className="dp-row">
                                <span className="dp-key">Manager</span>
                                <span className="dp-val">{detail.manager}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Phone</span>
                                <span className="dp-val">{detail.phone}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Email</span>
                                <span
                                    className="dp-val"
                                    style={{ color: "var(--blue)" }}
                                >
                                    {detail.email}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn"
                                    onClick={() => openEditModal(detail)}
                                >
                                    Edit Warehouse
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        borderColor: "var(--red)",
                                        color: "var(--red)",
                                    }}
                                    onClick={() => setDeleteTarget(detail)}
                                >
                                    Delete Warehouse
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
                            <span className="modal-title">
                                Delete Warehouse
                            </span>
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
                                You are about to permanently delete warehouse{" "}
                                <strong>{deleteTarget.name}</strong>. This
                                action cannot be undone.
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
                                onClick={handleDeleteWarehouse}
                            >
                                {deleting ? "Deleting..." : "Delete Warehouse"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
