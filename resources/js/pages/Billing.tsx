import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import SearchableSelect from "../components/shared/SearchableSelect";
import {
    createBillingInvoice,
    deleteBillingInvoice,
    fetchBillingInvoices,
    fetchShipments,
    updateBillingInvoice,
    updateBillingInvoiceStatus,
} from "../lib/api";
import type {
    BillingInvoice,
    InvoiceLineItem,
    InvoiceStatus,
    Shipment,
} from "../types";

const STATUS_COLOR: Record<InvoiceStatus, string> = {
    paid: "var(--green)",
    pending: "var(--amber)",
    overdue: "var(--red)",
    draft: "var(--text-3)",
};

const STATUS_BG: Record<InvoiceStatus, string> = {
    paid: "var(--green-dim)",
    pending: "var(--amber-dim)",
    overdue: "var(--red-dim)",
    draft: "rgba(107,115,133,0.12)",
};

function formatMoney(amount: number, currency = "TZS"): string {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "TZS" ? 0 : 2,
    }).format(amount);
}

function toDateInput(value: Date): string {
    return value.toISOString().slice(0, 10);
}

function defaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return toDateInput(date);
}

export default function Billing() {
    const { showToast, companySettings, globalSearch, setGlobalSearch } =
        useApp();
    const activeCurrency = (companySettings.currency || "TZS").toUpperCase();
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterStatus, setFilterStatus] = useState<"all" | InvoiceStatus>(
        "all",
    );

    const [detailId, setDetailId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<BillingInvoice | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState({
        customer: "",
        shipmentRef: "",
        currency: activeCurrency,
        status: "draft" as InvoiceStatus,
        issued: toDateInput(new Date()),
        due: defaultDueDate(),
        notes: "",
    });

    const [items, setItems] = useState<InvoiceLineItem[]>([
        { description: "", qty: 1, rate: 0 },
    ]);

    useEffect(() => {
        const load = async () => {
            try {
                const [invoiceData, shipmentData] = await Promise.all([
                    fetchBillingInvoices(),
                    fetchShipments(),
                ]);
                setInvoices(invoiceData);
                setShipments(shipmentData);
            } catch (e: any) {
                showToast(e?.message ?? "Failed to load billing data.", "red");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [showToast]);

    const detail = detailId
        ? (invoices.find((invoice) => invoice.id === detailId) ?? null)
        : null;

    const filtered = useMemo(() => {
        return invoices.filter((invoice) => {
            const q = globalSearch.trim().toLowerCase();
            const matchQ =
                !q ||
                `${invoice.invoiceNo} ${invoice.customer} ${invoice.shipmentRef}`
                    .toLowerCase()
                    .includes(q);
            const matchStatus =
                filterStatus === "all" || invoice.status === filterStatus;
            return matchQ && matchStatus;
        });
    }, [invoices, globalSearch, filterStatus]);

    const totals = useMemo(() => {
        const totalAll = invoices.reduce(
            (sum, invoice) => sum + invoice.amount,
            0,
        );
        const totalPaid = invoices
            .filter((invoice) => invoice.status === "paid")
            .reduce((sum, invoice) => sum + invoice.amount, 0);
        const totalPending = invoices
            .filter((invoice) => invoice.status === "pending")
            .reduce((sum, invoice) => sum + invoice.amount, 0);
        const totalOverdue = invoices
            .filter((invoice) => invoice.status === "overdue")
            .reduce((sum, invoice) => sum + invoice.amount, 0);

        return { totalAll, totalPaid, totalPending, totalOverdue };
    }, [invoices]);

    const computedAmount = useMemo(() => {
        return items.reduce(
            (sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0),
            0,
        );
    }, [items]);

    const availableShipmentOptions = useMemo(() => {
        const usedRefs = new Set(
            invoices
                .map((invoice) => invoice.shipmentRef?.trim())
                .filter((ref) => ref && ref !== "—") as string[],
        );

        if (modalMode === "edit" && form.shipmentRef.trim()) {
            usedRefs.delete(form.shipmentRef.trim());
        }

        return shipments
            .filter((shipment) => {
                const ref = (shipment.awbNumber || shipment.id).trim();
                return ref.length > 0 && !usedRefs.has(ref);
            })
            .map((shipment) => {
                const ref = (shipment.awbNumber || shipment.id).trim();
                return {
                    value: ref,
                    label: `${ref} - ${shipment.customer} (${shipment.origin} -> ${shipment.dest})`,
                    code: shipment.status,
                };
            });
    }, [shipments, invoices, modalMode, form.shipmentRef]);

    const resetForm = () => {
        setForm({
            customer: "",
            shipmentRef: "",
            currency: activeCurrency,
            status: "draft",
            issued: toDateInput(new Date()),
            due: defaultDueDate(),
            notes: "",
        });
        setItems([{ description: "", qty: 1, rate: 0 }]);
        setEditingId(null);
    };

    const openCreateModal = () => {
        setModalMode("create");
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (invoice: BillingInvoice) => {
        setModalMode("edit");
        setEditingId(invoice.id);
        setForm({
            customer: invoice.customer,
            shipmentRef: invoice.shipmentRef === "—" ? "" : invoice.shipmentRef,
            currency: invoice.currency || activeCurrency,
            status: invoice.status,
            issued: toDateInput(invoice.issued),
            due: toDateInput(invoice.due),
            notes: invoice.notes,
        });
        setItems(
            invoice.items.length
                ? invoice.items
                : [{ description: "", qty: 1, rate: 0 }],
        );
        setShowModal(true);
    };

    const updateItem = (
        index: number,
        key: keyof InvoiceLineItem,
        value: string | number,
    ) => {
        setItems((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const addItem = () => {
        setItems((prev) => [...prev, { description: "", qty: 1, rate: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter((_, idx) => idx !== index);
        });
    };

    const normalizeItems = (): InvoiceLineItem[] => {
        return items
            .map((item) => ({
                description: item.description.trim(),
                qty: Number(item.qty || 0),
                rate: Number(item.rate || 0),
            }))
            .filter((item) => item.description && item.qty > 0);
    };

    const handleSave = async () => {
        const customer = form.customer.trim();
        const payloadItems = normalizeItems();

        if (!customer) {
            showToast("Customer is required.", "red");
            return;
        }

        if (!form.issued || !form.due) {
            showToast("Issued and due dates are required.", "red");
            return;
        }

        if (payloadItems.length === 0) {
            showToast("Add at least one valid line item.", "red");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customer,
                shipment_ref: form.shipmentRef.trim() || undefined,
                currency: (form.currency || activeCurrency).toUpperCase(),
                status: form.status,
                issued: form.issued,
                due: form.due,
                items: payloadItems,
                notes: form.notes.trim() || undefined,
            };

            if (modalMode === "edit" && editingId) {
                const updated = await updateBillingInvoice(editingId, payload);
                setInvoices((prev) =>
                    prev.map((invoice) =>
                        invoice.id === editingId ? updated : invoice,
                    ),
                );
                if (detailId === editingId) {
                    setDetailId(updated.id);
                }
                showToast("Invoice updated successfully.", "green");
            } else {
                const created = await createBillingInvoice(payload);
                setInvoices((prev) => [created, ...prev]);
                showToast("Invoice created successfully.", "green");
            }

            setShowModal(false);
            resetForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} invoice.`,
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
            await deleteBillingInvoice(deleteTarget.id);
            setInvoices((prev) =>
                prev.filter((invoice) => invoice.id !== deleteTarget.id),
            );
            if (detailId === deleteTarget.id) {
                setDetailId(null);
            }
            setDeleteTarget(null);
            showToast("Invoice deleted successfully.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete invoice.", "red");
        } finally {
            setDeleting(false);
        }
    };

    const markAsPaid = async (invoice: BillingInvoice) => {
        if (invoice.status === "paid") return;

        try {
            const updated = await updateBillingInvoiceStatus(
                invoice.id,
                "paid",
            );
            setInvoices((prev) =>
                prev.map((item) => (item.id === invoice.id ? updated : item)),
            );
            setDetailId(updated.id);
            showToast("Invoice marked as paid.", "green");
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update invoice status.", "red");
        }
    };

    const exportCsv = () => {
        if (filtered.length === 0) {
            showToast("No invoices to export.", "amber");
            return;
        }

        const header = [
            "Invoice No",
            "Customer",
            "Shipment Ref",
            "Amount",
            "Currency",
            "Status",
            "Issued",
            "Due",
        ];

        const rows = filtered.map((invoice) => [
            invoice.invoiceNo,
            invoice.customer,
            invoice.shipmentRef,
            invoice.amount.toFixed(2),
            invoice.currency,
            invoice.status,
            toDateInput(invoice.issued),
            toDateInput(invoice.due),
        ]);

        const csv = [header, ...rows]
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `billing-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Invoices exported successfully.", "green");
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
                                    <rect
                                        x="2"
                                        y="4"
                                        width="14"
                                        height="11"
                                        rx="1.5"
                                    />
                                    <path d="M2 7h14" />
                                    <path d="M6 11h2M10 11h2" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatMoney(totals.totalAll, activeCurrency)}
                        </div>
                        <div className="stat-label">
                            Total Invoiced ({activeCurrency})
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: "100%" }}
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
                                    <path d="M2 9l5 5 9-9" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatMoney(totals.totalPaid, activeCurrency)}
                        </div>
                        <div className="stat-label">
                            Collected ({activeCurrency})
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${totals.totalAll > 0 ? (totals.totalPaid / totals.totalAll) * 100 : 0}%`,
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
                                    <circle cx="9" cy="9" r="7.5" />
                                    <path d="M9 5v4l3 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatMoney(totals.totalPending, activeCurrency)}
                        </div>
                        <div className="stat-label">
                            Pending ({activeCurrency})
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${totals.totalAll > 0 ? (totals.totalPending / totals.totalAll) * 100 : 0}%`,
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
                                    background: "var(--red-dim)",
                                    color: "var(--red)",
                                }}
                            >
                                <svg
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M9 2l1.5 5h5l-4 3 1.5 5L9 12l-4 3 1.5-5-4-3h5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatMoney(totals.totalOverdue, activeCurrency)}
                        </div>
                        <div className="stat-label">
                            Overdue ({activeCurrency})
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${totals.totalAll > 0 ? (totals.totalOverdue / totals.totalAll) * 100 : 0}%`,
                                    background: "var(--red)",
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
                                placeholder="Search invoices..."
                                value={globalSearch}
                                onChange={(e) =>
                                    setGlobalSearch(e.target.value)
                                }
                            />
                        </div>
                        <div className="filter-tabs">
                            {(
                                [
                                    "all",
                                    "paid",
                                    "pending",
                                    "overdue",
                                    "draft",
                                ] as const
                            ).map((status) => (
                                <div
                                    key={status}
                                    className={`filter-tab${filterStatus === status ? " active" : ""}`}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status.charAt(0).toUpperCase() +
                                        status.slice(1)}
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: 8,
                            }}
                        >
                            <button className="btn" onClick={exportCsv}>
                                <svg
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <path d="M2 4h10M4 7h6M6 10h2" />
                                </svg>
                                Export
                            </button>
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
                                New Invoice
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <table className="sh-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Customer</th>
                                <th>Shipment Ref</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Issued</th>
                                <th>Due</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => setDetailId(invoice.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td
                                        style={{
                                            fontWeight: 600,
                                            color: "var(--blue)",
                                            fontFamily:
                                                "var(--font-mono, monospace)",
                                            fontSize: 12,
                                        }}
                                    >
                                        {invoice.invoiceNo}
                                    </td>
                                    <td
                                        style={{
                                            fontWeight: 500,
                                            color: "var(--text-1)",
                                        }}
                                    >
                                        {invoice.customer}
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--text-2)",
                                            fontSize: 12,
                                        }}
                                    >
                                        {invoice.shipmentRef}
                                    </td>
                                    <td
                                        style={{
                                            fontWeight: 600,
                                            color: "var(--text-1)",
                                        }}
                                    >
                                        {formatMoney(
                                            invoice.amount,
                                            invoice.currency,
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                background:
                                                    STATUS_BG[invoice.status],
                                                color: STATUS_COLOR[
                                                    invoice.status
                                                ],
                                            }}
                                        >
                                            {invoice.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            color: "var(--text-2)",
                                            fontSize: 12,
                                        }}
                                    >
                                        {invoice.issued.toLocaleDateString(
                                            "en-GB",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            },
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            color:
                                                invoice.status === "overdue"
                                                    ? "var(--red)"
                                                    : "var(--text-2)",
                                            fontSize: 12,
                                            fontWeight:
                                                invoice.status === "overdue"
                                                    ? 600
                                                    : 400,
                                        }}
                                    >
                                        {invoice.due.toLocaleDateString(
                                            "en-GB",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            },
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="row-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetailId(invoice.id);
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
                                ? "Loading invoices..."
                                : "No invoices found"}
                        </div>
                    )}
                </div>
            </div>

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
                                {detail.invoiceNo}
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    color: "var(--text-3)",
                                    fontSize: 12,
                                }}
                            >
                                {detail.customer} · {detail.shipmentRef}
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
                                Invoice Summary
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Status</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color: STATUS_COLOR[detail.status],
                                        fontWeight: 600,
                                    }}
                                >
                                    {detail.status.charAt(0).toUpperCase() +
                                        detail.status.slice(1)}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Amount</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color: "var(--text-1)",
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}
                                >
                                    {formatMoney(
                                        detail.amount,
                                        detail.currency,
                                    )}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Issued</span>
                                <span className="dp-val">
                                    {detail.issued.toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="dp-row">
                                <span className="dp-key">Due</span>
                                <span
                                    className="dp-val"
                                    style={{
                                        color:
                                            detail.status === "overdue"
                                                ? "var(--red)"
                                                : "inherit",
                                    }}
                                >
                                    {detail.due.toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="dp-section">
                            <div className="dp-section-title">Line Items</div>
                            {detail.items.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "6px 0",
                                        borderBottom: "1px solid var(--border)",
                                        fontSize: 12,
                                        gap: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "var(--text-2)",
                                            flex: 1,
                                        }}
                                    >
                                        {item.description}
                                    </span>
                                    <span
                                        style={{
                                            color: "var(--text-3)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        ×{item.qty}
                                    </span>
                                    <span
                                        style={{
                                            color: "var(--text-1)",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formatMoney(
                                            item.qty * item.rate,
                                            detail.currency,
                                        )}
                                    </span>
                                </div>
                            ))}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    fontWeight: 700,
                                    color: "var(--text-1)",
                                    marginTop: 4,
                                }}
                            >
                                <span>Total</span>
                                <span style={{ color: "var(--green)" }}>
                                    {formatMoney(
                                        detail.amount,
                                        detail.currency,
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="dp-section">
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    className="btn"
                                    onClick={() => openEditModal(detail)}
                                >
                                    Edit Invoice
                                </button>
                                {detail.status !== "paid" && (
                                    <button
                                        className="btn primary"
                                        onClick={() => markAsPaid(detail)}
                                    >
                                        Mark as Paid
                                    </button>
                                )}
                                <button
                                    className="btn"
                                    style={{
                                        borderColor: "var(--red)",
                                        color: "var(--red)",
                                    }}
                                    onClick={() => setDeleteTarget(detail)}
                                >
                                    Delete Invoice
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
                    <div className="modal" style={{ width: 760 }}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit"
                                    ? "Edit Invoice"
                                    : "New Invoice"}
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
                            <div className="form-divider">Invoice Details</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Customer *
                                    </label>
                                    <input
                                        className="form-input"
                                        placeholder="Customer name"
                                        value={form.customer}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                customer: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Shipment Ref
                                    </label>
                                    <SearchableSelect
                                        options={availableShipmentOptions}
                                        value={form.shipmentRef}
                                        placeholder={
                                            availableShipmentOptions.length > 0
                                                ? "Select available shipment..."
                                                : "No available shipment refs"
                                        }
                                        searchPlaceholder="Search shipment ref..."
                                        onChange={(value) => {
                                            const matchedShipment =
                                                shipments.find(
                                                    (shipment) =>
                                                        (
                                                            shipment.awbNumber ||
                                                            shipment.id
                                                        ).trim() === value,
                                                );

                                            setForm((f) => ({
                                                ...f,
                                                shipmentRef: value,
                                                customer:
                                                    !f.customer.trim() &&
                                                    matchedShipment
                                                        ? matchedShipment.customer
                                                        : f.customer,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Currency
                                    </label>
                                    <select
                                        className="form-select"
                                        value={form.currency}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                currency: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="TZS">TZS</option>
                                        <option value="USD">USD</option>
                                        <option value="KES">KES</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                status: e.target
                                                    .value as InvoiceStatus,
                                            }))
                                        }
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Issued Date
                                    </label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={form.issued}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                issued: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Due Date
                                    </label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={form.due}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                due: e.target.value,
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
                                        rows={2}
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

                            <div className="form-divider">Line Items</div>
                            <div style={{ display: "grid", gap: 8 }}>
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "2fr 100px 140px 48px",
                                            gap: 8,
                                        }}
                                    >
                                        <input
                                            className="form-input"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            className="form-input"
                                            type="number"
                                            min={0.01}
                                            step={0.01}
                                            placeholder="Qty"
                                            value={item.qty}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "qty",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                        <input
                                            className="form-input"
                                            type="number"
                                            min={0}
                                            step={1}
                                            placeholder="Rate"
                                            value={item.rate}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "rate",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                        <button
                                            className="btn"
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            title="Remove row"
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: 10,
                                }}
                            >
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={addItem}
                                >
                                    + Add Item
                                </button>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        color: "var(--text-1)",
                                    }}
                                >
                                    Total:{" "}
                                    {formatMoney(computedAmount, form.currency)}
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
                                      : "Create Invoice"}
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
                            <span className="modal-title">Delete Invoice</span>
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
                                You are about to permanently delete invoice{" "}
                                <strong>{deleteTarget.invoiceNo}</strong>. This
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
                                {deleting ? "Deleting..." : "Delete Invoice"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
