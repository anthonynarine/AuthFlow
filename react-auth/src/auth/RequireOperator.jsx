import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { isGaitOperator } from "./operator";
import "../components/not-found/NotFound.css";

/**
 * OPS1 route guard for operator pages. It re-checks the session first (the
 * flag comes from validate-session, not from whatever user object is already
 * in memory), and the page itself doesn't mount until that check says
 * "operator", so a non-operator never fires the page's operator API calls.
 *
 * Signed out: the sign-in page. Signed in but not an operator: "Not
 * available". The server enforces the same rule on every operator API.
 */
export function RequireOperator({ children }) {
    const { user } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let active = true;
        Promise.resolve(validateSession())
            .catch(() => {})
            .finally(() => {
                if (active) setChecked(true);
            });
        return () => {
            active = false;
        };
        // Once per visit; validateSession's identity isn't the trigger.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!checked) {
        return (
            <div className="not-found-page" role="status">
                <p className="not-found-body">Checking access…</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isGaitOperator(user)) {
        return (
            <div className="not-found-page">
                <h1>Not available</h1>
                <p className="not-found-body">This page is for Gait operators only.</p>
                <Link to="/" className="btn-pill btn-pill-primary">Back to home</Link>
            </div>
        );
    }

    return children;
}

export default RequireOperator;
