import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { retryAfterSeconds, useRetryAfter } from "../../account/useRetryAfter";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, expiresIn } from "../pages/members/memberRules";
import { apiErrorMessage } from "../utils/apiErrors";
import { formatDateTime } from "../utils/formatDate";
import { useJoinInvite } from "./useMyInvites";
import "./PendingInvites.css";

const CANT_BE_USED = "This invite can't be used anymore. Ask whoever invited you for a new one.";

function article(role) {
    return role === "OWNER" || role === "ADMIN" ? "an" : "a";
}

/** Gait's refusal of a join, in plain words. */
function joinProblem(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    if (status === 429) return { kind: "rate-limited" };
    if (code === "EMAIL_NOT_VERIFIED") return { kind: "message", text: "Confirm your email first, then try again." };
    if (code === "ALREADY_MEMBER") return { kind: "already-member" };
    if (code === "INVITE_INVALID" || status === 404) return { kind: "message", text: CANT_BE_USED };
    return { kind: "message", text: apiErrorMessage(error) };
}

function InviteRow({ invite, isOpen, onOpen, onClose, join, onJoined }) {
    const [problem, setProblem] = useState(null);
    const retry = useRetryAfter();
    const confirmHeading = useRef(null);
    const workspace = invite.organization_name;
    const role = ROLE_LABELS[invite.org_role] || invite.org_role;
    const joining = join.isPending && join.variables === invite.id;

    useEffect(() => {
        if (isOpen) confirmHeading.current?.focus();
    }, [isOpen]);

    const onJoin = async () => {
        setProblem(null);
        try {
            const joined = await join.mutateAsync(invite.id);
            onJoined(joined);
        } catch (error) {
            const next = joinProblem(error);
            if (next.kind === "rate-limited") retry.start(retryAfterSeconds(error, 60));
            setProblem(next);
        }
    };

    return (
        <li className="pi-item">
            <div className="pi-row">
                <p className="pi-text">
                    <strong>{workspace}</strong> invited you to its workspace as <strong>{role}</strong>
                    <span className="pi-meta">
                        {invite.invited_by_email ? `From ${invite.invited_by_email} · ` : ""}expires {expiresIn(invite.expires_at)}
                    </span>
                </p>
                {isOpen ? null : (
                    <button type="button" className="pi-button" onClick={onOpen} aria-label={`Join ${workspace}`}>
                        Join
                    </button>
                )}
            </div>

            {isOpen ? (
                <div className="pi-confirm" role="group" aria-labelledby={`pi-confirm-${invite.id}`}>
                    <p className="pi-confirm-title" id={`pi-confirm-${invite.id}`} tabIndex={-1} ref={confirmHeading}>
                        Join {workspace}?
                    </p>
                    <dl className="pi-facts">
                        <div><dt>Workspace</dt><dd>{workspace}</dd></div>
                        <div><dt>Your role</dt><dd>{role}: {ROLE_DESCRIPTIONS[invite.org_role]}</dd></div>
                        <div><dt>Invited by</dt><dd>{invite.invited_by_email || "a deleted account"}</dd></div>
                        <div><dt>Expires</dt><dd>{formatDateTime(invite.expires_at)}</dd></div>
                    </dl>
                    {problem?.kind === "message" ? <p className="pi-error" role="alert">{problem.text}</p> : null}
                    {problem?.kind === "already-member" ? (
                        <p className="pi-error" role="alert">
                            You're already in {workspace}. <Link to={`/console/${invite.organization_slug}/overview`}>Go to {workspace}</Link>
                        </p>
                    ) : null}
                    {problem?.kind === "rate-limited" ? (
                        <p className="pi-error" role="alert">Too many attempts. Please wait a little, then try again.</p>
                    ) : null}
                    <div className="pi-actions">
                        <button
                            type="button"
                            className="pi-button"
                            onClick={onJoin}
                            disabled={joining || retry.waiting}
                        >
                            {joining
                                ? "Joining…"
                                : retry.waiting
                                    ? `Try again in ${retry.remaining}s`
                                    : `Join ${workspace} as ${article(invite.org_role)} ${role}`}
                        </button>
                        <button type="button" className="pi-button pi-button--ghost" onClick={onClose} disabled={joining}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : null}
        </li>
    );
}

/**
 * INV1: the signed-in account's pending invites, each with Join and the
 * usual confirm step (workspace, role and what it can do, who invited you,
 * expiry). Joining lands in the workspace with the one-time welcome note.
 * No invite token is involved: Gait matches the account's confirmed email.
 */
export function PendingInvites({ invites, label = "Pending invites" }) {
    const navigate = useNavigate();
    const join = useJoinInvite();
    const [openId, setOpenId] = useState(null);

    if (!invites.length) return null;

    const onJoined = (joined) => {
        navigate(`/console/${joined.organization_slug}/overview`, {
            state: { welcome: { company: joined.organization_name, role: joined.org_role } },
        });
    };

    return (
        <ul className="pi-list" aria-label={label}>
            {invites.map((invite) => (
                <InviteRow
                    key={invite.id}
                    invite={invite}
                    isOpen={openId === invite.id}
                    onOpen={() => {
                        join.reset();
                        setOpenId(invite.id);
                    }}
                    onClose={() => setOpenId(null)}
                    join={join}
                    onJoined={onJoined}
                />
            ))}
        </ul>
    );
}

export default PendingInvites;
