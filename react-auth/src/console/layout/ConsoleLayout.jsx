import React, { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { Badge, ErrorState, LoadingState } from "../components/ui/primitives";
import { ENVIRONMENT_LABELS, ENVIRONMENTS, useConsoleScope } from "../hooks/useConsoleScope";
import { consoleTitle } from "./consoleTitle";
import { EmailVerificationBanner } from "../../account/EmailVerificationBanner";
import { WelcomeNote } from "./WelcomeNote";
import "./ConsoleLayout.css";

const NAV = [
    { to: "overview", label: "Overview" },
    { to: "applications", label: "Applications" },
    { to: "security", label: "Findings" },
    { to: "members", label: "Members" },
    { to: "settings", label: "Settings" },
];

/**
 * The console shell for one organization: /console/:orgSlug/*
 *
 * Renders nothing tenant-specific until (1) the session is valid and (2) the
 * caller is an ACTIVE member of :orgSlug according to Gait's own
 * GET /organizations/. Anything else redirects to sign-in or back to the
 * console entry -- a guessed slug never renders a tenant page.
 */
export function ConsoleLayout() {
    const { user, logout } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const [sessionChecked, setSessionChecked] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const scope = useConsoleScope();

    // "Findings · App One · Gait": the tab says where you are and in which company.
    const companyName = scope.membership?.name;
    useEffect(() => {
        document.title = consoleTitle(location.pathname, companyName);
    }, [location.pathname, companyName]);

    useEffect(() => {
        let active = true;
        Promise.resolve(validateSession())
            .catch(() => {})
            .finally(() => {
                if (active) setSessionChecked(true);
            });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!user && !sessionChecked) {
        return <FullPage><LoadingState label="Restoring your session…" /></FullPage>;
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    if (scope.organizations.isLoading) {
        return <FullPage><LoadingState label="Loading your organizations…" /></FullPage>;
    }
    if (scope.organizations.isError) {
        return <FullPage><ErrorState error={scope.organizations.error} onRetry={scope.organizations.refetch} /></FullPage>;
    }
    if (!scope.membership) {
        return <Navigate to="/console" replace />;
    }

    const onSignOut = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const envQuery = `?env=${scope.environment}`;

    return (
        <div className="gc-shell">
            <header className="gc-topbar">
                {/* The site home, not /console: /console redirects straight back to
                    this company's overview, which left no way out of the console.
                    The Overview nav item is the console's own home. */}
                <Link to="/" className="gc-brand gc-focusable" aria-label="Gait home">
                    <span className="gc-brand-mark" aria-hidden="true">◆</span>
                    <span>Gait</span>
                </Link>

                <label className="gc-switcher">
                    <span className="gc-visually-hidden">Organization</span>
                    <select
                        value={scope.orgSlug}
                        onChange={(event) => navigate(`/console/${event.target.value}/overview`)}
                        className="gc-select gc-focusable"
                    >
                        {(scope.organizations.data || []).map((row) => (
                            <option key={row.slug} value={row.slug}>{row.name}</option>
                        ))}
                    </select>
                </label>

                <div className="gc-env" role="group" aria-label="Environment">
                    {ENVIRONMENTS.map((env) => {
                        const hasData = scope.environmentsWithData.includes(env);
                        return (
                            <button
                                key={env}
                                type="button"
                                className={`gc-env-pill gc-focusable${env === scope.environment ? " is-active" : ""}${hasData ? " has-data" : ""}`}
                                aria-pressed={env === scope.environment}
                                onClick={() => scope.setEnvironment(env)}
                                title={hasData ? `${ENVIRONMENT_LABELS[env]} has data` : `No data in ${ENVIRONMENT_LABELS[env]} yet`}
                            >
                                {ENVIRONMENT_LABELS[env]}
                            </button>
                        );
                    })}
                </div>

                <div className="gc-user">
                    <Badge value={scope.membership.org_role} />
                    <span className="gc-user-email" title={user?.email}>{user?.email}</span>
                    <Link to="/docs" className="gc-docs-link gc-focusable">Docs</Link>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onSignOut}>
                        Sign out
                    </button>
                </div>
            </header>

            <div className="gc-body">
                <nav className="gc-sidenav" aria-label="Console">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={`${item.to}${envQuery}`}
                            className={({ isActive }) => `gc-navlink gc-focusable${isActive ? " is-active" : ""}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <main className="gc-main">
                    <EmailVerificationBanner />
                    <WelcomeNote />
                    <Outlet context={scope} />
                </main>
            </div>
        </div>
    );
}

function FullPage({ children }) {
    return <div className="gc-fullpage">{children}</div>;
}

export default ConsoleLayout;
