import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { INVITE_ACCEPT_PATH } from "../../auth/returnTo";
import { ResendVerificationButton } from "../../account/ResendVerificationButton";
import { retryAfterSeconds, useRetryAfter } from "../../account/useRetryAfter";
import { readTokenFromHash } from "../../account/VerifyEmailPage";
import { acceptInvite, previewInvite } from "../api/consoleApi";
import { consoleKeys } from "../api/queryKeys";
import { useMyOrganizations } from "../hooks/useConsoleScope";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "../pages/members/memberRules";
import { formatDateTime } from "../utils/formatDate";
import { apiErrorMessage } from "../utils/apiErrors";
import {
    clearPendingInvite,
    getPendingInvite,
    setPendingPreview,
    setPendingToken,
    subscribePendingInvite,
} from "./pendingInvite";
import "../../account/emailVerification.css";
import "./AcceptInvite.css";

function stripHash() {
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${search}`);
}

const CANT_BE_USED = "This invite can't be used. Ask whoever invited you for a new one.";

/**
 * /console/invites/accept#token=... (INVITES_AND_JOINING section 3).
 * The token lives only in memory (pendingInvite.js). Every dead-link reason
 * -- invalid, used, expired, revoked, suspended company -- looks the same and
 * shows nothing about the company.
 */
export function AcceptInvitePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const [invite, setInvite] = useState(() => {
        const fromLink = readTokenFromHash(window.location.hash);
        if (fromLink) setPendingToken(fromLink);
        return getPendingInvite();
    });
    const [phase, setPhase] = useState(invite ? "loading" : "missing"); // loading | ready | invalid | missing | rate-limited
    const [sessionChecked, setSessionChecked] = useState(false);
    const [acceptState, setAcceptState] = useState({ status: "idle" }); // idle | joining | unverified | error
    const previewed = useRef(null);
    const retry = useRetryAfter();
    const organizations = useMyOrganizations({ enabled: Boolean(user) });

    const runPreview = async (token) => {
        previewed.current = token;
        setPhase("loading");
        try {
            const preview = await previewInvite(token);
            setPendingPreview(preview); // clears it at once if already expired
            if (!getPendingInvite()) {
                setPhase("invalid");
                return;
            }
            setPhase("ready");
        } catch (error) {
            if (error?.response?.status === 429) {
                retry.start(retryAfterSeconds(error, 60));
                setPhase("rate-limited");
                return;
            }
            clearPendingInvite();
            setPhase("invalid");
        }
    };

    // First visit: strip the fragment, preview once (StrictMode-safe), and
    // find out who's signed in.
    useEffect(() => {
        if (window.location.hash) stripHash();
        const current = getPendingInvite();
        if (current && previewed.current !== current.token) {
            if (current.preview) {
                previewed.current = current.token;
                setPhase("ready");
            } else {
                runPreview(current.token);
            }
        }
        Promise.resolve(validateSession()).catch(() => {}).finally(() => setSessionChecked(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // A second invite link opened in this tab only changes the fragment.
    useEffect(() => {
        const onHashChange = () => {
            const next = readTokenFromHash(window.location.hash);
            if (window.location.hash) stripHash();
            if (next) {
                setPendingToken(next);
                setAcceptState({ status: "idle" });
                runPreview(next);
            }
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The store can clear itself (invite expired, signed out elsewhere).
    useEffect(
        () =>
            subscribePendingInvite((next, reason) => {
                setInvite(next);
                if (reason === "expired") setPhase("invalid");
                if (reason === "signed-out") setPhase("missing");
            }),
        []
    );

    const goSignIn = (path) => navigate(path, { state: { returnTo: INVITE_ACCEPT_PATH } });

    const onSwitchAccount = async () => {
        await logout({ keepInvite: true }); // deliberately keeps the invite through this sign-out
        goSignIn("/login");
    };

    const onJoin = async () => {
        setAcceptState({ status: "joining" });
        try {
            const joined = await acceptInvite(invite.token);
            clearPendingInvite();
            await queryClient.invalidateQueries({ queryKey: consoleKeys.myOrganizations() });
            navigate(`/console/${joined.organization_slug}/overview`, {
                replace: true,
                state: { welcome: { company: joined.organization_name, role: joined.org_role } },
            });
        } catch (error) {
            const code = error?.response?.data?.code;
            if (error?.response?.status === 429) {
                retry.start(retryAfterSeconds(error, 60));
                setAcceptState({ status: "rate-limited" });
            } else if (code === "EMAIL_NOT_VERIFIED") {
                setAcceptState({ status: "unverified" });
            } else if (code === "ALREADY_MEMBER") {
                setAcceptState({ status: "already-member" });
            } else if (code === "INVITE_INVALID" || error?.response?.status === 404) {
                // INV1: they may have joined already, by confirmed email in
                // another tab (which used up this invite). Say so, not "can't be used".
                const fresh = await organizations.refetch();
                if ((fresh.data || []).some((row) => row.slug === invite?.preview?.organization_slug)) {
                    setAcceptState({ status: "already-member" });
                } else {
                    clearPendingInvite();
                    setPhase("invalid");
                }
            } else {
                setAcceptState({ status: "error", message: apiErrorMessage(error) });
            }
        }
    };

    const onConfirmedEmail = async () => {
        await Promise.resolve(validateSession()).catch(() => {});
        // They may have joined from the confirmation tab in the meantime (INV1).
        await organizations.refetch();
        setAcceptState({ status: "idle" });
    };

    const preview = invite?.preview;
    let title;
    let body;

    if (phase === "missing") {
        title = "Open your invite link again";
        body = (
            <p className="gv-text">
                We couldn't find the invite in this browser tab. Open the link from your invite email again; it still
                works if it hasn't been used or expired.
            </p>
        );
    } else if (phase === "invalid") {
        title = "This invite can't be used";
        body = <p className="gv-text">{CANT_BE_USED}</p>;
    } else if (phase === "rate-limited" || acceptState.status === "rate-limited") {
        title = "Too many attempts";
        body = (
            <>
                <p className="gv-text">Please wait a little, then try again.</p>
                <button
                    type="button"
                    className="gv-button"
                    disabled={retry.waiting}
                    onClick={() => (phase === "rate-limited" ? runPreview(invite.token) : onJoin())}
                >
                    {retry.waiting ? `Try again in ${retry.remaining}s` : "Try again"}
                </button>
            </>
        );
    } else if (phase === "loading" || !preview || (!sessionChecked && !user)) {
        title = "Checking your invite…";
        body = <p className="gv-text">This takes a moment.</p>;
    } else {
        const company = preview.organization_name;
        const role = ROLE_LABELS[preview.org_role] || preview.org_role;
        const invitedEmail = preview.invited_email;
        const alreadyMember =
            acceptState.status === "already-member" ||
            (organizations.data || []).some((row) => row.slug === preview.organization_slug);

        if (!user) {
            title = `${company} invited you as ${role}`;
            body = (
                <>
                    <p className="gv-text">
                        The invite is for <strong>{invitedEmail}</strong>. Sign in with that address, or create an account
                        with it, and you'll come straight back here.
                    </p>
                    <div className="gv-actions-row">
                        <button type="button" className="gv-button" onClick={() => goSignIn("/login")}>Sign in</button>
                        <button type="button" className="gv-button gv-button--ghost" onClick={() => goSignIn("/register")}>Create account</button>
                    </div>
                </>
            );
        } else if (user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
            title = "This invite is for someone else";
            body = (
                <>
                    <p className="gv-text">
                        You're signed in as <strong>{user.email}</strong>. This invite is for <strong>{invitedEmail}</strong>.
                    </p>
                    <button type="button" className="gv-button" onClick={onSwitchAccount}>Switch account</button>
                </>
            );
        } else if (alreadyMember) {
            title = `You're already in ${company}`;
            body = (
                <Link className="gv-button" to={`/console/${preview.organization_slug}/overview`} onClick={clearPendingInvite}>
                    Go to {company}
                </Link>
            );
        } else if (user.email_verified === false || acceptState.status === "unverified") {
            title = "Confirm your email first";
            body = (
                <>
                    <p className="gv-text">
                        Joining needs a confirmed email address. We sent a link to <strong>{user.email}</strong>; open it
                        (it can be in another tab), then come back here.
                    </p>
                    <div className="gv-actions-row">
                        <button type="button" className="gv-button" onClick={onConfirmedEmail}>I've confirmed my email, continue</button>
                        <ResendVerificationButton className="gv-button gv-button--ghost" />
                    </div>
                </>
            );
        } else {
            title = `Join ${company}`;
            body = (
                <>
                    <dl className="gv-facts">
                        <div><dt>Company</dt><dd>{company}</dd></div>
                        <div><dt>Your role</dt><dd>{role}: {ROLE_DESCRIPTIONS[preview.org_role]}</dd></div>
                        <div><dt>Invited by</dt><dd>{preview.invited_by_name || "a deleted account"}</dd></div>
                        <div><dt>Expires</dt><dd>{formatDateTime(preview.expires_at)}</dd></div>
                    </dl>
                    {acceptState.status === "error" ? <p className="gc-form-error" role="alert">{acceptState.message}</p> : null}
                    <div className="gv-actions-row">
                        <button type="button" className="gv-button" onClick={onJoin} disabled={acceptState.status === "joining"}>
                            {acceptState.status === "joining" ? "Joining…" : `Join ${company}`}
                        </button>
                        <button type="button" className="gv-button gv-button--ghost" onClick={() => { clearPendingInvite(); navigate("/console"); }}>
                            Not now
                        </button>
                    </div>
                </>
            );
        }
    }

    return (
        <main className="gv-page">
            <section className="gv-card">
                <p className="gv-brand"><span aria-hidden="true">◆</span> Gait</p>
                <p className="gv-visually-hidden" role="status" aria-live="polite">{title}</p>
                <h1 className="gv-title">{title}</h1>
                {body}
            </section>
        </main>
    );
}

export default AcceptInvitePage;
