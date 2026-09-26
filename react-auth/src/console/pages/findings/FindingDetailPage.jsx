import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { TrustBadge, TrustSummary } from "../../components/TrustBadge";
import { ENVIRONMENT_LABELS } from "../../hooks/useConsoleScope";
import { formatDateTime } from "../../utils/formatDate";
import { useApplications } from "../applications/useApplications";
import { FindingActionDialog } from "./FindingActionDialog";
import { applicationLabel } from "./findingLabels";
import { useFinding, useFindingAction, useFindingEvidence } from "./useFindings";
import "./Findings.css";

const ACTION_LABELS = { ACKNOWLEDGE: "Acknowledged", ACCEPT_RISK: "Accepted the risk" };
const STATUS_WORDS = {
    OPEN: "open",
    ACKNOWLEDGED: "acknowledged",
    ACCEPTED_RISK: "accepted risk",
    RESOLVED: "resolved",
    FALSE_POSITIVE: "false positive",
};

function AcceptedRisk({ finding }) {
    const accepted = [...(finding.actions || [])].reverse().find((row) => row.action === "ACCEPT_RISK");
    return (
        <section className="gc-accepted" aria-labelledby="gc-accepted-title">
            <p id="gc-accepted-title" className="gc-accepted-title">Risk accepted</p>
            <p className="gc-accepted-text">
                {accepted?.actor_email ? <>{accepted.actor_email} accepted this risk on {formatDateTime(accepted.created_at)}. </> : null}
                It stays accepted even if the check fails again; those reports are still recorded below. A passing
                check resolves it once it's fixed.
            </p>
            {accepted?.note || finding.resolution_summary ? (
                <blockquote className="gc-accepted-note">{accepted?.note || finding.resolution_summary}</blockquote>
            ) : null}
        </section>
    );
}

function ActionHistory({ actions }) {
    if (!actions?.length) {
        return <p className="gc-card-text gc-muted">Nobody has acknowledged this finding or accepted its risk yet.</p>;
    }
    return (
        <ol className="gc-history">
            {[...actions].reverse().map((row, index) => (
                <li key={`${row.created_at}-${index}`} className="gc-history-item">
                    <p className="gc-history-head">
                        <strong>{ACTION_LABELS[row.action] || row.action}</strong>
                        <span className="gc-muted"> · {row.actor_email || "someone no longer in Gait"} · {formatDateTime(row.created_at)}</span>
                    </p>
                    <p className="gc-history-note">{row.note}</p>
                    <p className="gc-muted gc-history-meta">
                        {STATUS_WORDS[row.from_status] || row.from_status} → {STATUS_WORDS[row.to_status] || row.to_status}
                    </p>
                </li>
            ))}
        </ol>
    );
}

function Checks({ metadata }) {
    const checks = metadata?.checks;
    if (!checks || typeof checks !== "object") return null;
    return (
        <ul className="gc-checks" aria-label="Checks in this report">
            {Object.entries(checks).map(([name, result]) => (
                <li key={name}>
                    <code className="gc-code">{name}</code>
                    <Badge value={result === "PASS" ? "HEALTHY" : result === "FAIL" ? "CONTROL_FAILURE" : "UNKNOWN"} label={String(result)} />
                </li>
            ))}
        </ul>
    );
}

function EvidenceHistory({ evidenceIds, orgSlug }) {
    const { evidence, isLoading, failed } = useFindingEvidence(orgSlug, evidenceIds);
    if (!evidenceIds?.length) return <p className="gc-card-text gc-muted">No reports are linked to this finding.</p>;
    if (isLoading) return <LoadingState label="Loading reports…" />;
    return (
        <>
            <ol className="gc-history">
                {evidence.map((item) => (
                    <li key={item.id} className="gc-history-item">
                        <p className="gc-history-head">
                            <Badge value={item.result === "PASS" ? "HEALTHY" : item.result === "FAIL" ? "CONTROL_FAILURE" : "UNKNOWN"} label={item.result_label || item.result} />
                            <TrustBadge trust={item.trust} />
                            <span className="gc-muted">{formatDateTime(item.observed_at)}</span>
                        </p>
                        <p className="gc-muted gc-history-meta">
                            From {item.source_name || "your application"}
                            {item.source_reference ? <> · <code className="gc-code">{item.source_reference}</code></> : null}
                        </p>
                        <Checks metadata={item.metadata} />
                    </li>
                ))}
            </ol>
            {failed ? <p className="gc-muted gc-section-note">{failed} report(s) couldn't be loaded.</p> : null}
            {evidenceIds.length >= 20 ? (
                <p className="gc-muted gc-section-note">Showing up to 20 linked reports.</p>
            ) : null}
        </>
    );
}

/** F3: one finding: what it is, its source, decisions made about it, and the reports behind it. */
export function FindingDetailPage() {
    const scope = useOutletContext();
    const { orgSlug, canManage } = scope;
    const { findingId } = useParams();
    const navigate = useNavigate();
    const [dialog, setDialog] = useState(null);
    const finding = useFinding(orgSlug, findingId);
    const applications = useApplications(orgSlug);
    const act = useFindingAction(orgSlug, findingId);
    const trustIds = finding.data?.evidence_ids || [];
    const { evidence } = useFindingEvidence(orgSlug, trustIds);

    // Same environment rule as an application: the page belongs to the
    // finding's environment; switching away goes back to that list.
    const synced = useRef(false);
    const findingEnvironment = finding.data?.environment;
    useEffect(() => {
        if (!findingEnvironment) return;
        if (!synced.current) {
            synced.current = true;
            if (scope.environment !== findingEnvironment) scope.setEnvironment(findingEnvironment);
            return;
        }
        if (scope.environment !== findingEnvironment) {
            navigate(`/console/${orgSlug}/security?env=${scope.environment}`, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [findingEnvironment, scope.environment]);

    const back = (
        <Link className="gc-back-link gc-focusable" to={`/console/${orgSlug}/security?env=${scope.environment}`}>
            ← Findings
        </Link>
    );
    if (finding.isLoading) return <>{back}<LoadingState label="Loading finding…" /></>;
    if (finding.isError) return <>{back}<ErrorState error={finding.error} onRetry={finding.refetch} /></>;

    const data = finding.data;
    const canAcknowledge = data.status === "OPEN";
    const canAcceptRisk = data.status === "OPEN" || data.status === "ACKNOWLEDGED";
    const closeDialog = () => {
        setDialog(null);
        act.reset();
    };

    const actions = canManage && (canAcknowledge || canAcceptRisk) ? (
        <>
            {canAcknowledge ? (
                <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog("acknowledge")}>Acknowledge</button>
            ) : null}
            {canAcceptRisk ? (
                <button type="button" className="gc-button gc-button--ghost" onClick={() => setDialog("accept-risk")}>Accept risk</button>
            ) : null}
        </>
    ) : null;

    return (
        <>
            {back}
            <PageHeader
                title={data.title}
                description={
                    <span className="gc-badge-row">
                        <Badge value={data.status} label={data.status_label} />
                        <Badge value={data.severity} label={data.severity_label} />
                        <span>{ENVIRONMENT_LABELS[data.environment]}</span>
                        <span className="gc-muted">· {applicationLabel(data, applications.data)}</span>
                    </span>
                }
                actions={actions}
            />
            {!canManage && (canAcknowledge || canAcceptRisk) ? (
                <p className="gc-muted gc-page-note">Only Owners and Admins can acknowledge a finding or accept its risk.</p>
            ) : null}
            {data.status === "ACCEPTED_RISK" ? <AcceptedRisk finding={data} /> : null}

            <div className="gc-app-grid">
                <Card title="What happened">
                    {data.description ? <p className="gc-card-text">{data.description}</p> : null}
                    <dl className="gc-meta gc-finding-meta">
                        <div><dt>Source</dt><dd><TrustSummary trusts={evidence.map((item) => item.trust)} loading={false} /></dd></div>
                        <div><dt>First seen</dt><dd>{formatDateTime(data.first_seen_at)}</dd></div>
                        <div><dt>Last seen</dt><dd>{formatDateTime(data.last_seen_at)}</dd></div>
                        {data.resolved_at && data.status === "RESOLVED" ? (
                            <div><dt>Resolved</dt><dd>{formatDateTime(data.resolved_at)}</dd></div>
                        ) : null}
                    </dl>
                </Card>
                <Card title="Decisions">
                    <ActionHistory actions={data.actions} />
                </Card>
                <div className="gc-app-wide">
                    <Card title="Reports" subtitle="The security checks behind this finding, newest first.">
                        <EvidenceHistory evidenceIds={data.evidence_ids} orgSlug={orgSlug} />
                    </Card>
                </div>
            </div>
            {data.status === "RESOLVED" ? (
                <EmptyState title="Resolved">A later check passed, so this finding is closed. Its history stays here.</EmptyState>
            ) : null}

            {dialog ? <FindingActionDialog action={dialog} finding={data} mutation={act} onClose={closeDialog} /> : null}
        </>
    );
}

export default FindingDetailPage;
