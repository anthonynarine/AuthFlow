import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Card, DataTable, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { issueCredential } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";
import { ENVIRONMENT_LABELS } from "../../hooks/useConsoleScope";
import { formatDateTime } from "../../utils/formatDate";
import { IssueKeyDialog, RenameDialog, RetireDialog, RevokeKeyDialog, StatusDialog } from "./ApplicationDialogs";
import { APPLICATION_STATUS_LABELS, CREDENTIAL_STATUS_LABELS } from "./applicationStatus";
import {
    useApplication,
    useApplicationActivity,
    useChangeApplicationStatus,
    useCredentials,
    useRenameApplication,
    useRevokeCredential,
} from "./useApplications";
import "./Applications.css";

function ActivityCard({ activity }) {
    let body;
    if (activity.isLoading) body = <LoadingState label="Checking activity…" />;
    else if (activity.isError) body = <ErrorState error={activity.error} onRetry={activity.refetch} />;
    else if (!activity.data.has_activity) {
        body = (
            <p className="gc-card-text">
                No reports yet. Once this application sends a security check with one of its keys, it shows up here.{" "}
                <a href="/docs/connecting-your-software">How to connect it</a>
            </p>
        );
    } else {
        body = (
            <dl className="gc-meta">
                <div><dt>Last report</dt><dd>{formatDateTime(activity.data.last_seen_at)}</dd></div>
                <div><dt>First report</dt><dd>{formatDateTime(activity.data.first_seen_at)}</dd></div>
            </dl>
        );
    }
    return <Card title="Activity">{body}</Card>;
}

function KeysCard({ application, credentials, canManage, onIssue, onRevoke }) {
    if (!canManage) {
        return (
            <Card title="Connection keys">
                <p className="gc-card-text gc-muted">Only Owners and Admins can see and manage connection keys.</p>
            </Card>
        );
    }
    const isActive = application.status === "ACTIVE";
    const issueButton = (
        <button type="button" className="gc-button gc-button--primary" onClick={onIssue} disabled={!isActive}>
            Issue key
        </button>
    );
    let body;
    if (credentials.isLoading) body = <LoadingState label="Loading keys…" />;
    else if (credentials.isError) body = <ErrorState error={credentials.error} onRetry={credentials.refetch} />;
    else {
        body = (
            <DataTable
                caption="Connection keys"
                rows={credentials.data}
                rowKey={(credential) => credential.credential_id}
                emptyTitle="No keys yet. Issue one and put it in your application's backend settings."
                columns={[
                    { key: "label", header: "Label", render: (c) => c.label || <span className="gc-muted">Unlabelled</span> },
                    { key: "status", header: "Status", render: (c) => <Badge value={c.status} label={CREDENTIAL_STATUS_LABELS[c.status]} /> },
                    {
                        key: "created",
                        header: "Created",
                        render: (c) => (
                            <span>
                                {formatDateTime(c.created_at)}
                                {c.created_by_email ? <span className="gc-cell-sub">by {c.created_by_email}</span> : null}
                            </span>
                        ),
                    },
                    { key: "last_used", header: "Last used", render: (c) => (c.last_used_at ? formatDateTime(c.last_used_at) : <span className="gc-muted">Never</span>) },
                    {
                        key: "actions",
                        header: <span className="gc-visually-hidden">Actions</span>,
                        align: "right",
                        render: (c) =>
                            c.status === "ACTIVE" ? (
                                <button
                                    type="button"
                                    className="gc-button gc-button--danger gc-button--small"
                                    onClick={() => onRevoke(c)}
                                    aria-label={`Revoke ${c.label || "unlabelled key"}`}
                                >
                                    Revoke
                                </button>
                            ) : (
                                <span className="gc-muted gc-cell-sub">Revoked {formatDateTime(c.revoked_at)}</span>
                            ),
                    },
                ]}
            />
        );
    }
    return (
        <Card
            title="Connection keys"
            subtitle={isActive ? "Shown once when issued; Gait keeps only a fingerprint." : "Keys can only be issued for an active application."}
            actions={issueButton}
        >
            {body}
        </Card>
    );
}

/** F2: one application: its activity, lifecycle actions and connection keys. */
export function ApplicationDetailPage() {
    const scope = useOutletContext();
    const { orgSlug, canManage, isOwner } = scope;
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState(null);

    const application = useApplication(orgSlug, applicationId);
    const activity = useApplicationActivity(orgSlug, applicationId);
    const credentials = useCredentials(orgSlug, applicationId, { enabled: canManage });
    const rename = useRenameApplication(orgSlug, applicationId);
    const status = useChangeApplicationStatus(orgSlug, applicationId);
    const revoke = useRevokeCredential(orgSlug, applicationId);

    // The page belongs to the application's own environment. Arriving without
    // it selected selects it; switching environment afterwards goes back to
    // that environment's list.
    const synced = useRef(false);
    const appEnvironment = application.data?.environment;
    useEffect(() => {
        if (!appEnvironment) return;
        if (!synced.current) {
            synced.current = true;
            if (scope.environment !== appEnvironment) scope.setEnvironment(appEnvironment);
            return;
        }
        if (scope.environment !== appEnvironment) {
            navigate(`/console/${orgSlug}/applications?env=${scope.environment}`, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appEnvironment, scope.environment]);

    const back = (
        <Link className="gc-back-link gc-focusable" to={`/console/${orgSlug}/applications?env=${scope.environment}`}>
            ← Applications
        </Link>
    );

    if (application.isLoading) return <>{back}<LoadingState label="Loading application…" /></>;
    if (application.isError) return <>{back}<ErrorState error={application.error} onRetry={application.refetch} /></>;

    const app = application.data;
    const retired = app.status === "REVOKED";
    const closeDialog = () => {
        setDialog(null);
        rename.reset();
        status.reset();
        revoke.reset();
    };

    const actions = canManage && !retired ? (
        <>
            <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog({ type: "rename" })}>Rename</button>
            {app.status === "ACTIVE" ? (
                <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog({ type: "suspend" })}>Suspend</button>
            ) : null}
            {app.status === "SUSPENDED" ? (
                <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog({ type: "reactivate" })}>Reactivate</button>
            ) : null}
            {isOwner ? (
                <button type="button" className="gc-button gc-button--danger" onClick={() => setDialog({ type: "retire" })}>Retire</button>
            ) : null}
        </>
    ) : null;

    return (
        <>
            {back}
            <PageHeader
                title={app.name}
                description={
                    <span className="gc-badge-row">
                        <Badge value={app.status} label={APPLICATION_STATUS_LABELS[app.status]} />
                        <span>{ENVIRONMENT_LABELS[app.environment]}</span>
                        <code className="gc-code">{app.slug}</code>
                    </span>
                }
                actions={actions}
            />
            {app.status === "SUSPENDED" ? (
                <p className="gc-warning gc-page-note">Suspended: none of this application's keys work until it's reactivated.</p>
            ) : null}
            {retired ? (
                <p className="gc-warning gc-page-note">Retired: this application no longer works and all of its keys are revoked. This is permanent.</p>
            ) : null}

            <div className="gc-app-grid">
                <ActivityCard activity={activity} />
                <Card title="Details">
                    <dl className="gc-meta">
                        <div><dt>Created</dt><dd>{formatDateTime(app.created_at)}</dd></div>
                        <div><dt>Last changed</dt><dd>{formatDateTime(app.updated_at)}</dd></div>
                    </dl>
                </Card>
                <div className="gc-app-wide">
                    <KeysCard
                        application={app}
                        credentials={credentials}
                        canManage={canManage}
                        onIssue={() => setDialog({ type: "issue" })}
                        onRevoke={(credential) => setDialog({ type: "revoke", credential })}
                    />
                </div>
            </div>

            {dialog?.type === "rename" ? <RenameDialog application={app} mutation={rename} onClose={closeDialog} /> : null}
            {dialog?.type === "suspend" || dialog?.type === "reactivate" ? (
                <StatusDialog action={dialog.type} application={app} mutation={status} onClose={closeDialog} />
            ) : null}
            {dialog?.type === "retire" ? <RetireDialog application={app} mutation={status} onClose={closeDialog} /> : null}
            {dialog?.type === "issue" ? (
                <IssueKeyDialog
                    application={app}
                    issue={(label) => issueCredential(orgSlug, applicationId, label)}
                    onIssued={() => queryClient.invalidateQueries({ queryKey: consoleKeys.credentials(orgSlug, applicationId) })}
                    onClose={closeDialog}
                />
            ) : null}
            {dialog?.type === "revoke" ? (
                <RevokeKeyDialog credential={dialog.credential} mutation={revoke} onClose={closeDialog} />
            ) : null}
        </>
    );
}

export default ApplicationDetailPage;
