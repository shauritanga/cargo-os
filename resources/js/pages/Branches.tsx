import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import Badge from "../components/shared/Badge";
import {
    createBranch,
    deleteBranch,
    fetchBranches,
    updateBranch,
} from "../lib/api";
import type { Branch } from "../types";

export default function Branches() {
    const { showToast } = useApp();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
        "all",
    );
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setName("");
        setCode("");
        setIsActive(true);
        setEditingId(null);
    };

    const loadBranches = async () => {
        setLoading(true);
        try {
            const data = await fetchBranches();
            setBranches(data);
        } catch (e: any) {
            showToast(e?.message ?? "Failed to load branches.", "red");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setModalMode("create");
        resetForm();
        setShowModal(true);
    };

    const openEdit = (branch: Branch) => {
        setModalMode("edit");
        setEditingId(branch.id);
        setName(branch.name);
        setCode(branch.code);
        setIsActive(branch.isActive);
        setShowModal(true);
    };

    const onSave = async () => {
        const trimmedName = name.trim();
        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedName || !trimmedCode) {
            showToast("Branch name and code are required.", "red");
            return;
        }

        setSubmitting(true);
        try {
            if (modalMode === "edit" && editingId) {
                const updated = await updateBranch(editingId, {
                    name: trimmedName,
                    code: trimmedCode,
                    isActive,
                });
                setBranches((prev) =>
                    prev.map((branch) =>
                        branch.id === editingId ? updated : branch,
                    ),
                );
                showToast("Branch updated.", "green");
            } else {
                const created = await createBranch({
                    name: trimmedName,
                    code: trimmedCode,
                    isActive,
                });
                setBranches((prev) => [created, ...prev]);
                showToast("Branch created.", "green");
            }

            setShowModal(false);
            resetForm();
        } catch (e: any) {
            showToast(
                e?.message ??
                    `Failed to ${modalMode === "edit" ? "update" : "create"} branch.`,
                "red",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!deleteTarget) return;

        setDeletingId(deleteTarget.id);
        try {
            await deleteBranch(deleteTarget.id);
            setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
            showToast("Branch deleted.", "green");
            setDeleteTarget(null);
        } catch (e: any) {
            showToast(e?.message ?? "Failed to delete branch.", "red");
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        const onWindowClick = (event: MouseEvent) => {
            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(event.target as Node)
            ) {
                setActionMenuId(null);
            }
        };

        window.addEventListener("mousedown", onWindowClick);
        return () => window.removeEventListener("mousedown", onWindowClick);
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return branches.filter((branch) => {
            if (statusFilter !== "all") {
                if (statusFilter === "active" && !branch.isActive) return false;
                if (statusFilter === "inactive" && branch.isActive) return false;
            }

            if (!q) return true;
            return `${branch.name} ${branch.code}`.toLowerCase().includes(q);
        });
    }, [branches, search, statusFilter]);

    const kpiTotal = branches.length;
    const kpiActive = branches.filter((b) => b.isActive).length;
    const kpiInactive = branches.filter((b) => !b.isActive).length;
    const totalOrOne = Math.max(kpiTotal, 1);
    const kpiActiveRate = Math.round((kpiActive / totalOrOne) * 100);
    const kpiItems = [
        {
            label: "Total Branches",
            value: kpiTotal,
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
                    <rect x="2" y="3" width="6" height="5" rx="1" />
                    <rect x="10" y="3" width="6" height="5" rx="1" />
                    <rect x="6" y="10" width="6" height="5" rx="1" />
                </svg>
            ),
        },
        {
            label: "Active",
            value: kpiActive,
            color: "var(--green)",
            progress: Math.round((kpiActive / totalOrOne) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M3 9l3.5 3.5L15 4" />
                </svg>
            ),
        },
        {
            label: "Inactive",
            value: kpiInactive,
            color: "var(--red)",
            progress: Math.round((kpiInactive / totalOrOne) * 100),
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <circle cx="9" cy="9" r="6.5" />
                    <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" />
                </svg>
            ),
        },
        {
            label: "Active Rate",
            value: `${kpiActiveRate}%`,
            color: "var(--purple)",
            progress: kpiActiveRate,
            icon: (
                <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                >
                    <path d="M3 13l4-4 3 3 5-6" />
                    <path d="M14 6h1v1" />
                </svg>
            ),
        },
    ];

    return (
        <div className="content">
            <div className="stat-grid">
                {kpiItems.map((item) => (
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
                        <div className="stat-value" style={{ color: item.color }}>
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

            <div className="card">
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        flexWrap: "nowrap",
                    }}
                >
                    <div
                        className="search-wrap"
                        style={{ width: 260, minWidth: 220, flex: "0 0 auto" }}
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
                            placeholder="Search branches..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-tabs">
                        {(["all", "active", "inactive"] as const).map((value) => (
                            <div
                                key={value}
                                className={`filter-tab${statusFilter === value ? " active" : ""}`}
                                onClick={() => setStatusFilter(value)}
                            >
                                {value === "all"
                                    ? "All"
                                    : value.charAt(0).toUpperCase() + value.slice(1)}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                        <button className="btn primary" onClick={openCreate}>
                            + New Branch
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "visible" }}>
                <table className="sh-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5}>Loading branches...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5}>No branches found.</td>
                            </tr>
                        ) : (
                            filtered.map((branch) => (
                                <tr key={branch.id}>
                                    <td>{branch.name}</td>
                                    <td>{branch.code}</td>
                                    <td>
                                        <Badge
                                            variant={
                                                branch.isActive
                                                    ? "active-v"
                                                    : "inactive"
                                            }
                                        >
                                            {branch.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td>
                                        {branch.createdAt
                                            ? new Date(branch.createdAt).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div
                                            className="col-toggle-wrap"
                                            style={{
                                                display: "inline-block",
                                                position: "relative",
                                            }}
                                            ref={
                                                actionMenuId === branch.id
                                                    ? actionMenuRef
                                                    : null
                                            }
                                        >
                                            <button
                                                className="icon-btn"
                                                onClick={() =>
                                                    setActionMenuId((current) =>
                                                        current === branch.id
                                                            ? null
                                                            : branch.id,
                                                    )
                                                }
                                                aria-label="Open actions menu"
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    width: 28,
                                                    height: 28,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 16 16"
                                                    fill="currentColor"
                                                    style={{ width: 14, height: 14 }}
                                                >
                                                    <circle cx="8" cy="3" r="1.5" />
                                                    <circle cx="8" cy="8" r="1.5" />
                                                    <circle cx="8" cy="13" r="1.5" />
                                                </svg>
                                            </button>

                                            {actionMenuId === branch.id && (
                                                <div
                                                    className="col-toggle-menu"
                                                    style={{
                                                        minWidth: 150,
                                                        padding: 6,
                                                        top: "auto",
                                                        bottom: "calc(100% + 6px)",
                                                    }}
                                                >
                                                    <button
                                                        className="branch-action-item"
                                                        onClick={() => {
                                                            setActionMenuId(null);
                                                            openEdit(branch);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="branch-action-item danger"
                                                        onClick={() => {
                                                            setActionMenuId(null);
                                                            setDeleteTarget(branch);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div
                    className="modal-overlay open"
                    onClick={() => {
                        if (!submitting) setShowModal(false);
                    }}
                >
                    <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">
                                {modalMode === "edit" ? "Edit Branch" : "New Branch"}
                            </span>
                            <button
                                className="modal-close"
                                onClick={() => !submitting && setShowModal(false)}
                                aria-label="Close"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Branch Name *</label>
                                    <input
                                        className="form-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Dar Branch"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Code *</label>
                                    <input
                                        className="form-input"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. DAR"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={isActive ? "active" : "inactive"}
                                        onChange={(e) =>
                                            setIsActive(e.target.value === "active")
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn primary"
                                onClick={onSave}
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Saving..."
                                    : modalMode === "edit"
                                      ? "Save Changes"
                                      : "Create Branch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div
                    className="modal-overlay open"
                    onClick={(e) => {
                        if (
                            deletingId === null &&
                            e.target === e.currentTarget
                        ) {
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <div className="modal" style={{ width: 460 }}>
                        <div className="modal-header">
                            <span className="modal-title">Delete Branch</span>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (deletingId === null) setDeleteTarget(null);
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
                                You are about to permanently delete branch{" "}
                                <strong>{deleteTarget.name}</strong>. This action
                                cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                disabled={deletingId !== null}
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                disabled={deletingId !== null}
                                style={{
                                    borderColor: "var(--red)",
                                    color: "var(--red)",
                                }}
                                onClick={onDelete}
                            >
                                {deletingId !== null
                                    ? "Deleting..."
                                    : "Delete Branch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
