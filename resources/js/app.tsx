import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import Shell from "./components/layout/Shell";
import Login from "./pages/Login";
import "../css/app.css";

const root = document.getElementById("app");
if (root) {
    const isLoginRoute = window.location.pathname === "/login";

    createRoot(root).render(
        <React.StrictMode>
            {isLoginRoute ? (
                <Login />
            ) : (
                <AppProvider>
                    <Shell />
                </AppProvider>
            )}
        </React.StrictMode>,
    );
}
