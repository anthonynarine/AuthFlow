import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { verifyEmailToken } from "./emailVerificationApi";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { retryAfterSeconds, useRetryAfter } from "./useRetryAfter";
import "./emailVerification.css";

/** The token from "#token=...", or null. Never from the query string, which servers and logs see. */
export function readTokenFromHash(hash) {
    const params = new URLSearchParams((hash || "").replace(/^#/, ""));
    const token = params.get("token");
    return token && token.length <= 256 ? token : null;
}

/** Drop the fragment from the address bar and history entry without a navigation. */
function stripHash() {
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${search}`);
}

/**
 * /verify-email#token=...: confirms the address the link was sent to.
 * States: verifying | confirmed | invalid (used/expired/superseded, or no
 * token) | already confirmed (signed in and already verified) | rate limited.
 */
export function VerifyEmailPage() {
    const { user } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const [token] = useState(() => readTokenFromHash(window.location.hash));
    const [state, setState] = useState(token ? { status: "verifying" } : { status: "invalid" });
    const [checkedSession, setCheckedSession] = useState(false);
    const started = useRef(false);
    const retry = useRetryAfter();

    const submit = async () => {
        setState({ status: "verifying" });
        try {
            const data = await verifyEmailToken(token);
            setState({ status: "confirmed", email: data.email });
            // A signed-in tab (this one or another) should drop its banner now.
            Promise.resolve(validateSession()).catch(() => {});
        } catch (error) {
            if (error?.response?.status === 429) {
                retry.start(retryAfterSeconds(error, 30));
                setState({ status: "rate-limited" });
                return;
            }
            setState({ status: "invalid" }); // the effect below then checks the session
        }
    };

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        if (window.location.hash) stripHash();
        if (token) {
            submit();
        } else {
            // No token: find out whether they're signed in, to offer a new link.
            Promise.resolve(validateSession()).catch(() => {}).finally(() => setCheckedSession(true));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // After an invalid link, a signed-in session tells us whether they're
    // already confirmed (nothing to do) or need a new link.
    useEffect(() => {
        if (state.status === "invalid" && token && !checkedSession) {
            Promise.resolve(validateSession()).catch(() => {}).finally(() => setCheckedSession(true));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.status]);

    let body;
    if (state.status === "verifying") {
        body = (
            <>
                <h1 className="gv-title">Confirming your email…</h1>
                <p className="gv-text" role="status">This takes a moment.</p>
            </>
        );
    } else if (state.status === "confirmed") {
        body = (
            <>
                <h1 className="gv-title">Email confirmed</h1>
                <p className="gv-text">
                    {state.email ? <><strong>{state.email}</strong> is confirmed. </> : null}
                    You can now create a company or accept an invite.
                </p>
                <Link className="gv-button" to={user ? "/console" : "/login"}>
                    {user ? "Continue" : "Sign in to continue"}
                </Link>
            </>
        );
    } else if (state.status === "rate-limited") {
        body = (
            <>
                <h1 className="gv-title">Too many attempts</h1>
                <p className="gv-text" role="status">
                    {retry.waiting ? `Please wait ${retry.remaining} seconds, then try again.` : "You can try again now."}
                </p>
                <button type="button" className="gv-button" onClick={submit} disabled={retry.waiting}>
                    {retry.waiting ? `Try again in ${retry.remaining}s` : "Try again"}
                </button>
            </>
        );
    } else if (user && user.email_verified === true) {
        body = (
            <>
                <h1 className="gv-title">Your email is already confirmed</h1>
                <p className="gv-text"><strong>{user.email}</strong> is confirmed, so this link isn't needed.</p>
                <Link className="gv-button" to="/console">Continue</Link>
            </>
        );
    } else {
        body = (
            <>
                <h1 className="gv-title">This link can't be used</h1>
                <p className="gv-text">
                    It may have expired (links last 48 hours), already been used, or been replaced by a newer one.
                </p>
                {!checkedSession ? null : user ? (
                    <div className="gv-actions">
                        <p className="gv-text">Send a new link to <strong>{user.email}</strong>:</p>
                        <ResendVerificationButton className="gv-button" />
                    </div>
                ) : (
                    <p className="gv-text">
                        <Link to="/login">Sign in</Link> to get a new link.
                    </p>
                )}
            </>
        );
    }

    return (
        <main className="gv-page">
            <section className="gv-card" aria-live="polite">
                <p className="gv-brand"><span aria-hidden="true">◆</span> Gait</p>
                {body}
            </section>
        </main>
    );
}

export default VerifyEmailPage;
