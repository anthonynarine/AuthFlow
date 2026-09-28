import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Badge, DataTable, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { ENVIRONMENT_LABELS } from "../../hooks/useConsoleScope";
import { formatDateTime } from "../../utils/formatDate";
import { rememberLastOrganization } from "../ConsoleEntry";
import { CreateApplicationDialog } from "./CreateApplicationDialog";
import { APPLICATION_STATUS_LABELS } from "./applicationStatus";
import { useActivities, useApplications } from "./useApplications";
import "./Applications.css";

export function applicationPath(organizationSlug, application) {
    return `/console/${organizationSlug}/applications/${application.id}?env=${application.environment}`;
}

function LastActivity({ activity }) {
    if (!activity || activity.isLoading) return <span className="gc-muted">…</span>;
    if (activity.isError) return <span className="gc-muted">Unavailable</span>;
    return activity.data?.has_activity ? (
        formatDateTime(activity.data.last_seen_at)
    ) : (
        <span className="gc-muted">No reports yet</span>
    );
}

/** F2: the company's applications in the current environment. */
export function ApplicationsPage() {
    const scope = useOutletContext();
    const { orgSlug, environment, canManage } = scope;
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const applications = useApplications(orgSlug);

    useEffect(() => {
        rememberLastOrganization(orgSlug);
    }, [orgSlug]);

    const all = applications.data || [];
    const inEnvironment = all.filter((application) => application.environment === environment);
    const elsewhere = all.length - inEnvironment.length;
    const activities = useActivities(
        orgSlug,
        inEnvironment.map((application) => application.id)
    );

    const addButton = canManage ? (
        <button type="button" className="gc-button gc-button--primary" onClick={() => setCreating(true)}>
            Add application
        </button>
    ) : null;

    const header = (
        <PageHeader
            title="Applications"
            description={`The software that reports to Gait from ${ENVIRONMENT_LABELS[environment]}. Each application has its own connection keys.`}
            actions={addButton}
        />
    );

    let body;
    if (applications.isLoading) {
        body = <LoadingState label="Loading applications…" />;
    } else if (applications.isError) {
        body = <ErrorState error={applications.error} onRetry={applications.refetch} />;
    } else if (inEnvironment.length === 0) {
        body = (
            <EmptyState
                title={`No applications in ${ENVIRONMENT_LABELS[environment]} yet`}
                action={addButton}
            >
                {canManage
                    ? "Add one for each piece of software that runs here, then give it a connection key."
                    : "Ask an Owner or Admin of this workspace to add one."}
            </EmptyState>
        );
    } else {
        body = (
            <DataTable
                caption={`Applications in ${ENVIRONMENT_LABELS[environment]}`}
                rows={inEnvironment}
                rowKey={(application) => application.id}
                columns={[
                    {
                        key: "name",
                        header: "Name",
                        render: (application) => (
                            <Link className="gc-table-link gc-focusable" to={applicationPath(orgSlug, application)}>
                                {application.name}
                            </Link>
                        ),
                    },
                    { key: "slug", header: "Slug", render: (application) => <code className="gc-code">{application.slug}</code> },
                    {
                        key: "status",
                        header: "Status",
                        render: (application) => (
                            <Badge value={application.status} label={APPLICATION_STATUS_LABELS[application.status]} />
                        ),
                    },
                    {
                        key: "activity",
                        header: "Last report",
                        render: (application) => <LastActivity activity={activities[application.id]} />,
                    },
                ]}
            />
        );
    }

    return (
        <>
            {header}
            {body}
            {!applications.isLoading && !applications.isError && elsewhere > 0 ? (
                <p className="gc-muted gc-section-note">
                    {elsewhere === 1 ? "1 more application is" : `${elsewhere} more applications are`} in other
                    environments. Switch environment at the top to see {elsewhere === 1 ? "it" : "them"}.
                </p>
            ) : null}
            {creating ? (
                <CreateApplicationDialog
                    organizationSlug={orgSlug}
                    defaultEnvironment={environment}
                    onClose={() => setCreating(false)}
                    onCreated={(application) => {
                        setCreating(false);
                        navigate(applicationPath(orgSlug, application));
                    }}
                />
            ) : null}
        </>
    );
}

export default ApplicationsPage;
