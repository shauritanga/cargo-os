import { FormEvent, useMemo, useState } from "react";
import { loginApi } from "../lib/api";

export default function Login() {
    const [email, setEmail] = useState("ops@rtexpress.com");
    const [password, setPassword] = useState("Password123!");
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isValid = useMemo(() => {
        return email.trim().length > 3 && password.length >= 8;
    }, [email, password]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.includes("@")) {
            setError("Please enter a valid work email.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await loginApi(email, password, remember);

            if (remember) {
                try {
                    window.localStorage.setItem("cargoos:last-login", email);
                } catch {
                    // Ignore storage errors in restricted contexts.
                }
            }

            window.location.assign("/");
        } catch (e: any) {
            setError(e?.message ?? "Unable to sign in.");
            setLoading(false);
        }
    };

    return (
        <main className="login-root">
            <section className="login-brand-panel">
                <div className="login-brand-glow login-brand-glow-a" />
                <div className="login-brand-glow login-brand-glow-b" />

                <div className="login-brand-top">
                    <div className="login-brand-badge">
                        CargoOS · RT Express
                    </div>
                    <h1>Move freight with precision and speed.</h1>
                    <p>
                        One operations cockpit for bookings, fleet, routes, and
                        airwaybills.
                    </p>
                </div>

                <div className="login-brand-stats">
                    <article>
                        <strong>98.2%</strong>
                        <span>On-time dispatch</span>
                    </article>
                    <article>
                        <strong>42k</strong>
                        <span>Shipments tracked monthly</span>
                    </article>
                    <article>
                        <strong>24/7</strong>
                        <span>Control tower visibility</span>
                    </article>
                </div>
            </section>

            <section className="login-form-panel" aria-label="Sign in form">
                <form className="login-card" onSubmit={handleSubmit}>
                    <div className="login-card-head">
                        <div className="login-chip">Operations Portal</div>
                        <h2>Sign in to your workspace</h2>
                        <p>Use your company account to continue.</p>
                    </div>

                    <div className="login-fieldset">
                        <label htmlFor="email">Work email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            placeholder="ops@rtexpress.com"
                            required
                        />
                    </div>

                    <div className="login-fieldset">
                        <label htmlFor="password">Password</label>
                        <div className="login-password-wrap">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="login-ghost-btn"
                                onClick={() => setShowPassword((v) => !v)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="login-meta-row">
                        <label className="login-checkbox">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            <span>Remember me</span>
                        </label>
                        <a href="#" onClick={(e) => e.preventDefault()}>
                            Forgot password?
                        </a>
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-submit"
                        disabled={!isValid || loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                    <div className="login-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="login-social-row">
                        <button
                            type="button"
                            className="login-alt-btn"
                            onClick={() => {
                                setEmail("ops@rtexpress.com");
                                setPassword("Password123!");
                            }}
                        >
                            Demo account
                        </button>
                        <button type="button" className="login-alt-btn">
                            SSO
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
