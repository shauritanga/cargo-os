import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useApp } from "../context/AppContext";
import { fetchBillingInvoices } from "../lib/api";
import type { BillingInvoice, Shipment, TransportMode } from "../types";

type Period = "8w" | "12w";

const MODE_COLOR: Record<TransportMode, string> = {
    Sea: "var(--blue)",
    Air: "var(--purple)",
    Road: "var(--amber)",
    Rail: "var(--green)",
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
    paid: "var(--green)",
    pending: "var(--amber)",
    overdue: "var(--red)",
    draft: "var(--text-3)",
};

const INVOICE_STATUS_BG: Record<string, string> = {
    paid: "var(--green-dim)",
    pending: "var(--amber-dim)",
    overdue: "var(--red-dim)",
    draft: "rgba(107,115,133,0.12)",
};

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function weekLabel(date: Date): string {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
        (date.getTime() - firstJan.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekNo = Math.ceil((dayOfYear + firstJan.getDay() + 1) / 7);
    return `W${weekNo}`;
}

function monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function percentageChange(current: number, previous: number): number {
    if (previous <= 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
}

function chartOptions(categories: string[]): ApexOptions {
    return {
        chart: {
            type: "bar",
            toolbar: { show: false },
            foreColor: "var(--text-3)",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "58%",
            },
        },
        dataLabels: { enabled: false },
        grid: {
            borderColor: "var(--border)",
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
        },
        colors: ["#2f80ed", "#27ae60"],
        legend: { show: false },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: "var(--text-3)", fontSize: "10px" } },
        },
        yaxis: {
            labels: {
                style: { colors: "var(--text-3)", fontSize: "10px" },
                formatter: (v) => `${Math.round(v)}`,
            },
        },
        tooltip: { theme: "dark" },
    };
}

export default function Dashboard() {
    const {
        shipments,
        routes,
        fleet,
        warehouses,
        setActivePage,
        companySettings,
        showToast,
    } = useApp();
    const [period, setPeriod] = useState<Period>("8w");
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

    const activeCurrency = (companySettings.currency || "TZS").toUpperCase();

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: activeCurrency,
            maximumFractionDigits: activeCurrency === "TZS" ? 0 : 2,
        }).format(amount);

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const data = await fetchBillingInvoices();
                setInvoices(data);
            } catch {
                setInvoices([]);
                showToast("Billing data unavailable for dashboard.", "amber");
            }
        };

        loadInvoices();
    }, [showToast]);

    const statusCounts = useMemo(() => {
        const counts = {
            transit: 0,
            delivered: 0,
            pending: 0,
            customs: 0,
            delayed: 0,
        };

        for (const shipment of shipments) {
            counts[shipment.status] += 1;
        }

        return counts;
    }, [shipments]);

    const activeShipmentCount =
        statusCounts.transit +
        statusCounts.pending +
        statusCounts.customs +
        statusCounts.delayed;

    const onTimeRate = useMemo(() => {
        const denominator = statusCounts.delivered + statusCounts.delayed;
        if (denominator === 0) return 0;
        return (statusCounts.delivered / denominator) * 100;
    }, [statusCounts]);

    const revenueThisMonth = useMemo(() => {
        const now = new Date();
        const currentKey = monthKey(now);
        return invoices
            .filter((invoice) => monthKey(invoice.issued) === currentKey)
            .reduce((sum, invoice) => sum + invoice.amount, 0);
    }, [invoices]);

    const monthlyComparisons = useMemo(() => {
        const now = new Date();
        const current = monthKey(now);
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previous = monthKey(prevDate);

        const shipmentCurrent = shipments.filter(
            (s) => monthKey(s.created) === current,
        ).length;
        const shipmentPrevious = shipments.filter(
            (s) => monthKey(s.created) === previous,
        ).length;

        const revenueCurrent = invoices
            .filter((i) => monthKey(i.issued) === current)
            .reduce((sum, i) => sum + i.amount, 0);
        const revenuePrevious = invoices
            .filter((i) => monthKey(i.issued) === previous)
            .reduce((sum, i) => sum + i.amount, 0);

        const onTimeCurrentData = shipments.filter(
            (s) => monthKey(s.created) === current,
        );
        const onTimePreviousData = shipments.filter(
            (s) => monthKey(s.created) === previous,
        );

        const onTimeRatio = (rows: Shipment[]) => {
            const delivered = rows.filter(
                (r) => r.status === "delivered",
            ).length;
            const delayed = rows.filter((r) => r.status === "delayed").length;
            const denom = delivered + delayed;
            return denom > 0 ? (delivered / denom) * 100 : 0;
        };

        return {
            shipments: percentageChange(shipmentCurrent, shipmentPrevious),
            revenue: percentageChange(revenueCurrent, revenuePrevious),
            onTime:
                onTimeRatio(onTimeCurrentData) -
                onTimeRatio(onTimePreviousData),
        };
    }, [shipments, invoices]);

    const weeklySeries = useMemo(() => {
        const weeks = period === "8w" ? 8 : 12;
        const now = new Date();
        const currentWeekStart = startOfWeek(now);

        const buckets: Date[] = [];
        for (let i = weeks - 1; i >= 0; i -= 1) {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() - i * 7);
            buckets.push(d);
        }

        const labels = buckets.map((d) => weekLabel(d));
        const dispatchedMap = new Map(labels.map((label) => [label, 0]));
        const deliveredMap = new Map(labels.map((label) => [label, 0]));

        for (const shipment of shipments) {
            const label = weekLabel(startOfWeek(shipment.created));
            if (!dispatchedMap.has(label)) continue;
            dispatchedMap.set(label, (dispatchedMap.get(label) ?? 0) + 1);
            if (shipment.status === "delivered") {
                deliveredMap.set(label, (deliveredMap.get(label) ?? 0) + 1);
            }
        }

        return {
            labels,
            dispatched: labels.map((label) => dispatchedMap.get(label) ?? 0),
            delivered: labels.map((label) => deliveredMap.get(label) ?? 0),
        };
    }, [shipments, period]);

    const topRoutes = useMemo(() => {
        return routes
            .filter((route) => route.status === "active")
            .sort((a, b) => b.shipments - a.shipments)
            .slice(0, 5)
            .map((route) => ({
                name: `${route.origin} -> ${route.dest}`,
                meta: `${route.mode} · ${route.avgDays} days avg`,
                count: route.shipments,
                color: MODE_COLOR[route.mode],
            }));
    }, [routes]);

    const fleetStats = useMemo(() => {
        const truckTotal = fleet.filter((v) => v.type === "Truck").length;
        const truckActive = fleet.filter(
            (v) => v.type === "Truck" && v.status === "active",
        ).length;

        const shipTotal = fleet.filter((v) => v.type === "Ship").length;
        const shipActive = fleet.filter(
            (v) => v.type === "Ship" && v.status === "active",
        ).length;

        const aircraftTotal = fleet.filter((v) => v.type === "Aircraft").length;
        const aircraftActive = fleet.filter(
            (v) => v.type === "Aircraft" && v.status === "active",
        ).length;

        const maintenance = fleet.filter(
            (v) => v.status === "maintenance",
        ).length;

        return {
            truckTotal,
            truckActive,
            shipTotal,
            shipActive,
            aircraftTotal,
            aircraftActive,
            maintenance,
        };
    }, [fleet]);

    const capacityRows = useMemo(() => {
        return warehouses
            .map((w) => {
                const pct = Math.round(
                    (w.usedSqm / Math.max(1, w.capacitySqm)) * 100,
                );
                return {
                    label: `${w.city} ${w.name}`,
                    pct,
                    color:
                        pct > 85
                            ? "var(--red)"
                            : pct > 70
                              ? "var(--amber)"
                              : "var(--green)",
                };
            })
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 4);
    }, [warehouses]);

    const recentInvoices = useMemo(
        () =>
            [...invoices]
                .sort((a, b) => b.issued.getTime() - a.issued.getTime())
                .slice(0, 4),
        [invoices],
    );

    const overdueInvoices = useMemo(
        () => invoices.filter((invoice) => invoice.status === "overdue").length,
        [invoices],
    );

    return (
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
                                    x="1"
                                    y="5"
                                    width="12"
                                    height="9"
                                    rx="1.5"
                                />
                                <path d="M13 8l3 2v4h-3V8z" />
                                <circle cx="4.5" cy="14" r="1.5" />
                                <circle cx="10.5" cy="14" r="1.5" />
                                <circle cx="15" cy="14" r="1.5" />
                            </svg>
                        </div>
                        <span
                            className={`stat-change ${monthlyComparisons.shipments >= 0 ? "up" : "down"}`}
                        >
                            {monthlyComparisons.shipments >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(monthlyComparisons.shipments).toFixed(1)}%
                        </span>
                    </div>
                    <div className="stat-value">{activeShipmentCount}</div>
                    <div className="stat-label">Active Shipments</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.min(100, activeShipmentCount)}%`,
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
                                <path d="M2 9l5 5 9-9" />
                            </svg>
                        </div>
                        <span
                            className={`stat-change ${monthlyComparisons.onTime >= 0 ? "up" : "down"}`}
                        >
                            {monthlyComparisons.onTime >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(monthlyComparisons.onTime).toFixed(1)}%
                        </span>
                    </div>
                    <div
                        className="stat-value"
                        style={{ color: "var(--green)" }}
                    >
                        {onTimeRate.toFixed(1)}%
                    </div>
                    <div className="stat-label">On-time Delivery</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.max(0, Math.min(100, onTimeRate))}%`,
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
                                <circle cx="9" cy="9" r="7" />
                                <path d="M9 5v4l2.5 2.5" />
                            </svg>
                        </div>
                    </div>
                    <div className="stat-value">{statusCounts.customs}</div>
                    <div className="stat-label">Pending Clearance</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${shipments.length > 0 ? (statusCounts.customs / shipments.length) * 100 : 0}%`,
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
                                <rect
                                    x="2"
                                    y="4"
                                    width="14"
                                    height="11"
                                    rx="1.5"
                                />
                                <path d="M2 8h14M6 2v4M12 2v4" />
                            </svg>
                        </div>
                        <span
                            className={`stat-change ${monthlyComparisons.revenue >= 0 ? "up" : "down"}`}
                        >
                            {monthlyComparisons.revenue >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(monthlyComparisons.revenue).toFixed(1)}%
                        </span>
                    </div>
                    <div className="stat-value">
                        {formatMoney(revenueThisMonth)}
                    </div>
                    <div className="stat-label">Revenue This Month</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: "60%",
                                background: "var(--purple)",
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="two-col">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Cargo Volume</div>
                            <div className="card-subtitle">
                                Shipments per week
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button
                                className="btn"
                                style={{
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    background:
                                        period === "8w"
                                            ? "var(--blue-dim)"
                                            : undefined,
                                    borderColor:
                                        period === "8w"
                                            ? "var(--blue-border)"
                                            : undefined,
                                    color:
                                        period === "8w"
                                            ? "var(--blue)"
                                            : undefined,
                                }}
                                onClick={() => setPeriod("8w")}
                            >
                                8 Weeks
                            </button>
                            <button
                                className="btn"
                                style={{
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    background:
                                        period === "12w"
                                            ? "var(--blue-dim)"
                                            : undefined,
                                    borderColor:
                                        period === "12w"
                                            ? "var(--blue-border)"
                                            : undefined,
                                    color:
                                        period === "12w"
                                            ? "var(--blue)"
                                            : undefined,
                                }}
                                onClick={() => setPeriod("12w")}
                            >
                                12 Weeks
                            </button>
                        </div>
                    </div>
                    <div className="chart-wrap" style={{ paddingTop: 10 }}>
                        <Chart
                            type="bar"
                            height={220}
                            options={chartOptions(weeklySeries.labels)}
                            series={[
                                {
                                    name: "Dispatched",
                                    data: weeklySeries.dispatched,
                                },
                                {
                                    name: "Delivered",
                                    data: weeklySeries.delivered,
                                },
                            ]}
                        />
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div
                                className="legend-dot"
                                style={{ background: "var(--blue)" }}
                            />{" "}
                            Dispatched
                        </div>
                        <div className="legend-item">
                            <div
                                className="legend-dot"
                                style={{ background: "var(--green)" }}
                            />{" "}
                            Delivered
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Active Routes</div>
                            <div className="card-subtitle">Live corridors</div>
                        </div>
                        <span
                            style={{
                                fontSize: "11.5px",
                                color: "var(--blue)",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                            onClick={() => setActivePage("routes")}
                        >
                            View all →
                        </span>
                    </div>
                    <div className="route-list">
                        {topRoutes.map((route) => (
                            <div key={route.name} className="route-item">
                                <div
                                    className="route-dot"
                                    style={{ background: route.color }}
                                />
                                <div className="route-info">
                                    <div className="route-name">
                                        {route.name}
                                    </div>
                                    <div className="route-meta">
                                        {route.meta}
                                    </div>
                                </div>
                                <span className="route-count">
                                    {route.count}
                                </span>
                            </div>
                        ))}
                        {topRoutes.length === 0 && (
                            <div className="route-item">
                                <div className="route-info">
                                    <div className="route-meta">
                                        No active route data available.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="three-col">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Fleet Status</div>
                    </div>
                    <div className="mini-stat-row">
                        <div className="mini-stat">
                            <div
                                className="mini-stat-icon"
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
                                    <circle cx="15" cy="14" r="1.5" />
                                </svg>
                            </div>
                            <div className="mini-stat-body">
                                <div className="mini-stat-label">
                                    Trucks En Route
                                </div>
                                <div className="mini-stat-value">
                                    {fleetStats.truckActive} /{" "}
                                    {fleetStats.truckTotal}
                                </div>
                            </div>
                            <div className="mini-stat-bar-wrap">
                                <div className="mini-stat-bar">
                                    <div
                                        className="mini-stat-bar-fill"
                                        style={{
                                            width: `${fleetStats.truckTotal > 0 ? (fleetStats.truckActive / fleetStats.truckTotal) * 100 : 0}%`,
                                            background: "var(--green)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mini-stat">
                            <div
                                className="mini-stat-icon"
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
                                    <path d="M9 2L2 6v10h14V6L9 2z" />
                                    <path d="M6 16V10h6v6" />
                                </svg>
                            </div>
                            <div className="mini-stat-body">
                                <div className="mini-stat-label">
                                    Container Ships
                                </div>
                                <div className="mini-stat-value">
                                    {fleetStats.shipActive} /{" "}
                                    {fleetStats.shipTotal}
                                </div>
                            </div>
                            <div className="mini-stat-bar-wrap">
                                <div className="mini-stat-bar">
                                    <div
                                        className="mini-stat-bar-fill"
                                        style={{
                                            width: `${fleetStats.shipTotal > 0 ? (fleetStats.shipActive / fleetStats.shipTotal) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mini-stat">
                            <div
                                className="mini-stat-icon"
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
                                    <path d="M9 2l1.5 4.5H15l-3.75 2.75 1.5 4.5L9 11 5.25 13.75l1.5-4.5L3 6.5h4.5L9 2z" />
                                </svg>
                            </div>
                            <div className="mini-stat-body">
                                <div className="mini-stat-label">
                                    Aircraft Cargo
                                </div>
                                <div className="mini-stat-value">
                                    {fleetStats.aircraftActive} /{" "}
                                    {fleetStats.aircraftTotal}
                                </div>
                            </div>
                            <div className="mini-stat-bar-wrap">
                                <div className="mini-stat-bar">
                                    <div
                                        className="mini-stat-bar-fill"
                                        style={{
                                            width: `${fleetStats.aircraftTotal > 0 ? (fleetStats.aircraftActive / fleetStats.aircraftTotal) * 100 : 0}%`,
                                            background: "var(--amber)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mini-stat">
                            <div
                                className="mini-stat-icon"
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
                                    <circle cx="9" cy="9" r="7" />
                                    <path d="M9 5v4M9 12.5v.5" />
                                </svg>
                            </div>
                            <div className="mini-stat-body">
                                <div className="mini-stat-label">
                                    In Maintenance
                                </div>
                                <div className="mini-stat-value">
                                    {fleetStats.maintenance} vehicles
                                </div>
                            </div>
                            <div className="mini-stat-bar-wrap">
                                <div className="mini-stat-bar">
                                    <div
                                        className="mini-stat-bar-fill"
                                        style={{
                                            width: `${fleet.length > 0 ? (fleetStats.maintenance / fleet.length) * 100 : 0}%`,
                                            background: "var(--red)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent Invoices</div>
                        <span
                            style={{
                                fontSize: "11.5px",
                                color: "var(--blue)",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                            onClick={() => setActivePage("billing")}
                        >
                            View all →
                        </span>
                    </div>
                    <div className="mini-stat-row">
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color:
                                    overdueInvoices > 0
                                        ? "var(--red)"
                                        : "var(--text-3)",
                                marginBottom: 6,
                            }}
                        >
                            {overdueInvoices} overdue
                        </div>
                        {recentInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="mini-stat"
                                style={{ alignItems: "flex-start" }}
                            >
                                <div
                                    className="mini-stat-icon"
                                    style={{
                                        background:
                                            INVOICE_STATUS_BG[invoice.status],
                                        color: INVOICE_STATUS_COLOR[
                                            invoice.status
                                        ],
                                        marginTop: 2,
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
                                        <path d="M2 8h14" />
                                        <path d="M6 11h2M10 11h2" />
                                    </svg>
                                </div>
                                <div className="mini-stat-body">
                                    <div
                                        className="mini-stat-value"
                                        style={{
                                            fontSize: 13,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                        }}
                                    >
                                        <span>{invoice.invoiceNo}</span>
                                        <span style={{ color: "var(--green)" }}>
                                            {formatMoney(invoice.amount)}
                                        </span>
                                    </div>
                                    <div className="mini-stat-label">
                                        {invoice.customer} · {invoice.status} ·{" "}
                                        {invoice.issued.toLocaleDateString(
                                            "en-GB",
                                            { day: "2-digit", month: "short" },
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentInvoices.length === 0 && (
                            <div
                                className="mini-stat"
                                style={{ alignItems: "flex-start" }}
                            >
                                <div className="mini-stat-body">
                                    <div
                                        className="mini-stat-value"
                                        style={{ fontSize: 13 }}
                                    >
                                        No invoices yet
                                    </div>
                                    <div className="mini-stat-label">
                                        Billing entries will appear here once
                                        created.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Warehouse Capacity</div>
                    </div>
                    <div className="mini-stat-row">
                        {capacityRows.map((row) => (
                            <div key={row.label} className="mini-stat">
                                <div className="mini-stat-body">
                                    <div className="mini-stat-label">
                                        {row.label}
                                    </div>
                                    <div className="mini-stat-value">
                                        {row.pct}%
                                    </div>
                                    <div className="mini-stat-bar">
                                        <div
                                            className="mini-stat-bar-fill"
                                            style={{
                                                width: `${row.pct}%`,
                                                background: row.color,
                                                height: 4,
                                                borderRadius: 2,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {capacityRows.length === 0 && (
                            <div className="mini-stat">
                                <div className="mini-stat-body">
                                    <div className="mini-stat-label">
                                        No warehouse data available.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
