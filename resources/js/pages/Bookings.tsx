import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import Badge, { STATUS_LABEL } from "../components/shared/Badge";
import Pagination from "../components/shared/Pagination";
import { ModeIcon } from "../components/shared/ModeIcon";
import { fmtDate, timeAgo } from "../data/mock";
import {
    convertBookingToShipment,
    patchBookingStatus,
    updateBooking,
} from "../lib/api";
import type { Booking, BookingStatus } from "../types";

const PER_PAGE = 10;
const URGENCY_COLOR: Record<string, string> = {
    high: "var(--red)",
    medium: "var(--amber)",
    low: "var(--green)",
};

export default function Bookings() {
    const {
        bookings,
        setBookings,
        showToast,
        reloadBookings,
        globalSearch,
        setGlobalSearch,
    } = useApp();
    const [statusFilter, setStatusFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [detailId, setDetailId] = useState<string | null>(null);
    const [actionDialog, setActionDialog] = useState<{
        type: "convert" | "reject";
        bookingId: string;
    } | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const filtered = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        return bookings.filter((b) => {
            if (statusFilter !== "all" && b.status !== statusFilter)
                return false;
            if (urgencyFilter !== "all" && b.urgency !== urgencyFilter)
                return false;
            if (modeFilter !== "all" && b.mode !== modeFilter) return false;
            if (
                q &&
                !`${b.id} ${b.customer} ${b.origin} ${b.dest} ${b.type}`
                    .toLowerCase()
                    .includes(q)
            )
                return false;
            return true;
        });
    }, [bookings, statusFilter, urgencyFilter, modeFilter, globalSearch]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const detailBooking = detailId
        ? (bookings.find((b) => b.id === detailId) ?? null)
        : null;
    const dialogBooking = actionDialog
        ? (bookings.find((b) => b.id === actionDialog.bookingId) ?? null)
        : null;

    const kpis = useMemo(() => {
        const c = {
            new: 0,
            reviewing: 0,
            approved: 0,
            converted: 0,
            rejected: 0,
        };
        bookings.forEach((b) => {
            if (b.status in c) (c as Record<string, number>)[b.status]++;
        });
        return c;
    }, [bookings]);

    async function updateStatus(id: string, status: BookingStatus) {
        try {
            const updated = await patchBookingStatus(id, status);
            setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
            showToast(
                status === "approved"
                    ? "Booking approved"
                    : `Booking ${status}`,
                status === "approved"
                    ? "green"
                    : status === "rejected"
                      ? "red"
                      : "blue",
            );
            setDetailId(id);
        } catch (e: any) {
            showToast(e.message ?? "Failed to update booking status", "red");
        }
    }

    function onNoteChange(id: string, val: string) {
        setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, notes: val } : b)),
        );
    }

    async function persistNote(id: string, val: string) {
        try {
            const updated = await updateBooking(id, { notes: val });
            setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        } catch (e: any) {
            showToast(e.message ?? "Failed to save note", "red");
        }
    }

    async function convertToShipment(id: string): Promise<boolean> {
        try {
            await convertBookingToShipment(id);
            await reloadBookings();
            showToast(
                "Booking converted to shipment and customer notified",
                "green",
            );
            return true;
        } catch (e: any) {
            showToast(e.message ?? "Failed to convert booking", "red");
            return false;
        }
    }

    async function rejectBooking(id: string): Promise<boolean> {
        try {
            const updated = await patchBookingStatus(id, "rejected");
            setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
            setDetailId(id);
            showToast("Booking rejected and customer notified", "red");
            return true;
        } catch (e: any) {
            showToast(e.message ?? "Failed to reject booking", "red");
            return false;
        }
    }

    async function confirmDialogAction() {
        if (!actionDialog) return;

        setActionBusy(true);
        const bookingId = actionDialog.bookingId;
        const actionType = actionDialog.type;

        const ok =
            actionType === "convert"
                ? await convertToShipment(bookingId)
                : await rejectBooking(bookingId);

        setActionBusy(false);
        if (ok) {
            setActionDialog(null);
        }
    }

    const bkTotal = bookings.length || 1;
    const bkKpiItems = [
        {
            label: "Total Requests",
            value: bookings.length,
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
                    <rect x="2" y="3" width="14" height="13" rx="1.5" />
                    <path d="M2 7h14" />
                    <path d="M6 1v4M12 1v4" />
                </svg>
            ),
            key: "all",
        },
        {
            label: "New / Unreviewed",
            value: kpis.new,
            color: "var(--blue)",
            progress: Math.round((kpis.new / bkTotal) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M9 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
                </svg>
            ),
            key: "new",
        },
        {
            label: "Under Review",
            value: kpis.reviewing,
            color: "var(--purple)",
            progress: Math.round((kpis.reviewing / bkTotal) * 100),
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
            key: "reviewing",
        },
        {
            label: "Converted",
            value: kpis.converted,
            color: "var(--green)",
            progress: Math.round((kpis.converted / bkTotal) * 100),
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
            key: "converted",
        },
        {
            label: "Rejected",
            value: kpis.rejected,
            color: "var(--red)",
            progress: Math.round((kpis.rejected / bkTotal) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M5 5l8 8M13 5l-8 8" />
                </svg>
            ),
            key: "rejected",
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
                    {bkKpiItems.map((item) => (
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
                            style={{ flex: 1, maxWidth: 280, minWidth: 180 }}
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
                                placeholder="Search ID, customer, route…"
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
                                    "new",
                                    "reviewing",
                                    "approved",
                                    "converted",
                                    "rejected",
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
                        <select
                            className="sh-select"
                            value={urgencyFilter}
                            onChange={(e) => {
                                setUrgencyFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Urgency</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
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
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div className="view-toggle">
                                <button
                                    className={`view-btn${view === "grid" ? " active" : ""}`}
                                    onClick={() => setView("grid")}
                                    title="Grid view"
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
                                    title="List view"
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
                                className="btn"
                                style={{
                                    color: "var(--amber)",
                                    borderColor: "rgba(245,158,11,0.3)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    style={{ width: 13, height: 13 }}
                                >
                                    <path d="M7 10V2M4 5l3-3 3 3" />
                                    <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
                                </svg>
                                Simulate Incoming
                            </button>
                            <button className="btn">
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
                        </div>
                    </div>
                </div>

                {/* GRID / LIST VIEW */}
                <div>
                    {view === "grid" ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill,minmax(280px,1fr))",
                                gap: 12,
                            }}
                        >
                            {pageItems.length === 0 ? (
                                <div style={{ gridColumn: "1/-1" }}>
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
                                        </svg>
                                        <p>No bookings match your filters</p>
                                    </div>
                                </div>
                            ) : (
                                pageItems.map((b) => (
                                    <div
                                        key={b.id}
                                        className={`bk-card${detailId === b.id ? " selected" : ""}`}
                                        onClick={() => setDetailId(b.id)}
                                    >
                                        <div className="bk-card-top">
                                            <span className="bk-card-id">
                                                {b.id}
                                            </span>
                                            <span className="bk-card-time">
                                                {timeAgo(b.received)}
                                            </span>
                                        </div>
                                        <div className="bk-card-name">
                                            {b.customer}
                                        </div>
                                        <div
                                            className="bk-card-route"
                                            style={{ marginBottom: 6 }}
                                        >
                                            <span>{b.origin}</span>
                                            <svg
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                style={{
                                                    width: 10,
                                                    flexShrink: 0,
                                                    color: "var(--text-3)",
                                                }}
                                            >
                                                <path d="M1 3h8M6 1l2 2-2 2" />
                                            </svg>
                                            <span>{b.dest}</span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--text-3)",
                                                marginBottom: 10,
                                            }}
                                        >
                                            {b.type} ·{" "}
                                            {b.weight.toLocaleString()} kg ·{" "}
                                            {b.containers} ctr
                                        </div>
                                        <div className="bk-card-footer">
                                            <Badge
                                                variant={b.status}
                                                style={{ fontSize: 11 }}
                                            >
                                                {STATUS_LABEL[b.status]}
                                            </Badge>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 11,
                                                        color: "var(--text-3)",
                                                    }}
                                                >
                                                    <ModeIcon mode={b.mode} />
                                                    {b.mode}
                                                </div>
                                                <div
                                                    style={{
                                                        width: 1,
                                                        height: 10,
                                                        background:
                                                            "var(--border)",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 11,
                                                        color: URGENCY_COLOR[
                                                            b.urgency
                                                        ],
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 5,
                                                            height: 5,
                                                            borderRadius: "50%",
                                                            background:
                                                                URGENCY_COLOR[
                                                                    b.urgency
                                                                ],
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    {b.urgency}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ overflow: "hidden" }}>
                            <div className="bk-table-wrap">
                                <table className="bk-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Route</th>
                                            <th>Mode</th>
                                            <th>Type</th>
                                            <th>Weight</th>
                                            <th>Urgency</th>
                                            <th>Received</th>
                                            <th>Status</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={10}>
                                                    <div className="empty-state">
                                                        <p>
                                                            No bookings match
                                                            your filters
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            pageItems.map((b) => (
                                                <tr
                                                    key={b.id}
                                                    className={
                                                        detailId === b.id
                                                            ? "bk-selected-row"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setDetailId(b.id)
                                                    }
                                                >
                                                    <td className="mono">
                                                        {b.id}
                                                    </td>
                                                    <td>
                                                        {b.customer}
                                                        <div className="text-muted">
                                                            {b.email}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {b.origin} → {b.dest}
                                                    </td>
                                                    <td>
                                                        <ModeIcon
                                                            mode={b.mode}
                                                        />
                                                        {b.mode}
                                                    </td>
                                                    <td>{b.type}</td>
                                                    <td>
                                                        {b.weight.toLocaleString()}{" "}
                                                        kg
                                                    </td>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 5,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius:
                                                                        "50%",
                                                                    background:
                                                                        URGENCY_COLOR[
                                                                            b
                                                                                .urgency
                                                                        ],
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    textTransform:
                                                                        "capitalize",
                                                                    fontSize: 12.5,
                                                                }}
                                                            >
                                                                {b.urgency}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            fontSize: 12,
                                                            color: "var(--text-3)",
                                                        }}
                                                    >
                                                        {fmtDate(b.received)}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            variant={b.status}
                                                        >
                                                            {
                                                                STATUS_LABEL[
                                                                    b.status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <button
                                                            style={{
                                                                background:
                                                                    "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                color: "var(--text-3)",
                                                                padding: 4,
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDetailId(
                                                                    b.id,
                                                                );
                                                            }}
                                                        >
                                                            ↗
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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

            {/* DRAWER OVERLAY */}
            {detailBooking && (
                <div
                    className="drawer-overlay open"
                    onClick={() => setDetailId(null)}
                />
            )}

            {/* DETAIL PANEL */}
            {detailBooking && (
                <div className="bk-detail open">
                    <div className="dp-header">
                        <div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {detailBooking.id}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Badge variant={detailBooking.status}>
                                    {STATUS_LABEL[detailBooking.status]}
                                </Badge>{" "}
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 11.5,
                                        color: URGENCY_COLOR[
                                            detailBooking.urgency
                                        ],
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background:
                                                URGENCY_COLOR[
                                                    detailBooking.urgency
                                                ],
                                            display: "inline-block",
                                        }}
                                    />
                                    {detailBooking.urgency} urgency
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
                    <div className="bk-detail-scroll">
                        {/* Requester */}
                        <div className="dp-section">
                            <div className="dp-section-title">Requester</div>
                            <div className="dp-row">
                                <span className="dp-key">Company</span>
                                <span className="dp-val">
                                    {detailBooking.customer}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Contact</span>
                                <span className="dp-val">
                                    {detailBooking.contact}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Email</span>
                                <span
                                    className="dp-val"
                                    style={{ color: "var(--blue)" }}
                                >
                                    {detailBooking.email}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Phone</span>
                                <span className="dp-val">
                                    {detailBooking.phone}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Received</span>
                                <span className="dp-val mono">
                                    {fmtDate(detailBooking.received)}
                                </span>
                            </div>
                            {detailBooking.assignedTo && (
                                <div className="dp-row">
                                    <span className="dp-key">Assigned To</span>
                                    <span className="dp-val">
                                        {detailBooking.assignedTo}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Shipment Request */}
                        <div className="dp-section">
                            <div className="dp-section-title">
                                Shipment Request
                            </div>
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
                                            fontSize: 11,
                                            color: "var(--text-3)",
                                        }}
                                    >
                                        Origin
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {detailBooking.origin}
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
                                            fontSize: 11,
                                            color: "var(--text-3)",
                                        }}
                                    >
                                        Destination
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {detailBooking.dest}
                                    </div>
                                </div>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Mode</span>
                                <span className="dp-val">
                                    <ModeIcon mode={detailBooking.mode} />
                                    {detailBooking.mode}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Cargo Type</span>
                                <span className="dp-val">
                                    {detailBooking.type}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Weight</span>
                                <span className="dp-val">
                                    {detailBooking.weight.toLocaleString()} kg
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Containers</span>
                                <span className="dp-val">
                                    {detailBooking.containers}
                                </span>
                            </div>
                            {detailBooking.message && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        background: "var(--bg-3)",
                                        borderRadius: 7,
                                        padding: "10px 12px",
                                        fontSize: 12.5,
                                        color: "var(--text-2)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-3)",
                                            marginBottom: 4,
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: ".06em",
                                        }}
                                    >
                                        Customer Note
                                    </div>
                                    {detailBooking.message}
                                </div>
                            )}
                        </div>

                        {/* Conversion status */}
                        {detailBooking.status === "converted" && (
                            <div className="dp-section">
                                <div className="dp-section-title">
                                    Conversion
                                </div>
                                <div
                                    style={{
                                        background: "var(--green-dim)",
                                        border: "1px solid rgba(34,197,94,0.2)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: "var(--green)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <path d="M2 9l5 5 9-9" />
                                    </svg>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "var(--green)",
                                            }}
                                        >
                                            Converted to Shipment
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-3)",
                                                marginTop: 2,
                                            }}
                                        >
                                            Shipment ID:{" "}
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'DM Mono',monospace",
                                                    color: "var(--blue)",
                                                }}
                                            >
                                                {detailBooking.convertedTo}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {detailBooking.status === "rejected" && (
                            <div className="dp-section">
                                <div
                                    style={{
                                        background: "var(--red-dim)",
                                        border: "1px solid rgba(239,68,68,0.2)",
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: "var(--red)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <path d="M5 5l8 8M13 5l-8 8" />
                                    </svg>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "var(--red)",
                                            }}
                                        >
                                            Booking Rejected
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-3)",
                                                marginTop: 2,
                                            }}
                                        >
                                            This booking request was declined.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="dp-section">
                            <div
                                className="dp-section-title"
                                style={{ marginBottom: 8 }}
                            >
                                Internal Notes
                            </div>
                            <textarea
                                style={{
                                    width: "100%",
                                    background: "var(--bg-3)",
                                    border: "1px solid var(--border-strong)",
                                    borderRadius: 7,
                                    padding: "8px 10px",
                                    fontFamily: "inherit",
                                    fontSize: 12.5,
                                    color: "var(--text-1)",
                                    outline: "none",
                                    resize: "vertical",
                                    minHeight: 64,
                                    lineHeight: 1.5,
                                }}
                                placeholder="Add ops note…"
                                value={detailBooking.notes}
                                onChange={(e) =>
                                    onNoteChange(
                                        detailBooking.id,
                                        e.target.value,
                                    )
                                }
                                onBlur={(e) =>
                                    persistNote(
                                        detailBooking.id,
                                        e.target.value,
                                    )
                                }
                            />
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
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {detailBooking.status !== "converted" &&
                                    detailBooking.status !== "rejected" && (
                                        <button
                                            className="btn primary"
                                            style={{
                                                justifyContent: "center",
                                                width: "100%",
                                            }}
                                            onClick={() =>
                                                setActionDialog({
                                                    type: "convert",
                                                    bookingId: detailBooking.id,
                                                })
                                            }
                                        >
                                            <svg
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                }}
                                            >
                                                <path d="M7 1v12M1 7h12" />
                                            </svg>
                                            Convert to Shipment
                                        </button>
                                    )}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 8,
                                    }}
                                >
                                    {detailBooking.status !== "reviewing" &&
                                        detailBooking.status !== "converted" &&
                                        detailBooking.status !== "rejected" && (
                                            <button
                                                className="btn"
                                                style={{
                                                    justifyContent: "center",
                                                }}
                                                onClick={() =>
                                                    updateStatus(
                                                        detailBooking.id,
                                                        "reviewing",
                                                    )
                                                }
                                            >
                                                Mark Reviewing
                                            </button>
                                        )}
                                    {detailBooking.status !== "approved" &&
                                        detailBooking.status !== "converted" &&
                                        detailBooking.status !== "rejected" && (
                                            <button
                                                className="btn"
                                                style={{
                                                    justifyContent: "center",
                                                    color: "var(--green)",
                                                }}
                                                onClick={() =>
                                                    updateStatus(
                                                        detailBooking.id,
                                                        "approved",
                                                    )
                                                }
                                            >
                                                Approve
                                            </button>
                                        )}
                                    {detailBooking.status !== "rejected" &&
                                        detailBooking.status !==
                                            "converted" && (
                                            <button
                                                className="btn"
                                                style={{
                                                    justifyContent: "center",
                                                    color: "var(--red)",
                                                }}
                                                onClick={() =>
                                                    setActionDialog({
                                                        type: "reject",
                                                        bookingId:
                                                            detailBooking.id,
                                                    })
                                                }
                                            >
                                                Reject
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {actionDialog && dialogBooking && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !actionBusy) {
                            setActionDialog(null);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 520 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {actionDialog.type === "convert"
                                    ? "Confirm Conversion"
                                    : "Confirm Rejection"}
                            </span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!actionBusy) {
                                        setActionDialog(null);
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

                        <div
                            className="modal-body"
                            style={{ display: "grid", gap: 12 }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--bg-3)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 999,
                                        display: "grid",
                                        placeItems: "center",
                                        color:
                                            actionDialog.type === "convert"
                                                ? "var(--green)"
                                                : "var(--red)",
                                        background:
                                            actionDialog.type === "convert"
                                                ? "var(--green-dim)"
                                                : "var(--red-dim)",
                                        flexShrink: 0,
                                    }}
                                >
                                    {actionDialog.type === "convert"
                                        ? "✓"
                                        : "!"}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-2)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {actionDialog.type === "convert"
                                        ? "This will create a shipment and send a conversion email to the customer."
                                        : "This will reject the booking and send a rejection email to the customer."}
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 6,
                                    fontSize: 12.5,
                                }}
                            >
                                <div className="dp-row">
                                    <span className="dp-key">Booking</span>
                                    <span className="dp-val mono">
                                        {dialogBooking.id}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Customer</span>
                                    <span className="dp-val">
                                        {dialogBooking.customer}
                                    </span>
                                </div>
                                <div className="dp-row">
                                    <span className="dp-key">Email</span>
                                    <span
                                        className="dp-val"
                                        style={{ color: "var(--blue)" }}
                                    >
                                        {dialogBooking.email ||
                                            "No email on booking"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn"
                                onClick={() => setActionDialog(null)}
                                disabled={actionBusy}
                            >
                                Cancel
                            </button>
                            <button
                                className={`btn ${actionDialog.type === "convert" ? "primary" : ""}`}
                                style={
                                    actionDialog.type === "reject"
                                        ? {
                                              color: "var(--red)",
                                              borderColor:
                                                  "rgba(239,68,68,0.3)",
                                          }
                                        : undefined
                                }
                                onClick={() => {
                                    void confirmDialogAction();
                                }}
                                disabled={actionBusy}
                            >
                                {actionBusy
                                    ? "Processing..."
                                    : actionDialog.type === "convert"
                                      ? "Confirm Convert"
                                      : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
