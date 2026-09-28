import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { GateMark } from "../brand/GateMark";
import { StatusLine } from "../ds/components";
import { UserMenu } from "./UserMenu";
import "../ds/ds.css";

/**
 * The frame for /account pages: the person's own sign-in, the same in every
 * workspace, so it lives outside /console/<workspace>. Signed-out visitors go
 * to sign-in and come back here.
 */
export function AccountLayout({ children, narrow = false }) {
    const { user, logout } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const location = useLocation();
    const navigate = useNavigate();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!user && checked) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    const onSignOut = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="ds-page">
            <header className="ds-top">
                <Link className="ds-brand" to="/" aria-label="Gait home">
                    <GateMark className="ds-gate-mark" />
                    <span>Gait</span>
                </Link>
                <div className="ds-top-end">
                    <Link className="ds-top-link" to="/console">
                        Back to console
                    </Link>
                    {user ? <UserMenu user={user} onSignOut={onSignOut} /> : null}
                </div>
            </header>
            <main className={`ds-main${narrow ? " ds-main--narrow" : ""}`}>
                {user ? children : <StatusLine>Restoring your session…</StatusLine>}
            </main>
        </div>
    );
}

export default AccountLayout;
