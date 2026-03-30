import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useApp } from "../context/AppContext";
import { fetchBillingInvoices } from "../lib/api";
import type { BillingInvoice, Shipment, TransportMode } from "../types";

type Period = "3m" | "6m" | "1y";

const PERIOD_TO_MONTHS: Record<Period, number> = {
    "3m": 3,
    "6m": 6,
    "1y": 12,
};

const MODE_COLORS: Record<TransportMode, string> = {
    Sea: "var(--blue)",
    Air: "var(--purple)",
    Road: "var(--amber)",
    Rail: "var(--green)",
};

function monthLabel(date: Date): string {
    return date.toLocaleDateString("en-GB", { month: "short" });
}

function getMonthBuckets(period: Period): string[] {
    const size = PERIOD_TO_MONTHS[period];
    const now = new Date();
    now.setDate(1);

    const labels: string[] = [];
    for (let i = size - 1; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        labels.push(monthLabel(d));
    }

    return labels;
}

function percentageChange(current: number, previous: number): number {
    if (previous <= 0) {
        return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
}

function splitSeries(series: number[]): { current: number; previous: number } {
    const midpoint = Math.max(1, Math.floor(series.length / 2));
    const previous = series
        .slice(0, midpoint)
        .reduce((sum, value) => sum + value, 0);
    const current = series
        .slice(midpoint)
        .reduce((sum, value) => sum + value, 0);
    return { current, previous };
}

function chartOptions(color: string, categories: string[]): ApexOptions {
    return {
        chart: {
            type: "bar",
            toolbar: { show: false },
            sparkline: { enabled: false },
            foreColor: "var(--text-3)",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "42%",
            },
        },
        dataLabels: { enabled: false },
        grid: {
            borderColor: "var(--border)",
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
        },
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
        tooltip: {
            theme: "dark",
        },
        colors: [color],
        legend: { show: false },
    };
}

function routeKey(shipment: Shipment): string {
    return `${shipment.origin} -> ${shipment.dest}`;
}

export default function Reports() {
    const { shipments, routes, fleet, showToast, companySettings } = useApp();
    const [period, setPeriod] = useState<Period>("6m");
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
                showToast("Billing data unavailable for reports.", "amber");
            }
        };

        loadInvoices();
    }, [showToast]);

    const monthBuckets = useMemo(() => getMonthBuckets(period), [period]);

    const shipmentsByMonth = useMemo(() => {
        const counts = new Map(monthBuckets.map((label) => [label, 0]));

        for (const shipment of shipments) {
            const label = monthLabel(shipment.created);
            if (!counts.has(label)) continue;
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        return monthBuckets.map((label) => ({
            month: label,
            value: counts.get(label) ?? 0,
        }));
    }, [shipments, monthBuckets]);

    const revenueByMonth = useMemo(() => {
        const totals = new Map(monthBuckets.map((label) => [label, 0]));

        for (const invoice of invoices) {
            const label = monthLabel(invoice.issued);
            if (!totals.has(label)) continue;
            totals.set(label, (totals.get(label) ?? 0) + invoice.amount);
        }

        return monthBuckets.map((label) => ({
            month: label,
            value: totals.get(label) ?? 0,
        }));
    }, [invoices, monthBuckets]);

    const modeSplit = useMemo(() => {
        const total = Math.max(shipments.length, 1);
        const modeCount: Record<TransportMode, number> = {
            Sea: 0,
            Air: 0,
            Road: 0,
            Rail: 0,
        };

        for (const shipment of shipments) {
            modeCount[shipment.mode] += 1;
        }

        return (Object.keys(modeCount) as TransportMode[]).map((mode) => ({
            label: mode,
            value: Number(((modeCount[mode] / total) * 100).toFixed(1)),
            color: MODE_COLORS[mode],
        }));
    }, [shipments]);

    const deliveryCounts = useMemo(() => {
        const delivered = shipments.filter(
            (s) => s.status === "delivered",
        ).length;
        const delayed = shipments.filter((s) => s.status === "delayed").length;
        const customs = shipments.filter((s) => s.status === "customs").length;
        return { delivered, delayed, customs };
    }, [shipments]);

    const averageTransitDays = useMemo(() => {
        if (shipments.length === 0) return 0;

        const days = shipments
            .map((s) => {
                const duration = s.eta.getTime() - s.created.getTime();
                return Math.max(0, duration / (1000 * 60 * 60 * 24));
            })
            .filter((d) => Number.isFinite(d));

        if (days.length === 0) return 0;
        return days.reduce((sum, d) => sum + d, 0) / days.length;
    }, [shipments]);

    const onTimeRate = useMemo(() => {
        const denominator = deliveryCounts.delivered + deliveryCounts.delayed;
        if (denominator === 0) return 0;
        return (deliveryCounts.delivered / denominator) * 100;
    }, [deliveryCounts]);

    const fleetUtilization = useMemo(() => {
        if (fleet.length === 0) return 0;
        const active = fleet.filter((v) => v.status === "active").length;
        return (active / fleet.length) * 100;
    }, [fleet]);

    const customsClearanceRate = useMemo(() => {
        const denominator = deliveryCounts.delivered + deliveryCounts.customs;
        if (denominator === 0) return 0;
        return (deliveryCounts.delivered / denominator) * 100;
    }, [deliveryCounts]);

    const customerSatisfaction = useMemo(() => {
        return Math.max(0, Math.min(100, onTimeRate - 4));
    }, [onTimeRate]);

    const performanceMetrics = useMemo(
        () => [
            {
                label: "On-Time Delivery",
                value: Number(onTimeRate.toFixed(1)),
                target: 95,
                color: "var(--green)",
            },
            {
                label: "Customer Satisfaction",
                value: Number(customerSatisfaction.toFixed(1)),
                target: 90,
                color: "var(--blue)",
            },
            {
                label: "Fleet Utilization",
                value: Number(fleetUtilization.toFixed(1)),
                target: 80,
                color: "var(--amber)",
            },
            {
                label: "Customs Clearance Rate",
                value: Number(customsClearanceRate.toFixed(1)),
                target: 95,
                color: "var(--purple)",
            },
        ],
        [
            onTimeRate,
            customerSatisfaction,
            fleetUtilization,
            customsClearanceRate,
        ],
    );

    const topRoutes = useMemo(() => {
        const revenueByRoute = new Map<string, number>();
        const shipmentByRef = new Map(
            shipments.map((s) => [(s.awbNumber || s.id).trim(), s]),
        );

        for (const invoice of invoices) {
            const ref = invoice.shipmentRef?.trim();
            if (!ref || ref === "—") continue;
            const linked = shipmentByRef.get(ref);
            if (!linked) continue;
            const key = routeKey(linked);
            revenueByRoute.set(
                key,
                (revenueByRoute.get(key) ?? 0) + invoice.amount,
            );
        }

        const recentBoundary = new Date();
        recentBoundary.setMonth(
            recentBoundary.getMonth() - Math.ceil(PERIOD_TO_MONTHS[period] / 2),
        );

        const previousBoundary = new Date(recentBoundary);
        previousBoundary.setMonth(
            previousBoundary.getMonth() -
                Math.ceil(PERIOD_TO_MONTHS[period] / 2),
        );

        const trendMap = new Map<
            string,
            { recent: number; previous: number }
        >();
        for (const shipment of shipments) {
            const key = routeKey(shipment);
            const row = trendMap.get(key) ?? { recent: 0, previous: 0 };
            if (shipment.created >= recentBoundary) {
                row.recent += 1;
            } else if (shipment.created >= previousBoundary) {
                row.previous += 1;
            }
            trendMap.set(key, row);
        }

        return routes
            .map((route) => {
                const key = `${route.origin} -> ${route.dest}`;
                const trend = trendMap.get(key) ?? {
                    recent: route.shipments,
                    previous: 0,
                };
                const change = percentageChange(trend.recent, trend.previous);
                const revenue = revenueByRoute.get(key) ?? 0;

                return {
                    route: `${route.origin} -> ${route.dest}`,
                    mode: route.mode,
                    shipments: route.shipments,
                    revenue,
                    change,
                };
            })
            .sort((a, b) => b.shipments - a.shipments)
            .slice(0, 6);
    }, [routes, shipments, invoices, period]);

    const shipmentsSeries = shipmentsByMonth.map((d) => d.value);
    const revenueSeries = revenueByMonth.map((d) =>
        Number((d.value / 1000).toFixed(1)),
    );
    const shipmentsTotals = splitSeries(shipmentsSeries);
    const revenueTotals = splitSeries(revenueSeries);

    const totalShipments = shipmentsSeries.reduce(
        (sum, value) => sum + value,
        0,
    );
    const totalRevenue = revenueByMonth.reduce((sum, d) => sum + d.value, 0);
    const totalRevenueK = revenueSeries.reduce((sum, value) => sum + value, 0);

    return (
        <div className="content">
            {/* STAT CARDS */}
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
                            </svg>
                        </div>
                        <span className="stat-change up">
                            {percentageChange(
                                shipmentsTotals.current,
                                shipmentsTotals.previous,
                            ) >= 0
                                ? "↑"
                                : "↓"}{" "}
                            {Math.abs(
                                percentageChange(
                                    shipmentsTotals.current,
                                    shipmentsTotals.previous,
                                ),
                            ).toFixed(1)}
                            %
                        </span>
                    </div>
                    <div className="stat-value">{totalShipments}</div>
                    <div className="stat-label">Shipments ({period})</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.min(100, totalShipments)}%`,
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
                        <span className="stat-change up">
                            {percentageChange(
                                revenueTotals.current,
                                revenueTotals.previous,
                            ) >= 0
                                ? "↑"
                                : "↓"}{" "}
                            {Math.abs(
                                percentageChange(
                                    revenueTotals.current,
                                    revenueTotals.previous,
                                ),
                            ).toFixed(1)}
                            %
                        </span>
                    </div>
                    <div className="stat-value">
                        {formatMoney(totalRevenue)}
                    </div>
                    <div className="stat-label">Revenue ({period})</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.min(100, totalRevenueK)}%`,
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
                                <path d="M2 9l5 5 9-9" />
                            </svg>
                        </div>
                    </div>
                    <div className="stat-value">{onTimeRate.toFixed(1)}%</div>
                    <div className="stat-label">On-Time Rate</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.max(0, Math.min(100, onTimeRate))}%`,
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
                                <circle cx="9" cy="9" r="7.5" />
                                <path d="M9 5v4l3 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="stat-value">
                        {averageTransitDays.toFixed(1)}d
                    </div>
                    <div className="stat-label">Avg Transit Time</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.max(0, Math.min(100, (averageTransitDays / 10) * 100))}%`,
                                background: "var(--purple)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                }}
            >
                <div className="card" style={{ padding: "20px 24px 24px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 20,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: "var(--text-1)",
                                    marginBottom: 3,
                                }}
                            >
                                Shipment Volume
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-3)",
                                }}
                            >
                                Monthly trend
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 3,
                                background: "var(--bg-3)",
                                borderRadius: 7,
                                padding: 3,
                                border: "1px solid var(--border)",
                            }}
                        >
                            {(["3m", "6m", "1y"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: 5,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        border: "none",
                                        background:
                                            period === p
                                                ? "var(--blue)"
                                                : "transparent",
                                        color:
                                            period === p
                                                ? "white"
                                                : "var(--text-3)",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Chart
                        type="bar"
                        height={180}
                        options={chartOptions("#2f80ed", monthBuckets)}
                        series={[{ name: "Shipments", data: shipmentsSeries }]}
                    />
                </div>

                <div className="card" style={{ padding: "20px 24px 24px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 20,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: "var(--text-1)",
                                    marginBottom: 3,
                                }}
                            >
                                Revenue ({activeCurrency}, x1k)
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-3)",
                                }}
                            >
                                Monthly trend
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: "var(--green)",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            {formatMoney(totalRevenue)}
                        </div>
                    </div>
                    <Chart
                        type="bar"
                        height={180}
                        options={chartOptions("#27ae60", monthBuckets)}
                        series={[
                            {
                                name: `Revenue (${activeCurrency} x1k)`,
                                data: revenueSeries,
                            },
                        ]}
                    />
                </div>
            </div>

            {/* MODE SPLIT + PERFORMANCE */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                }}
            >
                <div className="card" style={{ padding: "20px 24px" }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "var(--text-1)",
                            marginBottom: 4,
                        }}
                    >
                        Shipment by Mode
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--text-3)",
                            marginBottom: 20,
                        }}
                    >
                        Distribution across transport modes
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        {modeSplit.map((m) => (
                            <div key={m.label}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 7,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: m.color,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "var(--text-1)",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {m.label}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: m.color,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {m.value}%
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 8,
                                        borderRadius: 4,
                                        background: "var(--bg-4)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${m.value}%`,
                                            borderRadius: 4,
                                            background: m.color,
                                            transition:
                                                "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: "20px 24px" }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "var(--text-1)",
                            marginBottom: 4,
                        }}
                    >
                        Performance vs Target
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--text-3)",
                            marginBottom: 20,
                        }}
                    >
                        Current period KPIs against goals
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                        }}
                    >
                        {performanceMetrics.map((m) => (
                            <div key={m.label}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 8,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "var(--text-1)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {m.label}
                                    </span>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 14,
                                                color: m.color,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {m.value}%
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            / {m.target}% target
                                        </span>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        height: 8,
                                        borderRadius: 4,
                                        background: "var(--bg-4)",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${m.value}%`,
                                            borderRadius: 4,
                                            background: m.color,
                                            transition:
                                                "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginTop: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 10,
                                            color:
                                                m.value >= m.target
                                                    ? "var(--green)"
                                                    : "var(--amber)",
                                        }}
                                    >
                                        {m.value >= m.target
                                            ? "✓ On target"
                                            : `${(m.target - m.value).toFixed(1)}% below target`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TOP ROUTES */}
            <div className="card" style={{ padding: 0 }}>
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border)",
                        fontWeight: 600,
                        color: "var(--text-1)",
                    }}
                >
                    Top Performing Routes
                </div>
                <table className="sh-table">
                    <thead>
                        <tr>
                            <th>Route</th>
                            <th>Mode</th>
                            <th>Shipments</th>
                            <th>Revenue</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topRoutes.map((r, i) => (
                            <tr key={i}>
                                <td
                                    style={{
                                        fontWeight: 500,
                                        color: "var(--text-1)",
                                    }}
                                >
                                    {r.route}
                                </td>
                                <td>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "2px 8px",
                                            borderRadius: 20,
                                            background: "var(--blue-dim)",
                                            color: "var(--blue)",
                                        }}
                                    >
                                        {r.mode}
                                    </span>
                                </td>
                                <td style={{ color: "var(--text-2)" }}>
                                    {r.shipments}
                                </td>
                                <td
                                    style={{
                                        fontWeight: 600,
                                        color: "var(--green)",
                                    }}
                                >
                                    {formatMoney(r.revenue)}
                                </td>
                                <td
                                    style={{
                                        color:
                                            r.change >= 0
                                                ? "var(--green)"
                                                : "var(--red)",
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }}
                                >
                                    {r.change >= 0 ? "↑" : "↓"}{" "}
                                    {Math.abs(r.change).toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                        {topRoutes.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        textAlign: "center",
                                        color: "var(--text-3)",
                                        padding: "18px 12px",
                                    }}
                                >
                                    No route performance data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
