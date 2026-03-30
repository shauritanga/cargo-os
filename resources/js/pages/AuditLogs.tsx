import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "../lib/api";
import type { AuditLog } from "../types";
import { useApp } from "../context/AppContext";
import Pagination from "../components/shared/Pagination";

type MethodFilter = "" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString();
}

export default function AuditLogs() {
    const { showToast, globalSearch } = useApp();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [queryInput, setQueryInput] = useState("");
    const [activeQuery, setActiveQuery] = useState("");
    const [methodInput, setMethodInput] = useState<MethodFilter>("");
    const [activeMethod, setActiveMethod] = useState<MethodFilter>("");
    const [statusCodeInput, setStatusCodeInput] = useState("");
    const [activeStatusCode, setActiveStatusCode] = useState<number | null>(
        null,
    );

    const methodBadgeClass = (value: string | null): string => {
        switch (value) {
            case "GET":
                return "badge transit";
            case "POST":
                return "badge approved";
            case "PUT":
            case "PATCH":
                return "badge reviewing";
            case "DELETE":
                return "badge rejected";
            default:
                return "badge";
        }
    };

    const statusBadgeClass = (value: number | null): string => {
        if (value === null) return "badge";
        if (value >= 500) return "badge rejected";
        if (value >= 400) return "badge delayed";
        if (value >= 300) return "badge reviewing";
        if (value >= 200) return "badge approved";
        return "badge";
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const response = await fetchAuditLogs({
                    page,
                    perPage: PAGE_SIZE,
                    q: activeQuery || undefined,
                    method: activeMethod || undefined,
                    statusCode: activeStatusCode ?? undefined,
                });

                if (cancelled) return;

                setLogs(response.data);
                setTotal(response.total);
                setLastPage(response.lastPage);

                if (response.currentPage !== page) {
                    setPage(response.currentPage);
                }
            } catch (error: any) {
                if (!cancelled) {
                    showToast(
                        error?.message ?? "Failed to load audit logs",
                        "red",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [activeMethod, activeQuery, activeStatusCode, page, showToast]);

    useEffect(() => {
        setQueryInput(globalSearch);
        setActiveQuery(globalSearch.trim());
        setPage(1);
    }, [globalSearch]);

    const onApplyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedStatus = statusCodeInput.trim();
        const parsedStatus = Number(trimmedStatus);
        const nextStatus =
            trimmedStatus.length > 0 &&
            Number.isInteger(parsedStatus) &&
            parsedStatus >= 100 &&
            parsedStatus <= 599
                ? parsedStatus
                : null;

        setActiveQuery(queryInput.trim());
        setActiveMethod(methodInput);
        setActiveStatusCode(nextStatus);
        setPage(1);
    };

    const clearFilters = () => {
        setQueryInput("");
        setActiveQuery("");
        setMethodInput("");
        setActiveMethod("");
        setStatusCodeInput("");
        setActiveStatusCode(null);
        setPage(1);
    };

    const pageInfo = useMemo(() => {
        if (total === 0) return "No records";
        const safePage = Math.max(1, Math.min(page, lastPage));
        const start = (safePage - 1) * PAGE_SIZE + 1;
        const end = Math.min(safePage * PAGE_SIZE, total);

        return `Showing ${start}-${end} of ${total}`;
    }, [lastPage, page, total]);

    return (
        <div className="content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Audit Logs</div>
                        <div className="card-subtitle">
                            Admin activity journal for security monitoring and
                            investigations.
                        </div>
                    </div>
                    <span className="badge transit">Total: {total}</span>
                </div>

                <form onSubmit={onApplyFilters} className="sh-toolbar">
                    <div className="sh-toolbar-left">
                        <div className="search-wrap" style={{ minWidth: 260 }}>
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
                                value={queryInput}
                                onChange={(event) =>
                                    setQueryInput(event.target.value)
                                }
                                placeholder="Search action, endpoint, IP, user"
                            />
                        </div>

                        <select
                            className="sh-input"
                            value={methodInput}
                            onChange={(event) =>
                                setMethodInput(
                                    event.target.value as MethodFilter,
                                )
                            }
                            style={{ width: 140 }}
                        >
                            <option value="">All Methods</option>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>

                        <input
                            className="sh-input"
                            value={statusCodeInput}
                            onChange={(event) =>
                                setStatusCodeInput(event.target.value)
                            }
                            inputMode="numeric"
                            placeholder="Status (100-599)"
                            style={{ width: 130 }}
                        />
                    </div>

                    <div className="sh-toolbar-right">
                        <button className="btn" type="submit">
                            Apply
                        </button>
                        <button
                            className="btn"
                            type="button"
                            onClick={clearFilters}
                        >
                            Reset
                        </button>
                    </div>
                </form>

                <div className="sh-table-wrap">
                    <table className="sh-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Endpoint</th>
                                <th>Status</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-muted">
                                        Loading audit trail...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-muted">
                                        No audit entries match current filters.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.createdAt)}</td>
                                        <td>
                                            <div>
                                                {log.user?.name ?? "System"}
                                            </div>
                                            <div className="text-muted">
                                                {log.user?.email ?? "-"}
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className="mono"
                                                style={{ color: "var(--blue)" }}
                                            >
                                                {log.action}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={methodBadgeClass(
                                                    log.httpMethod,
                                                )}
                                            >
                                                {log.httpMethod ?? "-"}
                                            </span>
                                            <div
                                                className="text-muted"
                                                style={{ marginTop: 6 }}
                                            >
                                                {log.path}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={statusBadgeClass(
                                                    log.statusCode,
                                                )}
                                            >
                                                {log.statusCode ?? "-"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="mono">
                                                {log.ipAddress ?? "-"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalItems={total}
                    perPage={PAGE_SIZE}
                    onPageChange={(nextPage) => {
                        if (loading) return;
                        const bounded = Math.max(
                            1,
                            Math.min(nextPage, lastPage),
                        );
                        setPage(bounded);
                    }}
                    infoText={pageInfo}
                />
            </div>
        </div>
    );
}
