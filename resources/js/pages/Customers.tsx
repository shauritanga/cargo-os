import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
    createCustomer,
    deleteCustomer,
    fetchCustomers,
    updateCustomer,
} from "../lib/api";
import type { Customer, CustomerStatus, CustomerType } from "../types";

const TYPE_COLOR: Record<CustomerType, string> = {
    Enterprise: "var(--blue)",
    SME: "var(--purple)",
    Individual: "var(--amber)",
};

export default function Customers() {
    const { showToast, companySettings, globalSearch, setGlobalSearch } =
        useApp();
    const activeCurrency = (companySettings.currency || "TZS").toUpperCase();
    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: activeCurrency,
            maximumFractionDigits: activeCurrency === "TZS" ? 0 : 2,
        }).format(amount);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"all" | CustomerType>("all");
    const [filterStatus, setFilterStatus] = useState<"all" | CustomerStatus>(
        "all",
    );
    const [detail, setDetail] = useState<Customer | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        contact: "",
        email: "",
        phone: "",
        country: "",
        type: "SME" as CustomerType,
        status: "active" as CustomerStatus,
        shipments: "0",
        revenue: "0",
        since: "",
        notes: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchCustomers();
                setCustomers(data);
            } catch (e: any) {
                showToast(e?.message ?? "Failed to load customers.", "red");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [showToast]);

    const resetForm = () => {
        setForm({
            name: "",
            contact: "",
            email: "",
            phone: "",
            country: "",
            type: "SME",
            status: "active",
            shipments: "0",
            revenue: "0",
            since: "",
            notes: "",
        });
        setEditingId(null);
    };

    const openCreateModal = () => {
        setModalMode("create");
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (customer: Customer) => {
        setModalMode("edit");
        setEditingId(customer.id);
        setForm({
            name: customer.name,
            contact: customer.contact === "—" ? "" : customer.contact,
            email: customer.email === "—" ? "" : customer.email,
            phone: customer.phone === "—" ? "" : customer.phone,
            country: customer.country === "—" ? "" : customer.country,
            type: customer.type,
            status: customer.status,
            shipments: String(customer.shipments),
            revenue: String(customer.revenue),
            since: customer.since.toISOString().slice(0, 10),
            notes: customer.notes,
        });
        setShowModal(true);
    };

    const filtered = useMemo(() => {
        return customers.filter((c) => {
            const q = globalSearch.trim().toLowerCase();
            const matchQ =
                !q ||
                `${c.name} ${c.email} ${c.country} ${c.contact} ${c.phone}`
                    .toLowerCase()
                    .includes(q);
            const matchType = filterType === "all" || c.type === filterType;
            const matchStatus =
                filterStatus === "all" || c.status === filterStatus;
            return matchQ && matchType && matchStatus;
        });
    }, [customers, globalSearch, filterType, filterStatus]);

    const activeCustomers = useMemo(
        () => customers.filter((c) => c.status === "active"),
        [customers],
    );

    const totalRevenue = useMemo(
        () => activeCustomers.reduce((s, c) => s + c.revenue, 0),
        [activeCustomers],
    );

    const totalShipments = useMemo(
        () => customers.reduce((s, c) => s + c.shipments, 0),
        [customers],
    );

    const enterpriseCount = useMemo(
        () => customers.filter((c) => c.type === "Enterprise").length,
        [customers],
    );

    const handleSave = async () => {
        const name = form.name.trim();
        const email = form.email.trim();

        if (!name || !email) {
            showToast("Name and email are required.", "red");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name,
                contact: form.contact.trim() || undefined,
                email,
                phone: form.phone.trim() || undefined,
                country: form.country.trim() || undefined,
                type: form.type,
                status: form.status,
                shipments: Number(form.shipments || 0),
                revenue: Number(form.revenue || 0),
                since: form.since || undefined,
                notes: form.notes.trim() || undefined,
            };

            if (modalMode === "edit" && editingId) {
                const updated = await updateCustomer(editingId, payload);
                setCustomers((prev) =>
                    prev.map((item) =>
                        item.id === editingId ? updated : item,
                    ),
                );
                if (detail?.id === editingId) {
                    setDetail(updated);
                }
                showToast("Customer updated successfully.", "green");
            } else {
                const created = await createCustomer(payload);
                setCustomers((prev) => [created, ...prev]);
                showToast(`Customer "${created.name}" added.`, "green");
            }

            setShowModal(false);
            resetForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} customer.`,
                "red",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteCustomer(deleteTarget.id);
            setCustomers((prev) =>
                prev.filter((item) => item.id !== deleteTarget.id),
            );
            if (detail?.id === deleteTarget.id) {
                setDetail(null);
            }
            setDeleteTarget(null);
            showToast("Customer deleted successfully.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete customer.", "red");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="content">
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-top">
                            <div
                                className="stat-icon"
                                style={{
                                    background: "var(--blue-dim)",
                                    color: "var(--blue)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <circle cx="9" cy="6" r="3.5" />
                                    <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{customers.length}</div>
                        <div className="stat-label">Total Customers</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${customers.length > 0 ? (activeCustomers.length / customers.length) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <div
                                className="stat-icon"
                                style={{
                                    background: "var(--green-dim)",
                                    color: "var(--green)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M9 2v14M5 6h6a2 2 0 010 4H7a2 2 0 000 4h7" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatMoney(totalRevenue)}
                        </div>
                        <div className="stat-label">
                            Total Revenue ({activeCurrency})
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: "78%",
                                    background: "var(--green)",
                                }}
                            />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <div
                                className="stat-icon"
                                style={{
                                    background: "var(--amber-dim)",
                                    color: "var(--amber)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <rect
                                        x="1"
                                        y="5"
                                        width="12"
                                        height="9"
                                        rx="1.5"
                                    />
                                    <path d="M13 8l3 2v4h-3V8z" />
                                    <circle cx="4.5" cy="14" r="1.5" />
                                    <circle cx="10.5" cy="14" r="1.5" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{totalShipments}</div>
                        <div className="stat-label">Total Shipments</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: "65%",
                                    background: "var(--amber)",
                                }}
                            />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <div
                                className="stat-icon"
                                style={{
                                    background: "var(--purple-dim)",
                                    color: "var(--purple)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{enterpriseCount}</div>
                        <div className="stat-label">Enterprise Clients</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: "55%",
                                    background: "var(--purple)",
                                }}
                            />
                        </div>
                    </div>
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
                            style={{ flex: 1, maxWidth: 300, minWidth: 160 }}
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
                                placeholder="Search customers..."
                                value={globalSearch}
                                onChange={(e) =>
                                    setGlobalSearch(e.target.value)
                                }
                            />
                        </div>

                        <div className="filter-tabs">
                            {(["all", "active", "inactive"] as const).map(
                                (s) => (
                                    <div
                                        key={s}
                                        className={`filter-tab${filterStatus === s ? " active" : ""}`}
                                        onClick={() => setFilterStatus(s)}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </div>
                                ),
                            )}
                        </div>

                        <select
                            className="sh-select"
                            value={filterType}
                            onChange={(e) =>
                                setFilterType(
                                    e.target.value as "all" | CustomerType,
                                )
                            }
                        >
                            <option value="all">All Types</option>
                            <option value="Enterprise">Enterprise</option>
                            <option value="SME">SME</option>
                            <option value="Individual">Individual</option>
                        </select>

                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: 8,
                            }}
                        >
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
                                Add Customer
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <table className="sh-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Country</th>
                                <th>Type</th>
                                <th>Shipments</th>
                                <th>Revenue</th>
                                <th>Status</th>
                                <th>Since</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr
                                    key={c.id}
                                    onClick={() => setDetail(c)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    background:
                                                        "var(--blue-dim)",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: "var(--blue)",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {c.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: "var(--text-1)",
                                                    }}
                                                >
                                                    {c.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: "var(--text-3)",
                                                    }}
                                                >
                                                    {c.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13 }}>
                                            {c.contact}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            {c.email}
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--text-2)" }}>
                                        {c.country}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                background: `${TYPE_COLOR[c.type]}18`,
                                                color: TYPE_COLOR[c.type],
                                            }}
                                        >
                                            {c.type}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--text-1)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {c.shipments}
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--green)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {formatMoney(c.revenue)}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                background:
                                                    c.status === "active"
                                                        ? "var(--green-dim)"
                                                        : "var(--red-dim)",
                                                color:
                                                    c.status === "active"
                                                        ? "var(--green)"
                                                        : "var(--red)",
                                            }}
                                        >
                                            {c.status === "active"
                                                ? "● Active"
                                                : "○ Inactive"}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--text-3)",
                                            fontSize: 12,
                                        }}
                                    >
                                        {c.since.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td>
                                        <button
                                            className="row-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetail(c);
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M5 1l6 6-6 6" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(loading || filtered.length === 0) && (
                        <div
                            style={{
                                padding: "48px 0",
                                textAlign: "center",
                                color: "var(--text-3)",
                            }}
                        >
                            {loading
                                ? "Loading customers..."
                                : "No customers found"}
                        </div>
                    )}
                </div>
            </div>

            {detail && (
                <div
                    className="drawer-overlay open"
                    onClick={() => setDetail(null)}
                />
            )}
            {detail && (
                <div className="bk-detail open">
                    <div className="dp-header">
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>
                                {detail.name}
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    color: "var(--text-3)",
                                    fontSize: 12,
                                }}
                            >
                                {detail.id} · {detail.type}
                            </div>
                        </div>
                        <button
                            className="dp-close"
                            onClick={() => setDetail(null)}
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
                                Contact Information
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Contact</span>
                                <span className="dp-val">{detail.contact}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Email</span>
                                <span className="dp-val">{detail.email}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Phone</span>
                                <span className="dp-val">{detail.phone}</span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Country</span>
                                <span className="dp-val">{detail.country}</span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">
                                Account Details
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Type</span>
                                <span
                                    className="dp-val"
                                    style={{ color: TYPE_COLOR[detail.type] }}
                                >
                                    {detail.type}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Status</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color:
                                            detail.status === "active"
                                                ? "var(--green)"
                                                : "var(--red)",
                                    }}
                                >
                                    {detail.status}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Customer Since</span>
                                <span className="dp-val">
                                    {detail.since.toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div className="dp-section-title">Statistics</div>
                            <div className="dp-row">
                                <span className="dp-key">Total Shipments</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color: "var(--blue)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {detail.shipments}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Total Revenue</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color: "var(--green)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatMoney(detail.revenue)}
                                </span>
                            </div>
                        </div>
                        <div className="dp-section">
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn"
                                    onClick={() => openEditModal(detail)}
                                >
                                    Edit Customer
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        borderColor: "var(--red)",
                                        color: "var(--red)",
                                    }}
                                    onClick={() => setDeleteTarget(detail)}
                                >
                                    Delete Customer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (!submitting && e.target === e.currentTarget) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 560 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit"
                                    ? "Edit Customer"
                                    : "Add Customer"}
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
                            <div className="form-divider">Identity</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Company / Name *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Acme Corp"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                name: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                type: e.target
                                                    .value as CustomerType,
                                            }))
                                        }
                                    >
                                        <option value="Enterprise">
                                            Enterprise
                                        </option>
                                        <option value="SME">SME</option>
                                        <option value="Individual">
                                            Individual
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                status: e.target
                                                    .value as CustomerStatus,
                                            }))
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
                                        Customer Since
                                    </label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={form.since}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                since: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-divider">Contact</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Contact Person
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="Full name"
                                        value={form.contact}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                contact: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Email *
                                    </label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        placeholder="email@company.com"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                email: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-input"
                                        placeholder="+254 700 000 000"
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                phone: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Country
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Kenya"
                                        value={form.country}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                country: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-divider">Performance</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Shipments
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min={0}
                                        value={form.shipments}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                shipments: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Revenue ({activeCurrency})
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min={0}
                                        value={form.revenue}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                revenue: e.target.value,
                                            }))
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
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                notes: e.target.value,
                                            }))
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
                                      : "Add Customer"}
                            </button>
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
                            <span className="modal-title">Delete Customer</span>
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
                                You are about to permanently delete customer{" "}
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
                                onClick={handleDelete}
                            >
                                {deleting ? "Deleting..." : "Delete Customer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
