import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Card, DataTable, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { consoleKeys } from "../../api/queryKeys";
import { formatDateTime } from "../../utils/formatDate";
import { rememberLastOrganization } from "../ConsoleEntry";
import { activitySentence } from "./activitySentence";
import {
    ChangeRoleDialog,
    InviteActionDialog,
    InviteDialog,
    LeaveDialog,
    RemoveMemberDialog,
} from "./MemberDialogs";
import {
    ROLE_LABELS,
    canChangeRole,
    canManageInvites,
    canRemove,
    canRevokeInvite,
    expiresIn,
    memberName,
    wouldRemoveLastOwner,
} from "./memberRules";
import {
    ACTIVITY_PAGE_SIZE,
    useChangeRole,
    useCreateInvite,
    useMemberActivity,
    useMembers,
    useRemoveMember,
    useResendInvite,
    useRevokeInvite,
} from "./useMembers";
import "./Members.css";

function Activity({ orgSlug }) {
    const [page, setPage] = useState(1);
    const activity = useMemberActivity(orgSlug, page, { enabled: true });
    let body;
    if (activity.isLoading) body = <LoadingState label="Loading activity…" />;
    else if (activity.isError) body = <ErrorState error={activity.error} onRetry={activity.refetch} />;
    else if (activity.data.count === 0) body = <p className="gc-card-text gc-muted">No membership changes yet.</p>;
    else {
        const pages = Math.max(1, Math.ceil(activity.data.count / activity.data.page_size));
        body = (
            <>
                <ol className="gc-activity" aria-label="Membership activity">
                    {activity.data.results.map((row) => (
                        <li key={row.id}>
                            <span className="gc-activity-text">{activitySentence(row)}</span>
                            <span className="gc-muted gc-activity-when">{formatDateTime(row.created_at)}</span>
                        </li>
                    ))}
                </ol>
                {pages > 1 ? (
                    <nav className="gc-pager" aria-label="Activity pages">
                        <span className="gc-muted">Page {activity.data.page} of {pages}</span>
                        <span className="gc-badge-row">
                            <button type="button" className="gc-button gc-button--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</button>
                            <button type="button" className="gc-button gc-button--ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Older</button>
                        </span>
                    </nav>
                ) : null}
            </>
        );
    }
    return (
        <Card title="Activity" subtitle={`Every membership change, newest first (${ACTIVITY_PAGE_SIZE} a page).`}>
            {body}
        </Card>
    );
}

/** F4: who's in the company, pending invites and membership activity. */
export function MembersPage() {
    const scope = useOutletContext();
    const { orgSlug } = scope;
    const companyName = scope.membership.name;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState(null);
    const members = useMembers(orgSlug);
    const changeRole = useChangeRole(orgSlug);
    const remove = useRemoveMember(orgSlug);
    const createInvite = useCreateInvite(orgSlug);
    const revoke = useRevokeInvite(orgSlug);
    const resend = useResendInvite(orgSlug);

    useEffect(() => {
        rememberLastOrganization(orgSlug);
    }, [orgSlug]);

    // Gait's answer for this request, not a cached role, decides what's offered.
    const actorRole = members.data?.your_role;
    const manager = canManageInvites(actorRole);
    const list = members.data?.members || [];
    const you = list.find((member) => member.is_you);

    const closeDialog = () => {
        setDialog(null);
        [changeRole, remove, createInvite, revoke, resend].forEach((mutation) => mutation.reset());
    };

    const onLeft = () => {
        // Their membership is gone: drop this company's cache and go to the console entry.
        queryClient.invalidateQueries({ queryKey: consoleKeys.myOrganizations() });
        navigate("/console", { replace: true });
    };

    const header = (
        <PageHeader
            title="Members"
            description={`Who can see and manage ${companyName}. Roles apply to this company only.`}
            actions={
                <>
                    {manager ? (
                        <button type="button" className="gc-button gc-button--primary" onClick={() => setDialog({ type: "invite" })}>
                            Invite someone
                        </button>
                    ) : null}
                    {you ? (
                        <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog({ type: "leave" })}>
                            Leave company
                        </button>
                    ) : null}
                </>
            }
        />
    );

    if (members.isLoading) return <>{header}<LoadingState label="Loading members…" /></>;
    if (members.isError) return <>{header}<ErrorState error={members.error} onRetry={members.refetch} /></>;

    const invites = members.data.invites || [];

    return (
        <>
            {header}
            <section aria-labelledby="gc-members-title" className="gc-section">
                <h2 id="gc-members-title" className="gc-section-title">
                    {list.length === 1 ? "1 member" : `${list.length} members`}
                </h2>
                <DataTable
                    caption={`Members of ${companyName}`}
                    rows={list}
                    rowKey={(member) => member.membership_id}
                    columns={[
                        {
                            key: "name",
                            header: "Name",
                            render: (member) => (
                                <span className="gc-member-name">
                                    {memberName(member)}
                                    {member.is_you ? <Badge value="YOU" label="You" tone="accent" /> : null}
                                </span>
                            ),
                        },
                        { key: "email", header: "Email", render: (member) => member.email },
                        { key: "role", header: "Role", render: (member) => <Badge value={member.org_role} label={ROLE_LABELS[member.org_role]} /> },
                        { key: "joined", header: "Joined", render: (member) => formatDateTime(member.joined_at) },
                        {
                            key: "actions",
                            header: <span className="gc-visually-hidden">Actions</span>,
                            align: "right",
                            render: (member) => (
                                <span className="gc-row-actions">
                                    {canChangeRole(actorRole, member) ? (
                                        <button
                                            type="button"
                                            className="gc-button gc-button--ghost gc-button--small"
                                            aria-label={`Change role for ${memberName(member)}`}
                                            onClick={() => setDialog({ type: "role", member })}
                                        >
                                            Change role
                                        </button>
                                    ) : null}
                                    {canRemove(actorRole, member) ? (
                                        <button
                                            type="button"
                                            className="gc-button gc-button--danger gc-button--small"
                                            aria-label={`Remove ${memberName(member)}`}
                                            onClick={() => setDialog({ type: "remove", member })}
                                        >
                                            Remove
                                        </button>
                                    ) : null}
                                </span>
                            ),
                        },
                    ]}
                />
            </section>

            {manager ? (
                <section aria-labelledby="gc-invites-title" className="gc-section">
                    <h2 id="gc-invites-title" className="gc-section-title">Pending invites</h2>
                    {invites.length === 0 ? (
                        <EmptyState title="No pending invites">Invite a teammate by email; the link works once and lasts 7 days.</EmptyState>
                    ) : (
                        <DataTable
                            caption="Pending invites"
                            rows={invites}
                            rowKey={(invite) => invite.id}
                            columns={[
                                { key: "email", header: "Email", render: (invite) => invite.email },
                                { key: "role", header: "Role", render: (invite) => <Badge value={invite.org_role} label={ROLE_LABELS[invite.org_role]} /> },
                                { key: "by", header: "Invited by", render: (invite) => invite.invited_by_email || <span className="gc-muted">a deleted account</span> },
                                { key: "expires", header: "Expires", render: (invite) => expiresIn(invite.expires_at) },
                                {
                                    key: "actions",
                                    header: <span className="gc-visually-hidden">Actions</span>,
                                    align: "right",
                                    render: (invite) =>
                                        canRevokeInvite(actorRole, invite) ? (
                                            <span className="gc-row-actions">
                                                <button type="button" className="gc-button gc-button--ghost gc-button--small" aria-label={`Resend invite to ${invite.email}`} onClick={() => setDialog({ type: "resend", invite })}>
                                                    Resend
                                                </button>
                                                <button type="button" className="gc-button gc-button--danger gc-button--small" aria-label={`Revoke invite for ${invite.email}`} onClick={() => setDialog({ type: "revoke", invite })}>
                                                    Revoke
                                                </button>
                                            </span>
                                        ) : (
                                            <span className="gc-muted gc-cell-sub">Owners only</span>
                                        ),
                                },
                            ]}
                        />
                    )}
                </section>
            ) : null}

            {manager ? (
                <section className="gc-section">
                    <Activity orgSlug={orgSlug} />
                </section>
            ) : null}

            {dialog?.type === "invite" ? <InviteDialog actorRole={actorRole} companyName={companyName} mutation={createInvite} onClose={closeDialog} /> : null}
            {dialog?.type === "role" ? (
                <ChangeRoleDialog
                    actorRole={actorRole}
                    member={dialog.member}
                    isLastOwner={wouldRemoveLastOwner(list, dialog.member)}
                    mutation={changeRole}
                    onClose={closeDialog}
                />
            ) : null}
            {dialog?.type === "remove" ? <RemoveMemberDialog member={dialog.member} companyName={companyName} mutation={remove} onClose={closeDialog} /> : null}
            {dialog?.type === "leave" && you ? (
                <LeaveDialog
                    companyName={companyName}
                    isLastOwner={wouldRemoveLastOwner(list, you)}
                    you={you}
                    mutation={remove}
                    onLeft={onLeft}
                    onClose={closeDialog}
                />
            ) : null}
            {dialog?.type === "revoke" || dialog?.type === "resend" ? (
                <InviteActionDialog
                    action={dialog.type}
                    invite={dialog.invite}
                    mutation={dialog.type === "resend" ? resend : revoke}
                    onClose={closeDialog}
                />
            ) : null}
        </>
    );
}

export default MembersPage;
