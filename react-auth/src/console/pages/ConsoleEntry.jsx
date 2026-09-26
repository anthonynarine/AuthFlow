import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { ErrorState, LoadingState } from "../components/ui/primitives";
import { useMyOrganizations } from "../hooks/useConsoleScope";
import "../layout/ConsoleLayout.css";

const LAST_ORG_KEY = "gait.console.lastOrg";

/** Per-viewer convenience only; never trusted for access (the layout re-checks membership). */
export function rememberLastOrganization(slug) {
    try {
        window.localStorage.setItem(LAST_ORG_KEY, slug);
    } catch {
        // Storage unavailable (private mode): the console still works.
    }
}

function readLastOrganization() {
    try {
        return window.localStorage.getItem(LAST_ORG_KEY);
    } catch {
        return null;
    }
}

/**
 * /console -- decide where a signed-in person lands:
 * no organization yet -> onboarding; otherwise the last organization they
 * used (if they are still a member) or their first one.
 */
export function ConsoleEntry() {
    const { user } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const location = useLocation();
    const [sessionChecked, setSessionChecked] = useState(false);
    const organizations = useMyOrganizations({ enabled: Boolean(user) });

    useEffect(() => {
        Promise.resolve(validateSession())
            .catch(() => {})
            .finally(() => setSessionChecked(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!user) {
        if (!sessionChecked) {
            return <div className="gc-fullpage"><LoadingState label="Restoring your session…" /></div>;
        }
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (organizations.isLoading) {
        return <div className="gc-fullpage"><LoadingState label="Loading your organizations…" /></div>;
    }
    if (organizations.isError) {
        return (
            <div className="gc-fullpage">
                <ErrorState error={organizations.error} onRetry={organizations.refetch} />
            </div>
        );
    }
    const rows = organizations.data || [];
    if (rows.length === 0) {
        return <Navigate to="/workspace/onboarding" replace />;
    }
    const last = readLastOrganization();
    const target = rows.find((row) => row.slug === last) || rows[0];
    return <Navigate to={`/console/${target.slug}/overview`} replace />;
}

export default ConsoleEntry;
