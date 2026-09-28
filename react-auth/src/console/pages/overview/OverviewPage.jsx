import React, { useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { TrustBadge, TrustSummary } from "../../components/TrustBadge";
import { ENVIRONMENT_LABELS, ENVIRONMENTS } from "../../hooks/useConsoleScope";
import { formatDateTime } from "../../utils/formatDate";
import { rememberLastOrganization } from "../ConsoleEntry";
import { openFindingsTotal, useControls, useControlsByEnvironment, usePosture } from "./useOverviewData";
import "./OverviewPage.css";

const SEVERITIES = [
    ["critical", "Critical", "CRITICAL"],
    ["high", "High", "HIGH"],
    ["warning", "Warning", "WARNING"],
    ["info", "Info", "INFO"],
];

const CONTROL_STATUSES = [
    ["control_failure", "failing"],
    ["needs_attention", "need attention"],
    ["unknown", "unknown"],
    ["healthy", "healthy"],
];

function controlSummary(counts = {}) {
    const parts = CONTROL_STATUSES.filter(([key]) => counts[key]).map(([key, label]) => `${counts[key]} ${label}`);
    return parts.length ? parts.join(" · ") : "No controls";
}

function findingsLabel(total) {
    if (total === 0) return "No open findings";
    return total === 1 ? "1 open finding" : `${total} open findings`;
}

/** One environment in the "all environments" grid; choosing it switches the console's environment. */
function EnvironmentCard({ posture, isCurrent, onSelect, trusts, trustLoading }) {
    const total = openFindingsTotal(posture);
    return (
        <li>
            <button
                type="button"
                className={`gc-env-card gc-focusable${isCurrent ? " is-current" : ""}`}
                aria-pressed={isCurrent}
                onClick={onSelect}
            >
                <span className="gc-env-card-head">
                    <span className="gc-env-card-name">{ENVIRONMENT_LABELS[posture.environment]}</span>
                    <Badge value={posture.overall_status} label={posture.overall_status_label} />
                </span>
                <span className="gc-env-card-line">{findingsLabel(total)}</span>
                <span className="gc-env-card-line gc-muted">Controls: {controlSummary(posture.controls)}</span>
                <span className="gc-env-card-line">
                    <span className="gc-muted">Source:</span> <TrustSummary trusts={trusts} loading={trustLoading} />
                </span>
                <span className="gc-env-card-line gc-muted">Last evaluated {formatDateTime(posture.last_evaluated_at)}</span>
            </button>
        </li>
    );
}

function OpenFindings({ posture, findingsLink }) {
    const total = openFindingsTotal(posture);
    return (
        <Card
            title="Open findings"
            subtitle={findingsLabel(total)}
            actions={
                total > 0 ? (
                    <Link to={findingsLink} className="gc-button gc-button--ghost gc-focusable">
                        See findings
                    </Link>
                ) : null
            }
        >
            <ul className="gc-severity-list" aria-label="Open findings by severity">
                {SEVERITIES.map(([key, label, value]) => (
                    <li key={key} className={posture.open_findings?.[key] ? "" : "gc-muted"}>
                        <Badge value={value} label={label} tone={posture.open_findings?.[key] ? undefined : "muted"} />
                        <span className="gc-severity-count">{posture.open_findings?.[key] || 0}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

function ControlsCard({ controls }) {
    return (
        <Card title="Controls" subtitle="What Gait checks for your applications in this environment.">
            <ul className="gc-control-list">
                {controls.map((control) => {
                    const state = control.state || {};
                    return (
                        <li key={control.control_key} className="gc-control">
                            <div className="gc-control-head">
                                <p className="gc-control-title">{control.title}</p>
                                <span className="gc-badge-row">
                                    <Badge value={state.status} label={state.status_label} />
                                    <TrustBadge trust={state.trust || null} />
                                </span>
                            </div>
                            {control.help?.status_explanation ? (
                                <p className="gc-control-text">{control.help.status_explanation}</p>
                            ) : null}
                            <p className="gc-control-meta gc-muted">
                                Last evaluated {formatDateTime(state.last_evaluated_at)}
                                {state.last_evidence_at ? <> · latest evidence {formatDateTime(state.last_evidence_at)}</> : null}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}

function NoDataYet({ orgSlug }) {
    return (
        <EmptyState
            title="Nothing has been reported yet"
            action={
                <span className="gc-badge-row">
                    <Link className="gc-button gc-button--primary gc-focusable" to={`/console/${orgSlug}/applications`}>
                        Go to Applications
                    </Link>
                    <a className="gc-button gc-button--ghost gc-focusable" href="/docs/connecting-your-software">
                        How to connect your software
                    </a>
                </span>
            }
        >
            Add an application, put its connection key in your software, and send a security check. Results show up
            here, separately for each environment.
        </EmptyState>
    );
}

/** F1: the company's security posture, every environment at a glance, then the selected one in detail. */
export function OverviewPage() {
    const scope = useOutletContext();
    const { orgSlug, environment, overview } = scope;

    useEffect(() => {
        rememberLastOrganization(orgSlug);
    }, [orgSlug]);

    const environments = overview.data?.environments || [];
    const inUse = ENVIRONMENTS.map((env) => environments.find((row) => row.environment === env)).filter(
        (row) => row && row.has_data
    );
    const notInUse = ENVIRONMENTS.filter((env) => !inUse.some((row) => row.environment === env));
    const currentInUse = inUse.some((row) => row.environment === environment);

    const posture = usePosture(orgSlug, environment, { enabled: currentInUse });
    const controls = useControls(orgSlug, environment, { enabled: overview.isSuccess });
    const controlsByEnvironment = useControlsByEnvironment(
        orgSlug,
        inUse.map((row) => row.environment)
    );

    const header = (
        <PageHeader
            title="Overview"
            description={`Security posture for ${scope.membership.name}. Each environment is kept separate.`}
        />
    );

    if (overview.isLoading) {
        return <>{header}<LoadingState label="Loading your security posture…" /></>;
    }
    if (overview.isError) {
        return <>{header}<ErrorState error={overview.error} onRetry={overview.refetch} /></>;
    }
    if (inUse.length === 0) {
        return <>{header}<NoDataYet orgSlug={orgSlug} /></>;
    }

    // H2: each control's state carries the trust of its latest evidence.
    const trustsFor = (env) => (controlsByEnvironment[env]?.data || []).map((control) => control.state?.trust);
    const trustLoadingFor = (env) => Boolean(controlsByEnvironment[env]?.isLoading);

    return (
        <>
            {header}

            <section aria-labelledby="gc-all-environments" className="gc-section">
                <h2 id="gc-all-environments" className="gc-section-title">All environments</h2>
                <ul className="gc-env-grid">
                    {inUse.map((row) => (
                        <EnvironmentCard
                            key={row.environment}
                            posture={row}
                            isCurrent={row.environment === environment}
                            onSelect={() => scope.setEnvironment(row.environment)}
                            trusts={trustsFor(row.environment)}
                            trustLoading={trustLoadingFor(row.environment)}
                        />
                    ))}
                </ul>
                {notInUse.length > 0 ? (
                    <p className="gc-muted gc-section-note">
                        No data yet: {notInUse.map((env) => ENVIRONMENT_LABELS[env]).join(", ")}.
                    </p>
                ) : null}
            </section>

            <section aria-labelledby="gc-current-environment" className="gc-section">
                <h2 id="gc-current-environment" className="gc-section-title">
                    {ENVIRONMENT_LABELS[environment]} in detail
                </h2>
                {!currentInUse ? (
                    <EmptyState title={`Nothing has been reported from ${ENVIRONMENT_LABELS[environment]} yet`}>
                        Pick an environment above, or add an application for {ENVIRONMENT_LABELS[environment]} and send a
                        security check from it.
                    </EmptyState>
                ) : posture.isLoading ? (
                    <LoadingState label={`Loading ${ENVIRONMENT_LABELS[environment]}…`} />
                ) : posture.isError ? (
                    <ErrorState error={posture.error} onRetry={posture.refetch} />
                ) : (
                    <div className="gc-detail-grid">
                        <Card title="Health" subtitle={`Last evaluated ${formatDateTime(posture.data.last_evaluated_at)}`}>
                            <p className="gc-health">
                                <Badge value={posture.data.overall_status} label={posture.data.overall_status_label} />
                            </p>
                            <p className="gc-muted gc-health-note">
                                Source: <TrustSummary trusts={trustsFor(environment)} loading={trustLoadingFor(environment)} />
                            </p>
                        </Card>
                        <OpenFindings
                            posture={posture.data}
                            findingsLink={`/console/${orgSlug}/security?env=${environment}`}
                        />
                        <div className="gc-detail-wide">
                            {controls.isLoading ? (
                                <LoadingState label="Loading controls…" />
                            ) : controls.isError ? (
                                <ErrorState error={controls.error} onRetry={controls.refetch} />
                            ) : (
                                <ControlsCard controls={controls.data} />
                            )}
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}

export default OverviewPage;
