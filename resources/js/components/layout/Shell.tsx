import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Dashboard from "../../pages/Dashboard";
import Shipments from "../../pages/Shipments";
import Bookings from "../../pages/Bookings";
import Fleet from "../../pages/Fleet";
import Routes from "../../pages/Routes";
import Warehouses from "../../pages/Warehouses";
import Customers from "../../pages/Customers";
import Billing from "../../pages/Billing";
import Reports from "../../pages/Reports";
import Settings from "../../pages/Settings";
import AccessControl from "../../pages/AccessControl";
import Placeholder from "../../pages/Placeholder";
import Tracking from "../../pages/Tracking";
import NewShipmentModal from "../shared/NewShipmentModal";
import Toast from "../shared/Toast";
import { useApp } from "../../context/AppContext";

export default function Shell() {
    const { activePage, toast } = useApp();
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="shell">
            <Sidebar />
            <div className="main">
                <Topbar onNewShipment={() => setShowModal(true)} />

                <div
                    className={`page${activePage === "dashboard" ? " active" : ""}`}
                >
                    <Dashboard />
                </div>
                <div
                    className={`page${activePage === "shipments" ? " active" : ""}`}
                >
                    <Shipments />
                </div>
                <div
                    className={`page${activePage === "tracking" ? " active" : ""}`}
                >
                    <Tracking />
                </div>
                <div
                    className={`page${activePage === "bookings" ? " active" : ""}`}
                >
                    <Bookings />
                </div>
                <div
                    className={`page${activePage === "fleet" ? " active" : ""}`}
                >
                    <Fleet />
                </div>
                <div
                    className={`page${activePage === "routes" ? " active" : ""}`}
                >
                    <Routes />
                </div>
                <div
                    className={`page${activePage === "warehouses" ? " active" : ""}`}
                >
                    <Warehouses />
                </div>
                <div
                    className={`page${activePage === "customers" ? " active" : ""}`}
                >
                    <Customers />
                </div>
                <div
                    className={`page${activePage === "billing" ? " active" : ""}`}
                >
                    <Billing />
                </div>
                <div
                    className={`page${activePage === "reports" ? " active" : ""}`}
                >
                    <Reports />
                </div>
                <div
                    className={`page${activePage === "settings" ? " active" : ""}`}
                >
                    <Settings />
                </div>
                <div
                    className={`page${activePage === "access-control" ? " active" : ""}`}
                >
                    <AccessControl />
                </div>
                <div
                    className={`page${activePage === "placeholder" ? " active" : ""}`}
                >
                    <Placeholder />
                </div>
            </div>

            {showModal && (
                <NewShipmentModal onClose={() => setShowModal(false)} />
            )}
            {toast && <Toast message={toast.message} color={toast.color} />}
        </div>
    );
}
