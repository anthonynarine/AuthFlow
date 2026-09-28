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
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, StatusLine } from "../../ds/components";

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
    let lede = null;
    let body = null;
    let eyebrow = "Invitation";

    if (phase === "missing") {
        title = "Open your invite link again";
        lede = "We couldn't find the invite in this browser tab. Open the link from your invite email again; it still works if it hasn't been used or expired.";
    } else if (phase === "invalid") {
        title = "This invite can't be used";
        lede = CANT_BE_USED;
    } else if (phase === "rate-limited" || acceptState.status === "rate-limited") {
        title = "Too many attempts";
        body = (
            <>
                <Alert kind="warning">Please wait a little, then try again.</Alert>
                <Button
                    disabled={retry.waiting}
                    onClick={() => (phase === "rate-limited" ? runPreview(invite.token) : onJoin())}
                >
                    {retry.waiting ? `Try again in ${retry.remaining}s` : "Try again"}
                </Button>
            </>
        );
    } else if (phase === "loading" || !preview || (!sessionChecked && !user)) {
        title = "Checking your invite…";
        body = <StatusLine>This takes a moment.</StatusLine>;
    } else {
        const company = preview.organization_name;
        const role = ROLE_LABELS[preview.org_role] || preview.org_role;
        const invitedEmail = preview.invited_email;
        const alreadyMember =
            acceptState.status === "already-member" ||
            (organizations.data || []).some((row) => row.slug === preview.organization_slug);

        if (!user) {
            title = `${company} invited you to its workspace as ${role}`;
            lede = (
                <>
                    The invite is for <strong>{invitedEmail}</strong>. Sign in with that address, or create an account
                    with it, and you'll come straight back here.
                </>
            );
            body = (
                <div className="ds-actions">
                    <Button onClick={() => goSignIn("/login")}>Sign in</Button>
                    <Button kind="secondary" onClick={() => goSignIn("/register")}>Create account</Button>
                </div>
            );
        } else if (user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
            title = "This invite is for someone else";
            lede = (
                <>
                    You're signed in as <strong>{user.email}</strong>. This invite is for <strong>{invitedEmail}</strong>.
                </>
            );
            body = <Button onClick={onSwitchAccount}>Switch account</Button>;
        } else if (alreadyMember) {
            title = `You're already in ${company}`;
            body = (
                <Link className="ds-btn ds-btn--primary" to={`/console/${preview.organization_slug}/overview`} onClick={clearPendingInvite}>
                    Go to {company}
                </Link>
            );
        } else if (user.email_verified === false || acceptState.status === "unverified") {
            // Says nothing about a link already being sent: older accounts never got one.
            title = "Confirm your email to join";
            lede = (
                <>
                    Joining needs a confirmed email address for <strong>{user.email}</strong>. Use the confirmation link
                    from your email (any tab works), or send a new one, then come back here.
                </>
            );
            body = (
                <div className="ds-actions">
                    <Button onClick={onConfirmedEmail}>I've confirmed my email, continue</Button>
                    <ResendVerificationButton className="ds-btn ds-btn--secondary" />
                </div>
            );
        } else {
            title = `Join ${company}`;
            lede = <>You're invited as {/^[AEIOU]/.test(role) ? "an" : "a"} <strong>{role}</strong>.</>;
            body = (
                <>
                    <dl className="ds-facts">
                        <div><dt>Workspace</dt><dd>{company}</dd></div>
                        <div><dt>Your role</dt><dd>{role}: {ROLE_DESCRIPTIONS[preview.org_role]}</dd></div>
                        <div><dt>Invited by</dt><dd>{preview.invited_by_name || "a deleted account"}</dd></div>
                        <div><dt>Expires</dt><dd>{formatDateTime(preview.expires_at)}</dd></div>
                    </dl>
                    {acceptState.status === "error" ? <Alert kind="danger">{acceptState.message}</Alert> : null}
                    <div className="ds-actions">
                        <Button onClick={onJoin} disabled={acceptState.status === "joining"}>
                            {acceptState.status === "joining" ? "Joining…" : `Join ${company}`}
                        </Button>
                        <Button kind="secondary" onClick={() => { clearPendingInvite(); navigate("/console"); }}>
                            Not now
                        </Button>
                    </div>
                </>
            );
        }
    }

    return (
        <AuthLayout>
            <p className="ds-visually-hidden" role="status" aria-live="polite">{title}</p>
            <AuthHeading eyebrow={eyebrow} title={title} lede={lede} />
            {body}
        </AuthLayout>
    );
}

export default AcceptInvitePage;
