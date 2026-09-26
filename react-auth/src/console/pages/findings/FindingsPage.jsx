import React, { useEffect } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Badge, DataTable, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { ENVIRONMENT_LABELS } from "../../hooks/useConsoleScope";
import { apiErrorMessage } from "../../utils/apiErrors";
import { formatDateTime } from "../../utils/formatDate";
import { rememberLastOrganization } from "../ConsoleEntry";
import { useApplications } from "../applications/useApplications";
import { FINDING_STATUS_OPTIONS, SEVERITY_OPTIONS, applicationLabel } from "./findingLabels";
import { PAGE_SIZE, useFindings } from "./useFindings";
import "./Findings.css";

export function findingPath(organizationSlug, finding) {
    return `/console/${organizationSlug}/security/findings/${finding.id}?env=${finding.environment}`;
}

function Pager({ page, pageSize, count, onPage }) {
    const pages = Math.max(1, Math.ceil(count / pageSize));
    if (pages <= 1) return null;
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(count, page * pageSize);
    return (
        <nav className="gc-pager" aria-label="Findings pages">
            <span className="gc-muted">{from}–{to} of {count}</span>
            <span className="gc-badge-row">
                <button type="button" className="gc-button gc-button--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    Previous
                </button>
                <button type="button" className="gc-button gc-button--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                    Next
                </button>
            </span>
        </nav>
    );
}

/** F3: the company's findings in the current environment, filterable by status and severity. */
export function FindingsPage() {
    const scope = useOutletContext();
    const { orgSlug, environment } = scope;
    const [searchParams, setSearchParams] = useSearchParams();
    const status = searchParams.get("status") || "";
    const severity = searchParams.get("severity") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const findings = useFindings(orgSlug, environment, { status, severity, page });
    const applications = useApplications(orgSlug);

    useEffect(() => {
        rememberLastOrganization(orgSlug);
    }, [orgSlug]);

    const setParam = (name, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(name, value);
        else next.delete(name);
        if (name !== "page") next.delete("page");
        setSearchParams(next, { replace: true });
    };
    const clearFilters = () => {
        const next = new URLSearchParams(searchParams);
        ["status", "severity", "page"].forEach((name) => next.delete(name));
        setSearchParams(next, { replace: true });
    };
    const filtered = Boolean(status || severity);
    const invalidQuery = findings.error?.response?.status === 400 && findings.error.response.data?.code === "INVALID_QUERY";

    let body;
    if (findings.isLoading) {
        body = <LoadingState label="Loading findings…" />;
    } else if (invalidQuery) {
        body = (
            <EmptyState
                title="That filter isn't valid"
                action={<button type="button" className="gc-button gc-button--ghost" onClick={clearFilters}>Clear filters</button>}
            >
                {apiErrorMessage(findings.error)}
            </EmptyState>
        );
    } else if (findings.isError) {
        body = <ErrorState error={findings.error} onRetry={findings.refetch} />;
    } else if (findings.data.count === 0) {
        body = filtered ? (
            <EmptyState
                title="No findings match these filters"
                action={<button type="button" className="gc-button gc-button--ghost" onClick={clearFilters}>Clear filters</button>}
            />
        ) : (
            <EmptyState title={`No findings in ${ENVIRONMENT_LABELS[environment]}`}>
                When one of your applications reports a failing security check here, Gait opens a finding for it.
            </EmptyState>
        );
    } else {
        body = (
            <>
                <DataTable
                    caption={`Findings in ${ENVIRONMENT_LABELS[environment]}`}
                    rows={findings.data.results}
                    rowKey={(finding) => finding.id}
                    columns={[
                        {
                            key: "title",
                            header: "Finding",
                            render: (finding) => (
                                <Link className="gc-table-link gc-focusable" to={findingPath(orgSlug, finding)}>
                                    {finding.title}
                                </Link>
                            ),
                        },
                        {
                            key: "application",
                            header: "Application",
                            render: (finding) => applicationLabel(finding, applications.data),
                        },
                        { key: "severity", header: "Severity", render: (finding) => <Badge value={finding.severity} label={finding.severity_label} /> },
                        { key: "status", header: "Status", render: (finding) => <Badge value={finding.status} label={finding.status_label} /> },
                        { key: "last_seen", header: "Last seen", render: (finding) => formatDateTime(finding.last_seen_at) },
                    ]}
                />
                <Pager page={findings.data.page} pageSize={findings.data.page_size} count={findings.data.count} onPage={(next) => setParam("page", String(next))} />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Findings"
                description={`Open problems Gait has found in ${ENVIRONMENT_LABELS[environment]}, and what's been decided about them.`}
            />
            <div className="gc-filters" role="group" aria-label="Filter findings">
                <label className="gc-filter">
                    <span className="gc-field-label">Status</span>
                    <select className="gc-input" value={status} onChange={(event) => setParam("status", event.target.value)}>
                        <option value="">All statuses</option>
                        {FINDING_STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
                <label className="gc-filter">
                    <span className="gc-field-label">Severity</span>
                    <select className="gc-input" value={severity} onChange={(event) => setParam("severity", event.target.value)}>
                        <option value="">All severities</option>
                        {SEVERITY_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
                {filtered ? (
                    <button type="button" className="gc-button gc-button--ghost gc-filter-clear" onClick={clearFilters}>
                        Clear filters
                    </button>
                ) : null}
            </div>
            {body}
            {findings.isFetching && !findings.isLoading ? <p className="gc-muted gc-section-note" role="status">Updating…</p> : null}
            <p className="gc-muted gc-section-note">
                The environment filter is at the top of the page. Showing up to {PAGE_SIZE} findings per page, most
                recently seen first.
            </p>
        </>
    );
}

export default FindingsPage;
