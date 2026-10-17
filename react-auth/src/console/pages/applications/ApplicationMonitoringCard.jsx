import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, LoadingState } from "../../components/ui/primitives";
import { fetchApplicationMonitoring } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";
import { formatDateTime } from "../../utils/formatDate";

const RESULT_LABELS = { PASS: "Passed", FAIL: "Failed", WARNING: "Warning", INFORMATIONAL: "Informational", UNKNOWN: "Unknown" };
const FINDING_LABELS = { OPEN: "Open", ACKNOWLEDGED: "Acknowledged", RESOLVED: "Resolved", ACCEPTED_RISK: "Accepted risk", FALSE_POSITIVE: "False positive", UNKNOWN: "Status unavailable" };
const SEVERITY_LABELS = { CRITICAL: "Critical", HIGH: "High", WARNING: "Warning", INFO: "Info", UNKNOWN: "Severity unavailable" };
const CASE_LABELS = { TRIAGED: "Triaged", INVESTIGATING: "Investigation recorded", INVESTIGATION_BLOCKED: "Investigation blocked", DETECTED: "Detected", DIAGNOSED: "Diagnosed", REPAIR_PROPOSED: "Repair proposed", AWAITING_REPAIR_APPROVAL: "Awaiting repair approval", REPAIRING: "Repair state recorded", VALIDATING: "Validation state recorded", AWAITING_DEPLOY_APPROVAL: "Awaiting deployment approval", DEPLOY_AUTHORIZED: "Deployment authorized", DEPLOYING: "Deployment state recorded", DEPLOYED: "Deployed", DEPLOYMENT_FAILED: "Deployment failed", RESOLVED: "Resolved", REJECTED: "Rejected", FAILED: "Failed", CANCELLED: "Cancelled", UNKNOWN: "Status unavailable" };
const label = (labels, key, fallback) => Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : fallback;
const date = (value) => value === null || (typeof value === "string" && Number.isFinite(Date.parse(value)));
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const text = (value) => typeof value === "string" && value.length > 0 && value.length <= 200;
const counts = (value, keys) => value && keys.every((key) => count(value[key]));

/** Reject wrong-scope and unsupported responses before any monitoring facts render. */
export function validMonitoring(data, application) {
    return data?.schema_version === 1 && data.scope?.application_id === String(application.id)
        && data.scope?.environment === application.environment && ["ACTIVE", "SUSPENDED", "REVOKED"].includes(data.application_status)
        && ["not_observed", "report_received"].includes(data.reporting?.state) && data.reporting.live_connection === "unknown"
        && date(data.reporting.first_seen_at) && date(data.reporting.last_seen_at)
        && count(data.checks?.reported_checks) && count(data.checks.total_checks) && date(data.checks.last_run_at)
        && counts(data.checks.counts_by_result, Object.keys(RESULT_LABELS)) && count(data.checks.stale_count) && count(data.checks.unknown_freshness_count)
        && count(data.findings?.total) && counts(data.findings.counts_by_status, Object.keys(FINDING_LABELS))
        && counts(data.findings.counts_by_severity, Object.keys(SEVERITY_LABELS)) && typeof data.findings.truncated === "boolean"
        && Array.isArray(data.findings.items) && data.findings.items.length <= 20 && data.findings.items.every((finding) =>
            finding && typeof finding === "object" && text(finding.id) && text(finding.control_key) && typeof finding.status === "string" && typeof finding.severity === "string"
            && (finding.case === null || (finding.case && text(finding.case.id) && typeof finding.case.status === "string" && date(finding.case.updated_at))))
        && data.automation?.state === "not_enabled_for_tenant" && data.automation.reason === "tenant_policy_not_enabled";
}

export function ApplicationMonitoringCard({ organizationSlug, application }) {
    const query = useQuery({
        queryKey: consoleKeys.applicationMonitoring(organizationSlug, application.id, application.environment),
        queryFn: async () => {
            const data = await fetchApplicationMonitoring(organizationSlug, application.id, application.environment);
            if (!validMonitoring(data, application)) throw new Error("Monitoring summary unavailable");
            return data;
        },
        retry: false, staleTime: 0, gcTime: 0, refetchOnWindowFocus: false,
        enabled: Boolean(organizationSlug && application.id && application.environment),
    });
    const data = query.data;
    let body;
    if (query.isLoading) body = <LoadingState label="Loading application monitoring…" />;
    else if (query.isError || !data || !validMonitoring(data, application)) body = <div role="status"><p>Application monitoring is unavailable. No reporting, check or investigation status is confirmed.</p><button type="button" className="gc-button" onClick={() => query.refetch()}>Retry application monitoring</button></div>;
    else body = <div className="gc-monitoring-summary">
        <p><strong>{data.reporting.state === "report_received" ? "Report received" : "Waiting for the first report"}</strong></p>
        <p className="gc-muted">{data.reporting.state === "report_received" ? "Gait has accepted a security report from this application." : "A connection key or identity check does not count as a security report."} Live connection health is unknown.</p>
        {data.reporting.state === "not_observed" ? <p><Link to="/docs/connecting-your-software">Connect security reporting</Link> or check your existing reporting job. An absent report does not tell us whether reporting is configured or the application is offline.</p> : null}
        <dl className="gc-meta"><div><dt>Application status</dt><dd>{({ ACTIVE: "Active", SUSPENDED: "Suspended", REVOKED: "Retired" })[data.application_status]}</dd></div><div><dt>Last report</dt><dd>{data.reporting.last_seen_at ? formatDateTime(data.reporting.last_seen_at) : "Not observed"}</dd></div><div><dt>Checks reported</dt><dd>{data.checks.reported_checks} / {data.checks.total_checks}</dd></div></dl>
        <p><strong>Open findings: {data.findings.counts_by_status.OPEN}</strong> · Total findings: {data.findings.total}</p>
        <details className="gc-monitoring-details"><summary>View monitoring details</summary>
            <dl className="gc-meta"><div><dt>First report</dt><dd>{data.reporting.first_seen_at ? formatDateTime(data.reporting.first_seen_at) : "Not observed"}</dd></div><div><dt>Last check run</dt><dd>{data.checks.last_run_at ? formatDateTime(data.checks.last_run_at) : "Not observed"}</dd></div></dl>
            <p>{Object.entries(RESULT_LABELS).map(([key, value]) => `${value}: ${data.checks.counts_by_result[key]}`).join(" · ")}</p>
            <p className="gc-muted">Stale checks: {data.checks.stale_count} · Freshness unknown: {data.checks.unknown_freshness_count}</p>
            <p>{Object.entries(FINDING_LABELS).map(([key, value]) => `${value}: ${data.findings.counts_by_status[key]}`).join(" · ")}</p>
            <p>{Object.entries(SEVERITY_LABELS).map(([key, value]) => `${value}: ${data.findings.counts_by_severity[key]}`).join(" · ")}</p>
        </details>
        {data.findings.items.length ? <ul className="gc-monitoring-findings">{data.findings.items.map((finding) => <li key={finding.id}>
            <Link to={`/console/${encodeURIComponent(organizationSlug)}/security/findings/${encodeURIComponent(finding.id)}?env=${encodeURIComponent(application.environment)}`}>{finding.control_key}</Link>
            <span> · {label(FINDING_LABELS, finding.status, "Status unavailable")} · {label(SEVERITY_LABELS, finding.severity, "Severity unavailable")}</span>
            <p>{finding.case ? `Case: ${label(CASE_LABELS, finding.case.status, "Status unavailable")}${finding.case.updated_at ? ` · Updated ${formatDateTime(finding.case.updated_at)}` : ""}` : "No investigation case recorded"}</p>
        </li>)}</ul> : <p>No findings reported in this summary.</p>}
        {data.findings.truncated ? <p>Showing the first {data.findings.items.length} findings. <Link to={`/console/${encodeURIComponent(organizationSlug)}/security?env=${encodeURIComponent(application.environment)}`}>View workspace findings</Link></p> : null}
        {data.findings.items.some((finding) => finding.case) ? <p className="gc-muted">Case status records investigation progress; it does not confirm an agent is currently running.</p> : null}
        <aside className="gc-monitoring-automation" aria-label="Automatic investigation"><p><strong>Automatic investigation is not enabled for this workspace.</strong> Existing case records do not start new investigations automatically.</p></aside>
    </div>;
    return <Card title="Application monitoring" subtitle={`${application.name} · ${application.environment}`}>{body}</Card>;
}
