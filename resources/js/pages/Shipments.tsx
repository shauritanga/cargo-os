import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Badge, { STATUS_LABEL } from "../components/shared/Badge";
import Pagination from "../components/shared/Pagination";
import { ModeIcon } from "../components/shared/ModeIcon";
import AirwaybillPrint from "../components/shared/AirwaybillPrint";
import NewShipmentModal from "../components/shared/NewShipmentModal";
import { fmtDate } from "../data/mock";
import {
    patchShipmentStatus,
    deleteShipmentApi,
    bulkUpdateApi,
    bulkDeleteApi,
    fetchShipmentEvents,
} from "../lib/api";
import type {
    Shipment,
    ShipmentStatus,
    Column,
    TimelineStep,
    ShipmentStatusEvent,
} from "../types";

const PER_PAGE = 10;
const ALL_STATUSES: ShipmentStatus[] = [
    "pending",
    "transit",
    "customs",
    "delayed",
    "delivered",
];
const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    pending: ["transit", "delayed"],
    transit: ["customs", "delayed", "delivered"],
    customs: ["transit", "delayed"],
    delayed: ["transit", "customs"],
    delivered: [],
};

const TIMELINE_INT: Record<string, TimelineStep[]> = {
    transit: [
        { label: "Order Created", done: true },
        { label: "Picked Up", done: true },
        { label: "Origin Port Cleared", done: true },
        { label: "In Transit", active: true },
        { label: "Destination Customs", pending: true },
        { label: "Out for Delivery", pending: true },
        { label: "Delivered", pending: true },
    ],
    delivered: [
        { label: "Order Created", done: true },
        { label: "Picked Up", done: true },
        { label: "Origin Port Cleared", done: true },
        { label: "In Transit", done: true },
        { label: "Destination Customs", done: true },
        { label: "Out for Delivery", done: true },
        { label: "Delivered", done: true },
    ],
    pending: [
        { label: "Order Created", done: true },
        { label: "Awaiting Pickup", active: true },
        { label: "Origin Port Cleared", pending: true },
        { label: "In Transit", pending: true },
        { label: "Destination Customs", pending: true },
        { label: "Delivered", pending: true },
    ],
    delayed: [
        { label: "Order Created", done: true },
        { label: "Picked Up", done: true },
        { label: "In Transit", active: true },
        { label: "Delay — Port Congestion", done: true, warn: true },
        { label: "Destination Customs", pending: true },
        { label: "Delivered", pending: true },
    ],
    customs: [
        { label: "Order Created", done: true },
        { label: "Picked Up", done: true },
        { label: "In Transit", done: true },
        { label: "Customs Hold", active: true },
        { label: "Out for Delivery", pending: true },
        { label: "Delivered", pending: true },
    ],
};
const TIMELINE_DOM: Record<string, TimelineStep[]> = {
    transit: [
        { label: "Order Created", done: true },
        { label: "Driver Assigned", done: true },
        { label: "Picked Up", done: true },
        { label: "En Route", active: true },
        { label: "Out for Delivery", pending: true },
        { label: "Delivered", pending: true },
    ],
    delivered: [
        { label: "Order Created", done: true },
        { label: "Driver Assigned", done: true },
        { label: "Picked Up", done: true },
        { label: "En Route", done: true },
        { label: "Out for Delivery", done: true },
        { label: "POD Confirmed", done: true },
    ],
    pending: [
        { label: "Order Created", done: true },
        { label: "Awaiting Driver", active: true },
        { label: "Picked Up", pending: true },
        { label: "En Route", pending: true },
        { label: "Delivered", pending: true },
    ],
    delayed: [
        { label: "Order Created", done: true },
        { label: "Driver Assigned", done: true },
        { label: "Picked Up", done: true },
        { label: "Delay — Traffic/Road", done: true, warn: true },
        { label: "En Route", active: true },
        { label: "Delivered", pending: true },
    ],
    customs: [
        { label: "Order Created", done: true },
        { label: "Driver Assigned", done: true },
        { label: "En Route", active: true },
        { label: "Out for Delivery", pending: true },
        { label: "Delivered", pending: true },
    ],
};

const INIT_COLUMNS: Column[] = [
    { key: "id", label: "Tracking ID", visible: true },
    { key: "type", label: "Type", visible: true },
    { key: "route", label: "Route", visible: true },
    { key: "customer", label: "Customer", visible: true },
    { key: "weight", label: "Weight", visible: true },
    { key: "mode", label: "Mode", visible: true },
    { key: "cargoType", label: "Cargo", visible: false },
    { key: "containers", label: "Containers", visible: false },
    { key: "eta", label: "ETA", visible: true },
    { key: "created", label: "Created", visible: false },
    { key: "status", label: "Status", visible: true },
];

export default function Shipments() {
    const {
        shipments,
        setShipments,
        reloadShipments,
        shipmentsLoading,
        shipmentsError,
        companySettings,
        showToast,
        hasRole,
        globalSearch,
        setGlobalSearch,
    } = useApp();
    const [columns, setColumns] = useState<Column[]>(INIT_COLUMNS);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const [sortField, setSortField] = useState("id");
    const [sortDir, setSortDir] = useState(1);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [detailId, setDetailId] = useState<string | null>(null);
    const [printShipment, setPrintShipment] = useState<Shipment | null>(null);
    const [showColMenu, setShowColMenu] = useState(false);
    const [transitionModal, setTransitionModal] = useState<{
        mode: "single" | "bulk";
        shipmentId?: string;
        targetStatus: ShipmentStatus;
    } | null>(null);
    const [transitionReason, setTransitionReason] = useState("");
    const [overrideTransition, setOverrideTransition] = useState(false);
    const [overrideReason, setOverrideReason] = useState("");
    const [transitionOccurredAt, setTransitionOccurredAt] = useState("");
    const [deliveryRecipientName, setDeliveryRecipientName] = useState("");
    const [deliveryRecipientPhone, setDeliveryRecipientPhone] = useState("");
    const [transitionBusy, setTransitionBusy] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<Shipment | null>(
        null,
    );
    const [detailEvents, setDetailEvents] = useState<ShipmentStatusEvent[]>([]);
    const [detailEventsLoading, setDetailEventsLoading] = useState(false);
    const colMenuRef = useRef<HTMLDivElement>(null);
    const isAdmin = hasRole("admin");

    const filtered = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        return shipments
            .filter((s) => {
                if (statusFilter !== "all" && s.status !== statusFilter)
                    return false;
                if (modeFilter !== "all" && s.mode !== modeFilter) return false;
                if (typeFilter !== "all" && s.type !== typeFilter) return false;
                if (
                    q &&
                    !`${s.awbNumber ?? s.id} ${s.customer} ${s.origin} ${s.dest} ${s.cargoType ?? ""}`
                        .toLowerCase()
                        .includes(q)
                )
                    return false;
                return true;
            })
            .sort((a, b) => {
                let va: number | string = a[
                    sortField as keyof Shipment
                ] as string;
                let vb: number | string = b[
                    sortField as keyof Shipment
                ] as string;
                if (sortField === "eta" || sortField === "created") {
                    va = (a[sortField as keyof Shipment] as Date).getTime();
                    vb = (b[sortField as keyof Shipment] as Date).getTime();
                }
                if (sortField === "weight") {
                    va = Number(a.weight);
                    vb = Number(b.weight);
                }
                if (va < vb) return -sortDir;
                if (va > vb) return sortDir;
                return 0;
            });
    }, [
        shipments,
        statusFilter,
        typeFilter,
        modeFilter,
        globalSearch,
        sortField,
        sortDir,
    ]);

    const visibleCols = columns.filter((c) => c.visible);
    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const detailShipment = detailId
        ? (shipments.find((s) => s.id === detailId) ?? null)
        : null;

    const getAllowedTransitions = (status: ShipmentStatus): ShipmentStatus[] =>
        STATUS_TRANSITIONS[status] ?? [];

    const getCommonBulkTransitions = (): ShipmentStatus[] => {
        const selected = shipments.filter((s) => selectedIds.has(s.id));
        if (selected.length === 0) return [];

        return ALL_STATUSES.filter((target) =>
            selected.every((s) =>
                getAllowedTransitions(s.status).includes(target),
            ),
        );
    };

    const counts = {
        transit: 0,
        delivered: 0,
        pending: 0,
        customs: 0,
        delayed: 0,
    };
    shipments.forEach((s) => {
        if (s.status in counts) (counts as Record<string, number>)[s.status]++;
    });

    function handleSort(field: string) {
        if (sortField === field) setSortDir((d) => d * -1);
        else {
            setSortField(field);
            setSortDir(1);
        }
    }

    function toggleRow(id: string, checked: boolean) {
        setSelectedIds((prev) => {
            const n = new Set(prev);
            checked ? n.add(id) : n.delete(id);
            return n;
        });
    }
    function toggleAll(checked: boolean) {
        setSelectedIds(() => {
            const n = new Set<string>();
            if (checked) pageItems.forEach((s) => n.add(s.id));
            return n;
        });
    }
    async function bulkUpdateStatus(
        status: ShipmentStatus,
        options?: {
            reason?: string;
            override?: boolean;
            overrideReason?: string;
            occurredAt?: string;
            recipientName?: string;
            recipientPhone?: string;
        },
    ) {
        const ids = [...selectedIds];
        try {
            await bulkUpdateApi(ids, status, options);
            showToast("Bulk status update applied", "green");
            setSelectedIds(new Set());
            await reloadShipments();
        } catch (e: any) {
            showToast(e?.message ?? "Bulk update failed", "red");
            await reloadShipments();
            throw e;
        }
    }
    async function bulkDelete() {
        if (!confirm(`Delete ${selectedIds.size} shipment(s)?`)) return;
        const ids = [...selectedIds];
        // Optimistic update
        setShipments((prev) => prev.filter((s) => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        try {
            await bulkDeleteApi(ids);
        } catch {
            showToast("Bulk delete failed", "red");
            reloadShipments();
        }
    }
    async function updateStatus(
        id: string,
        status: ShipmentStatus,
        options?: {
            reason?: string;
            override?: boolean;
            overrideReason?: string;
            occurredAt?: string;
            recipientName?: string;
            recipientPhone?: string;
        },
    ) {
        try {
            await patchShipmentStatus(id, status, options);
            showToast(`Shipment marked ${STATUS_LABEL[status]}`, "green");
            await reloadShipments();
        } catch (e: any) {
            showToast(e?.message ?? "Status update failed", "red");
            await reloadShipments();
            throw e;
        }
    }

    function openTransitionModal(config: {
        mode: "single" | "bulk";
        shipmentId?: string;
        targetStatus: ShipmentStatus;
    }) {
        setTransitionModal(config);
        setTransitionReason("");
        setOverrideTransition(false);
        setOverrideReason("");
        setTransitionOccurredAt(nowLocalDateTime());
        setDeliveryRecipientName("");
        setDeliveryRecipientPhone("");
    }

    async function confirmTransition() {
        if (!transitionModal) return;

        const requiresReason =
            transitionModal.targetStatus === "customs" ||
            transitionModal.targetStatus === "delayed";
        if (requiresReason && !transitionReason.trim()) {
            showToast(
                "Reason is required for customs and delayed transitions.",
                "amber",
            );
            return;
        }

        if (!transitionOccurredAt) {
            showToast(
                "Date and time are required for status updates.",
                "amber",
            );
            return;
        }

        if (
            transitionModal.targetStatus === "delivered" &&
            (!deliveryRecipientName.trim() || !deliveryRecipientPhone.trim())
        ) {
            showToast(
                "Recipient name and phone are required for delivered status.",
                "amber",
            );
            return;
        }

        if (overrideTransition && !isAdmin) {
            showToast("Only admins can override transitions.", "red");
            return;
        }

        if (overrideTransition && !overrideReason.trim()) {
            showToast("Override reason is required.", "amber");
            return;
        }

        setTransitionBusy(true);
        const options = {
            reason: transitionReason.trim() || undefined,
            override: overrideTransition || undefined,
            overrideReason: overrideReason.trim() || undefined,
            occurredAt: transitionOccurredAt || undefined,
            recipientName: deliveryRecipientName.trim() || undefined,
            recipientPhone: deliveryRecipientPhone.trim() || undefined,
        };

        try {
            if (
                transitionModal.mode === "single" &&
                transitionModal.shipmentId
            ) {
                await updateStatus(
                    transitionModal.shipmentId,
                    transitionModal.targetStatus,
                    options,
                );
            } else {
                await bulkUpdateStatus(transitionModal.targetStatus, options);
            }
            setTransitionModal(null);
        } finally {
            setTransitionBusy(false);
        }
    }
    async function deleteShipment(id: string) {
        if (!confirm("Delete this shipment?")) return;
        // Optimistic update
        setShipments((prev) => prev.filter((s) => s.id !== id));
        setDetailId(null);
        try {
            await deleteShipmentApi(id);
        } catch {
            showToast("Delete failed", "red");
            reloadShipments();
        }
    }
    function exportCSV() {
        const header = [
            "ID",
            "Origin",
            "Destination",
            "Customer",
            "Weight",
            "Mode",
            "Type",
            "Containers",
            "ETA",
            "Created",
            "Status",
        ];
        const rows = filtered.map((s) => [
            s.awbNumber || s.id,
            s.origin,
            s.dest,
            s.customer,
            s.weight,
            s.mode,
            s.type,
            s.containers || "",
            fmtDate(s.eta),
            fmtDate(s.created),
            STATUS_LABEL[s.status],
        ]);
        const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "shipments.csv";
        a.click();
    }

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (
                colMenuRef.current &&
                !colMenuRef.current.contains(e.target as Node)
            )
                setShowColMenu(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            if (!detailShipment) {
                setDetailEvents([]);
                return;
            }

            setDetailEventsLoading(true);
            try {
                const events = await fetchShipmentEvents(detailShipment.id);
                if (!cancelled) {
                    setDetailEvents(events);
                }
            } catch {
                if (!cancelled) {
                    setDetailEvents([]);
                }
            } finally {
                if (!cancelled) {
                    setDetailEventsLoading(false);
                }
            }
        }

        void loadEvents();
        return () => {
            cancelled = true;
        };
    }, [detailShipment?.id]);

    const getTimeline = (s: Shipment) => {
        const map = s.type === "international" ? TIMELINE_INT : TIMELINE_DOM;
        return map[s.status] || map.transit;
    };

    const formatEventDate = (value: string) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString();
    };

    const nowLocalDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 16);
    };

    const openEditModal = (shipment: Shipment) => {
        if (shipment.status !== "pending") {
            showToast("Only pending shipments can be edited.", "amber");
            return;
        }
        setEditingShipment(shipment);
        setEditModalOpen(true);
    };

    const shTotal = shipments.length || 1;
    const kpiItems = [
        {
            label: "Total Shipments",
            value: shipments.length,
            color: "var(--blue)",
            changeClass: "up",
            change: "↑ 8%",
            progress: 100,
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <rect x="2" y="4" width="14" height="11" rx="1.5" />
                    <path d="M2 8h14" />
                </svg>
            ),
            key: "all",
        },
        {
            label: "In Transit",
            value: counts.transit,
            color: "var(--amber)",
            changeClass: null,
            change: null,
            progress: Math.round((counts.transit / shTotal) * 100),
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
                    <circle cx="4.5" cy="14" r="1.5" />
                    <circle cx="10.5" cy="14" r="1.5" />
                    <circle cx="15" cy="14" r="1.5" />
                </svg>
            ),
            key: "transit",
        },
        {
            label: "Delivered",
            value: counts.delivered,
            color: "var(--green)",
            changeClass: null,
            change: null,
            progress: Math.round((counts.delivered / shTotal) * 100),
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
            key: "delivered",
        },
        {
            label: "Pending / Customs",
            value: counts.pending + counts.customs,
            color: "var(--purple)",
            changeClass: null,
            change: null,
            progress: Math.round(
                ((counts.pending + counts.customs) / shTotal) * 100,
            ),
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
            key: "pending",
        },
        {
            label: "Delayed",
            value: counts.delayed,
            color: "var(--red)",
            changeClass: null,
            change: null,
            progress: Math.round((counts.delayed / shTotal) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M9 2L1.5 15h15L9 2z" />
                    <path d="M9 7v4M9 13.5v.5" />
                </svg>
            ),
            key: "delayed",
        },
    ];

    if (shipmentsLoading)
        return (
            <div
                className="content"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 320,
                }}
            >
                <div style={{ textAlign: "center", color: "var(--text-3)" }}>
                    <svg
                        style={{
                            width: 32,
                            height: 32,
                            marginBottom: 12,
                            animation: "spin 1s linear infinite",
                        }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <div style={{ fontSize: 14 }}>Loading shipments…</div>
                </div>
            </div>
        );

    if (shipmentsError)
        return (
            <div
                className="content"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 320,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            fontSize: 14,
                            color: "var(--red)",
                            marginBottom: 12,
                        }}
                    >
                        ⚠ {shipmentsError}
                    </div>
                    <button className="btn primary" onClick={reloadShipments}>
                        Retry
                    </button>
                </div>
            </div>
        );

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
                    {kpiItems.map((item) => (
                        <div
                            key={item.key}
                            className="stat-card"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                setStatusFilter(item.key);
                                setPage(1);
                            }}
                        >
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
                                {item.change && (
                                    <span
                                        className={`stat-change ${item.changeClass}`}
                                    >
                                        {item.change}
                                    </span>
                                )}
                            </div>
                            <div
                                className="stat-value"
                                style={{
                                    color:
                                        item.key !== "all"
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
                            style={{ flex: 1, maxWidth: 300, minWidth: 180 }}
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
                                placeholder="Search ID, customer, origin, destination…"
                                value={globalSearch}
                                onChange={(e) => {
                                    setGlobalSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="filter-tabs">
                            {(
                                [
                                    "all",
                                    "transit",
                                    "delivered",
                                    "pending",
                                    "delayed",
                                    "customs",
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
                                    {s === "all" ? "All" : STATUS_LABEL[s]}
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <select
                                className="sh-select"
                                value={modeFilter}
                                onChange={(e) => {
                                    setModeFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">All Modes</option>
                                {(
                                    [
                                        "Sea",
                                        "Air",
                                        "Road",
                                        "Rail",
                                    ] as TransportMode[]
                                ).map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
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
                            <select
                                className="sh-select"
                                value={sortField}
                                onChange={(e) => {
                                    setSortField(e.target.value);
                                    setSortDir(1);
                                }}
                            >
                                <option value="id">Sort: ID</option>
                                <option value="eta">Sort: ETA</option>
                                <option value="weight">Sort: Weight</option>
                                <option value="customer">Sort: Customer</option>
                            </select>
                            <button className="btn" onClick={exportCSV}>
                                <svg
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M7 1v8M4 6l3 3 3-3" />
                                    <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
                                </svg>
                                Export
                            </button>
                            <div className="col-toggle-wrap" ref={colMenuRef}>
                                <button
                                    className="btn"
                                    onClick={() => setShowColMenu((v) => !v)}
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
                                    Columns
                                </button>
                                {showColMenu && (
                                    <div className="col-toggle-menu">
                                        {columns.map((c, i) => (
                                            <div
                                                key={c.key}
                                                className="col-toggle-item"
                                                onClick={() =>
                                                    setColumns((prev) =>
                                                        prev.map((col, j) =>
                                                            j === i
                                                                ? {
                                                                      ...col,
                                                                      visible:
                                                                          !col.visible,
                                                                  }
                                                                : col,
                                                        ),
                                                    )
                                                }
                                            >
                                                <div
                                                    className={`col-check${c.visible ? " checked" : ""}`}
                                                >
                                                    <svg
                                                        viewBox="0 0 9 7"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                    >
                                                        <path d="M1 3.5l2.5 2.5 5-5" />
                                                    </svg>
                                                </div>
                                                {c.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* BULK BAR */}
                    {selectedIds.size > 0 && (
                        <div
                            className="bulk-bar visible"
                            style={{
                                borderTop: "1px solid var(--blue-border)",
                                borderRadius: 0,
                            }}
                        >
                            <span className="bulk-count">
                                {selectedIds.size} selected
                            </span>
                            {getCommonBulkTransitions().length === 0 ? (
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text-3)",
                                    }}
                                >
                                    No shared valid transitions for selected
                                    shipments.
                                </span>
                            ) : (
                                getCommonBulkTransitions().map((status) => (
                                    <button
                                        key={status}
                                        className="btn"
                                        style={{
                                            padding: "5px 12px",
                                            fontSize: 12,
                                        }}
                                        onClick={() =>
                                            openTransitionModal({
                                                mode: "bulk",
                                                targetStatus: status,
                                            })
                                        }
                                    >
                                        Mark {STATUS_LABEL[status]}
                                    </button>
                                ))
                            )}
                            {isAdmin && (
                                <button
                                    className="btn"
                                    style={{
                                        padding: "5px 12px",
                                        fontSize: 12,
                                        color: "var(--amber)",
                                    }}
                                    onClick={() =>
                                        openTransitionModal({
                                            mode: "bulk",
                                            targetStatus: "transit",
                                        })
                                    }
                                >
                                    Force Update...
                                </button>
                            )}
                            <button
                                className="btn"
                                style={{
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    color: "var(--red)",
                                    borderColor: "var(--red-dim)",
                                }}
                                onClick={bulkDelete}
                            >
                                <svg
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M1 3h12M4 3V2a1 1 0 011-1h4a1 1 0 011 1v1M5 6v5M9 6v5M2 3l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
                                </svg>
                                Delete
                            </button>
                            <button
                                className="btn"
                                style={{
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    marginLeft: "auto",
                                }}
                                onClick={() => setSelectedIds(new Set())}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* TABLE CARD */}
                <div className="card" style={{ overflow: "hidden" }}>
                    <div className="sh-table-wrap">
                        <table className="sh-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 36, paddingLeft: 16 }}>
                                        <input
                                            type="checkbox"
                                            className="sh-checkbox"
                                            checked={
                                                pageItems.length > 0 &&
                                                pageItems.every((s) =>
                                                    selectedIds.has(s.id),
                                                )
                                            }
                                            onChange={(e) =>
                                                toggleAll(e.target.checked)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    {visibleCols.map((c) => (
                                        <th
                                            key={c.key}
                                            className={
                                                sortField === c.key
                                                    ? "sorted"
                                                    : ""
                                            }
                                            onClick={() => handleSort(c.key)}
                                        >
                                            {c.label}
                                            <span className="sort-icon">
                                                {sortField === c.key
                                                    ? sortDir > 0
                                                        ? "↑"
                                                        : "↓"
                                                    : "↕"}
                                            </span>
                                        </th>
                                    ))}
                                    <th style={{ width: 40 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={visibleCols.length + 2}
                                            style={{ padding: 0 }}
                                        >
                                            <div className="empty-state">
                                                <svg
                                                    viewBox="0 0 40 40"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.2"
                                                    strokeLinecap="round"
                                                >
                                                    <rect
                                                        x="4"
                                                        y="8"
                                                        width="32"
                                                        height="28"
                                                        rx="3"
                                                    />
                                                    <path d="M13 4v8M27 4v8M4 18h32" />
                                                </svg>
                                                <p>
                                                    No shipments match your
                                                    filters
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pageItems.map((s) => {
                                        const isIntl =
                                            s.type === "international";
                                        const isSelected =
                                            selectedIds.has(s.id) ||
                                            detailId === s.id;
                                        return (
                                            <tr
                                                key={s.id}
                                                className={
                                                    isSelected ? "selected" : ""
                                                }
                                                onClick={() =>
                                                    setDetailId(s.id)
                                                }
                                            >
                                                <td style={{ paddingLeft: 16 }}>
                                                    <input
                                                        type="checkbox"
                                                        className="sh-checkbox"
                                                        checked={selectedIds.has(
                                                            s.id,
                                                        )}
                                                        onChange={(e) =>
                                                            toggleRow(
                                                                s.id,
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </td>
                                                {visibleCols.map((c) => {
                                                    if (c.key === "id")
                                                        return (
                                                            <td
                                                                key="id"
                                                                className="mono"
                                                            >
                                                                {s.awbNumber ||
                                                                    s.id}
                                                            </td>
                                                        );
                                                    if (c.key === "type")
                                                        return (
                                                            <td key="type">
                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "inline-flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 4,
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        padding:
                                                                            "2px 8px",
                                                                        borderRadius: 20,
                                                                        background:
                                                                            isIntl
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
                                                            </td>
                                                        );
                                                    if (c.key === "route")
                                                        return (
                                                            <td key="route">
                                                                <span
                                                                    style={{
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {s.origin}
                                                                </span>
                                                                <span className="route-arrow">
                                                                    {" "}
                                                                    →{" "}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {s.dest}
                                                                </span>
                                                                <div className="text-muted">
                                                                    {
                                                                        s.originCountry
                                                                    }{" "}
                                                                    →{" "}
                                                                    {
                                                                        s.destCountry
                                                                    }
                                                                </div>
                                                            </td>
                                                        );
                                                    if (c.key === "customer")
                                                        return (
                                                            <td key="customer">
                                                                {s.customer}
                                                                <div className="text-muted">
                                                                    {s.email}
                                                                </div>
                                                            </td>
                                                        );
                                                    if (c.key === "weight")
                                                        return (
                                                            <td key="weight">
                                                                {s.weight.toLocaleString()}{" "}
                                                                kg
                                                            </td>
                                                        );
                                                    if (c.key === "mode")
                                                        return (
                                                            <td key="mode">
                                                                <ModeIcon
                                                                    mode={
                                                                        s.mode
                                                                    }
                                                                />
                                                                {s.mode}
                                                            </td>
                                                        );
                                                    if (c.key === "cargoType")
                                                        return (
                                                            <td key="cargo">
                                                                {s.cargoType ||
                                                                    "—"}
                                                            </td>
                                                        );
                                                    if (c.key === "containers")
                                                        return (
                                                            <td key="containers">
                                                                {isIntl
                                                                    ? s.containers ||
                                                                      "—"
                                                                    : "—"}
                                                            </td>
                                                        );
                                                    if (c.key === "eta")
                                                        return (
                                                            <td key="eta">
                                                                {fmtDate(s.eta)}
                                                            </td>
                                                        );
                                                    if (c.key === "created")
                                                        return (
                                                            <td key="created">
                                                                {fmtDate(
                                                                    s.created,
                                                                )}
                                                            </td>
                                                        );
                                                    if (c.key === "status")
                                                        return (
                                                            <td key="status">
                                                                <Badge
                                                                    variant={
                                                                        s.status
                                                                    }
                                                                >
                                                                    {
                                                                        STATUS_LABEL[
                                                                            s
                                                                                .status
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            </td>
                                                        );
                                                    return <td key={c.key} />;
                                                })}
                                                <td>
                                                    <button
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "var(--text-3)",
                                                            padding: 4,
                                                            borderRadius: 5,
                                                            display: "grid",
                                                            placeItems:
                                                                "center",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailId(s.id);
                                                        }}
                                                    >
                                                        <svg
                                                            viewBox="0 0 14 14"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.7"
                                                            strokeLinecap="round"
                                                            style={{
                                                                width: 13,
                                                                height: 13,
                                                            }}
                                                        >
                                                            <path d="M5 2h7v7" />
                                                            <path d="M12 2L2 12" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={page}
                        totalItems={filtered.length}
                        perPage={PER_PAGE}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {/* AIRWAYBILL PRINT MODAL */}
            {printShipment && (
                <AirwaybillPrint
                    shipment={printShipment}
                    companyName={companySettings.name}
                    companyAddress={companySettings.address}
                    onClose={() => setPrintShipment(null)}
                />
            )}

            {/* DRAWER OVERLAY */}
            {detailShipment && (
                <div
                    className="drawer-overlay open"
                    onClick={() => setDetailId(null)}
                />
            )}

            {/* DETAIL PANEL */}
            {detailShipment && (
                <div className="detail-panel open">
                    <div className="dp-header">
                        <div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {detailShipment.id}
                            </div>
                            {detailShipment.awbNumber && (
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "var(--text-3)",
                                        marginTop: 2,
                                        fontFamily: "monospace",
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    AWB:{" "}
                                    <span
                                        style={{
                                            color: "var(--blue)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {detailShipment.awbNumber}
                                    </span>
                                </div>
                            )}
                            <div style={{ marginTop: 4 }}>
                                <Badge variant={detailShipment.status}>
                                    {STATUS_LABEL[detailShipment.status]}
                                </Badge>{" "}
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: 20,
                                        background:
                                            detailShipment.type ===
                                            "international"
                                                ? "var(--blue-dim)"
                                                : "var(--green-dim)",
                                        color:
                                            detailShipment.type ===
                                            "international"
                                                ? "var(--blue)"
                                                : "var(--green)",
                                    }}
                                >
                                    {detailShipment.type === "international"
                                        ? "🌐 International"
                                        : "🏠 Domestic"}
                                </span>
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
                    <div className="dp-scroll">
                        {/* Progress */}
                        {(() => {
                            const steps = getTimeline(detailShipment);
                            const doneCount = steps.filter(
                                (st) => st.done,
                            ).length;
                            return (
                                <div
                                    style={{
                                        padding: "16px 20px",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 11.5,
                                            color: "var(--text-3)",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <span>Progress</span>
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                color: "var(--text-2)",
                                            }}
                                        >
                                            {doneCount}/{steps.length} steps
                                        </span>
                                    </div>
                                    <div className="progress-steps">
                                        {steps.map((st, i) => (
                                            <div
                                                key={i}
                                                className={`ps-step${st.done ? " done" : st.active ? " active" : ""}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Route */}
                        <div className="dp-section">
                            <div className="dp-section-title">Route</div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 12,
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        background: "var(--bg-3)",
                                        borderRadius: 7,
                                        padding: "8px 12px",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "var(--text-3)",
                                            textTransform: "uppercase",
                                            letterSpacing: ".05em",
                                        }}
                                    >
                                        {detailShipment.originCountry}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {detailShipment.origin}
                                    </div>
                                </div>
                                <svg
                                    viewBox="0 0 20 10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    style={{
                                        width: 28,
                                        flexShrink: 0,
                                        color: "var(--text-3)",
                                    }}
                                >
                                    <path d="M2 5h16M14 2l4 3-4 3" />
                                </svg>
                                <div
                                    style={{
                                        flex: 1,
                                        background: "var(--bg-3)",
                                        borderRadius: 7,
                                        padding: "8px 12px",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "var(--text-3)",
                                            textTransform: "uppercase",
                                            letterSpacing: ".05em",
                                        }}
                                    >
                                        {detailShipment.destCountry}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {detailShipment.dest}
                                    </div>
                                </div>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Mode</span>
                                <span className="dp-val">
                                    <ModeIcon mode={detailShipment.mode} />
                                    {detailShipment.mode}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">ETA</span>
                                <span className="dp-val mono">
                                    {fmtDate(detailShipment.eta)}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Created</span>
                                <span className="dp-val mono">
                                    {fmtDate(detailShipment.created)}
                                </span>
                            </div>
                        </div>

                        {/* Cargo */}
                        <div className="dp-section">
                            <div className="dp-section-title">Cargo</div>
                            <div className="dp-row">
                                <span className="dp-key">Customer</span>
                                <span className="dp-val">
                                    {detailShipment.customer}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Cargo Type</span>
                                <span className="dp-val">
                                    {detailShipment.cargoType || "—"}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Pieces</span>
                                <span className="dp-val">
                                    {detailShipment.pieces || "—"}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Weight</span>
                                <span className="dp-val">
                                    {detailShipment.weight.toLocaleString()} kg
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Contents</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        textAlign: "right",
                                        maxWidth: 180,
                                    }}
                                >
                                    {detailShipment.contents || "—"}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Declared Value</span>
                                <span className="dp-val">
                                    {detailShipment.declaredValue || "—"}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Insurance</span>
                                <span className="dp-val">
                                    {detailShipment.insurance || "—"}
                                </span>
                            </div>
                        </div>

                        {/* Consignor */}
                        {detailShipment.consignor ? (
                            <div className="dp-section">
                                <div className="dp-section-title">
                                    Consignor (Sender)
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Company</span>
                                    <span className="dp-val">
                                        {detailShipment.consignor.companyName}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Name</span>
                                    <span className="dp-val">
                                        {detailShipment.consignor.contactName ||
                                            "—"}
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
                                        {detailShipment.consignor.streetAddress}
                                        , {detailShipment.consignor.cityTown}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Country</span>
                                    <span className="dp-val">
                                        {detailShipment.consignor.country ||
                                            "—"}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Tel</span>
                                    <span className="dp-val">
                                        {detailShipment.consignor.tel || "—"}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Email</span>
                                    <span
                                        className="dp-val"
                                        style={{ color: "var(--blue)" }}
                                    >
                                        {detailShipment.consignor.email || "—"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="dp-section">
                                <div className="dp-section-title">Contact</div>
                                <div className="dp-row">
                                    <span className="dp-key">Name</span>
                                    <span className="dp-val">
                                        {detailShipment.contact}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Email</span>
                                    <span
                                        className="dp-val"
                                        style={{ color: "var(--blue)" }}
                                    >
                                        {detailShipment.email}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Phone</span>
                                    <span className="dp-val">
                                        {detailShipment.phone || "—"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Consignee */}
                        {detailShipment.consignee && (
                            <div className="dp-section">
                                <div className="dp-section-title">
                                    Consignee (Recipient)
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Company</span>
                                    <span className="dp-val">
                                        {detailShipment.consignee.companyName}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Name</span>
                                    <span className="dp-val">
                                        {detailShipment.consignee.contactName ||
                                            "—"}
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
                                        {detailShipment.consignee.streetAddress}
                                        , {detailShipment.consignee.cityTown}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Country</span>
                                    <span className="dp-val">
                                        {detailShipment.consignee.country ||
                                            "—"}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Tel</span>
                                    <span className="dp-val">
                                        {detailShipment.consignee.tel || "—"}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Email</span>
                                    <span
                                        className="dp-val"
                                        style={{ color: "var(--blue)" }}
                                    >
                                        {detailShipment.consignee.email || "—"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="dp-section">
                            <div className="dp-section-title">
                                Tracking Timeline
                            </div>
                        </div>
                        <div className="timeline">
                            {detailEventsLoading ? (
                                <div className="tl-meta">
                                    Loading event history...
                                </div>
                            ) : detailEvents.length > 0 ? (
                                detailEvents.map((event) => (
                                    <div key={event.id} className="tl-item">
                                        <div className="tl-dot done" />
                                        <div className="tl-body">
                                            <div className="tl-label">
                                                {STATUS_LABEL[event.new_status]}
                                            </div>
                                            <div className="tl-meta">
                                                {formatEventDate(
                                                    event.occurred_at,
                                                )}
                                            </div>
                                            {event.reason && (
                                                <div className="tl-meta">
                                                    Reason: {event.reason}
                                                </div>
                                            )}
                                            {event.new_status === "delivered" &&
                                                (event.metadata as any)
                                                    ?.delivery
                                                    ?.recipient_name && (
                                                    <div className="tl-meta">
                                                        Received by:{" "}
                                                        {
                                                            (
                                                                event.metadata as any
                                                            ).delivery
                                                                .recipient_name
                                                        }
                                                    </div>
                                                )}
                                            {event.new_status === "delivered" &&
                                                (event.metadata as any)
                                                    ?.delivery
                                                    ?.recipient_phone && (
                                                    <div className="tl-meta">
                                                        Recipient Phone:{" "}
                                                        {
                                                            (
                                                                event.metadata as any
                                                            ).delivery
                                                                .recipient_phone
                                                        }
                                                    </div>
                                                )}
                                            {event.is_override &&
                                                event.override_reason && (
                                                    <div
                                                        className="tl-meta"
                                                        style={{
                                                            color: "var(--amber)",
                                                        }}
                                                    >
                                                        Override:{" "}
                                                        {event.override_reason}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                getTimeline(detailShipment).map((st, i) => (
                                    <div key={i} className="tl-item">
                                        <div
                                            className={`tl-dot${st.done ? " done" : st.active ? " active" : " pending"}`}
                                        />
                                        <div className="tl-body">
                                            <div
                                                className="tl-label"
                                                style={
                                                    st.warn
                                                        ? {
                                                              color: "var(--amber)",
                                                          }
                                                        : {}
                                                }
                                            >
                                                {st.label}
                                            </div>
                                            <div className="tl-meta">
                                                {st.done
                                                    ? i === 0
                                                        ? fmtDate(
                                                              detailShipment.created,
                                                          )
                                                        : "Completed"
                                                    : st.active
                                                      ? "In progress"
                                                      : "Awaiting"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Actions */}
                        <div className="dp-section">
                            <div
                                className="dp-section-title"
                                style={{ marginBottom: 10 }}
                            >
                                Actions
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 8,
                                }}
                            >
                                <button
                                    className="btn primary"
                                    style={{
                                        justifyContent: "center",
                                        gridColumn: "1 / -1",
                                    }}
                                    onClick={() =>
                                        setPrintShipment(detailShipment)
                                    }
                                >
                                    <svg
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        style={{ width: 13, height: 13 }}
                                    >
                                        <path d="M4 6V2h8v4M2 6h12a1 1 0 011 1v5a1 1 0 01-1 1h-2v2H4v-2H2a1 1 0 01-1-1V7a1 1 0 011-1z" />
                                    </svg>
                                    Print Airwaybill
                                </button>
                                {detailShipment.status === "pending" && (
                                    <button
                                        className="btn"
                                        style={{
                                            justifyContent: "center",
                                            gridColumn: "1 / -1",
                                        }}
                                        onClick={() =>
                                            openEditModal(detailShipment)
                                        }
                                    >
                                        Edit Pending Shipment
                                    </button>
                                )}
                                {getAllowedTransitions(
                                    detailShipment.status,
                                ).map((status) => (
                                    <button
                                        key={status}
                                        className="btn"
                                        style={{ justifyContent: "center" }}
                                        onClick={() =>
                                            openTransitionModal({
                                                mode: "single",
                                                shipmentId: detailShipment.id,
                                                targetStatus: status,
                                            })
                                        }
                                    >
                                        Mark {STATUS_LABEL[status]}
                                    </button>
                                ))}
                                {isAdmin && (
                                    <button
                                        className="btn"
                                        style={{
                                            justifyContent: "center",
                                            color: "var(--amber)",
                                            borderColor:
                                                "rgba(245,158,11,0.25)",
                                        }}
                                        onClick={() =>
                                            openTransitionModal({
                                                mode: "single",
                                                shipmentId: detailShipment.id,
                                                targetStatus:
                                                    detailShipment.status ===
                                                    "delivered"
                                                        ? "transit"
                                                        : "delivered",
                                            })
                                        }
                                    >
                                        Force Status Change...
                                    </button>
                                )}
                                <button
                                    className="btn"
                                    style={{
                                        justifyContent: "center",
                                        color: "var(--red)",
                                    }}
                                    onClick={() =>
                                        deleteShipment(detailShipment.id)
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editModalOpen && editingShipment && (
                <NewShipmentModal
                    modalMode="edit"
                    initialShipment={editingShipment}
                    onSaved={(updated) => {
                        setShipments((prev) =>
                            prev.map((shipment) =>
                                shipment.id === updated.id ? updated : shipment,
                            ),
                        );
                    }}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingShipment(null);
                    }}
                />
            )}

            {transitionModal && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !transitionBusy) {
                            setTransitionModal(null);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 540 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                Confirm Status Change
                            </span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!transitionBusy)
                                        setTransitionModal(null);
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
                        <div
                            className="modal-body"
                            style={{ display: "grid", gap: 12 }}
                        >
                            <div className="dp-row">
                                <span className="dp-key">Scope</span>
                                <span className="dp-val">
                                    {transitionModal.mode === "single"
                                        ? "Single Shipment"
                                        : `Bulk (${selectedIds.size})`}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Target Status</span>
                                <span className="dp-val">
                                    {STATUS_LABEL[transitionModal.targetStatus]}
                                </span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Status Date & Time (required)
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={transitionOccurredAt}
                                    onChange={(e) =>
                                        setTransitionOccurredAt(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            {isAdmin && (
                                <div className="form-group">
                                    <label className="form-label">
                                        Override Target Status
                                    </label>
                                    <select
                                        className="form-select"
                                        value={transitionModal.targetStatus}
                                        onChange={(e) =>
                                            setTransitionModal((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          targetStatus: e.target
                                                              .value as ShipmentStatus,
                                                      }
                                                    : prev,
                                            )
                                        }
                                        disabled={!overrideTransition}
                                    >
                                        {ALL_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {STATUS_LABEL[status]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {isAdmin && (
                                <label className="rbac-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={overrideTransition}
                                        onChange={(e) =>
                                            setOverrideTransition(
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <span>
                                        Use admin override for this transition
                                    </span>
                                </label>
                            )}
                            <div className="form-group">
                                <label className="form-label">
                                    Reason{" "}
                                    {transitionModal.targetStatus ===
                                        "customs" ||
                                    transitionModal.targetStatus === "delayed"
                                        ? "(required)"
                                        : "(optional)"}
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={transitionReason}
                                    onChange={(e) =>
                                        setTransitionReason(e.target.value)
                                    }
                                    placeholder="Reason for this status change"
                                />
                            </div>
                            {transitionModal.targetStatus === "delivered" && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Recipient Name (required)
                                        </label>
                                        <input
                                            className="form-input"
                                            value={deliveryRecipientName}
                                            onChange={(e) =>
                                                setDeliveryRecipientName(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Person who received delivery"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Recipient Phone (required)
                                        </label>
                                        <input
                                            className="form-input"
                                            value={deliveryRecipientPhone}
                                            onChange={(e) =>
                                                setDeliveryRecipientPhone(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Recipient phone number"
                                        />
                                    </div>
                                </>
                            )}
                            {overrideTransition && (
                                <div className="form-group">
                                    <label className="form-label">
                                        Override Reason (required)
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        value={overrideReason}
                                        onChange={(e) =>
                                            setOverrideReason(e.target.value)
                                        }
                                        placeholder="Explain why override is necessary"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                onClick={() => setTransitionModal(null)}
                                disabled={transitionBusy}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn primary"
                                onClick={() => {
                                    void confirmTransition();
                                }}
                                disabled={transitionBusy}
                            >
                                {transitionBusy
                                    ? "Applying..."
                                    : "Apply Status Change"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
