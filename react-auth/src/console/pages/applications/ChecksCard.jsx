import React, { useId } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, LoadingState, humanize } from "../../components/ui/primitives";
import { formatDateTime } from "../../utils/formatDate";
import { FEATURE_STATUS, STATUS_LABELS } from "../../../docs/featureStatus";

/**
 * CHK2a: the built-in checks one application has reported (gait-sdk
 * `python manage.py gait_check`). Everything here is self-reported by the
 * application; Gait only stores and compares it.
 *
 * Colour means result and nothing else: FAIL red, WARNING amber, PASS green,
 * everything informational grey. Severity is plain text.
 */

const RESULT_TONES = { FAIL: "bad", WARNING: "warn", PASS: "good", INFORMATIONAL: "muted" };
const RESULT_ORDER = { FAIL: 0, WARNING: 1, INFORMATIONAL: 2, PASS: 3 };
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
const OUTCOME_LABELS = {
    ok: "Pass",
    fail: "Fail",
    weak: "Weak",
    not_applicable: "Not applicable",
    unknown: "Unknown",
    error: "Couldn't check",
};
const FACT_LABELS = { django_ids: "Django check IDs" };
const ACRONYMS = /\b(hsts|csrf|ssl|tls|cors|drf|coop|smtp|url|id|ids)\b/gi;

/** host_count → "Host count"; hsts_seconds → "HSTS seconds". */
export function factLabel(name) {
    return FACT_LABELS[name] || humanize(name).replace(ACRONYMS, (word) => (word.toLowerCase() === "ids" ? "IDs" : word.toUpperCase()));
}

const PACK_LABELS = { django: "Django", fastapi: "FastAPI", deps: "Dependencies" };
// CHK2b: the dependency-vulnerability check reports a list of advisories.
export const KNOWN_VULNS_CHECK = "CHK.DEPS.KNOWN_VULNS";

export const SETUP_SNIPPET = 'pip install "gait-sdk[django]"\npython manage.py gait_check';

export function packLabel(pack) {
    return PACK_LABELS[pack] || humanize(pack);
}

/** Worst first: FAIL, WARNING, informational, PASS; then by severity, then title. */
export function sortChecks(checks) {
    return [...checks].sort(
        (a, b) =>
            (RESULT_ORDER[a.result] ?? 9) - (RESULT_ORDER[b.result] ?? 9) ||
            (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
            String(a.title).localeCompare(String(b.title))
    );
}

/** A fact value as text: Yes/No, numbers, comma-separated lists. Never JSON. */
export function formatFact(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.map((item) => formatFact(item)).join(", ") : "None";
    if (typeof value === "object") return "—";
    return String(value);
}

function resultLabel(check) {
    return OUTCOME_LABELS[check.outcome] || humanize(check.result);
}

function EarlyAccessBadge() {
    const status = FEATURE_STATUS.checkPacks;
    return status === "live" ? null : <Badge tone="info" label={STATUS_LABELS[status]} />;
}

function SetupSnippet() {
    return (
        <pre className="gc-snippet" aria-label="Setup commands">
            <code>{SETUP_SNIPPET}</code>
        </pre>
    );
}

/**
 * CHK.DEPS.KNOWN_VULNS: counts, then one table row per advisory. `reason`
 * means the scan itself didn't run (tool_missing, timeout, unparseable,
 * network), which is said in words instead of as a fact.
 */
function KnownVulnsFacts({ facts }) {
    const items = Array.isArray(facts?.items) ? facts.items.filter((item) => item && typeof item === "object") : [];
    return (
        <>
            {facts?.reason ? <p className="gc-card-text">Couldn't check: {humanize(facts.reason)}</p> : null}
            <dl className="gc-meta gc-pack-check-facts">
                {facts?.tool ? <div><dt>Tool</dt><dd>{formatFact(facts.tool)}</dd></div> : null}
                <div><dt>Vulnerable packages</dt><dd>{formatFact(facts?.vulnerable_count)}</dd></div>
                <div><dt>Without a fix yet</dt><dd>{formatFact(facts?.unfixed_count)}</dd></div>
            </dl>
            {items.length ? (
                <div className="gc-table-wrap">
                    <table className="gc-table gc-pack-check-vulns">
                        <caption className="gc-visually-hidden">Known vulnerabilities</caption>
                        <thead>
                            <tr>
                                <th scope="col">Package</th>
                                <th scope="col">Version</th>
                                <th scope="col">Advisory</th>
                                <th scope="col">Fixed in</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={`${item.package}-${item.version}-${item.advisory_id}`}>
                                    <td>{formatFact(item.package)}</td>
                                    <td>{formatFact(item.version)}</td>
                                    <td><code className="gc-code">{formatFact(item.advisory_id)}</code></td>
                                    <td>{formatFact(item.fixed_in)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </>
    );
}

function Facts({ facts }) {
    const entries = Object.entries(facts || {});
    if (entries.length === 0) {
        return <p className="gc-card-text gc-muted">No details were reported for this check.</p>;
    }
    return (
        <dl className="gc-meta gc-pack-check-facts">
            {entries.map(([name, value]) => (
                <div key={name}>
                    <dt>{factLabel(name)}</dt>
                    <dd>{formatFact(value)}</dd>
                </div>
            ))}
        </dl>
    );
}

function CheckRow({ check, orgSlug, environment }) {
    const titleId = `check-${useId()}`;
    return (
        <li className="gc-pack-check" aria-labelledby={titleId}>
            <div className="gc-pack-check-row">
                <div className="gc-pack-check-result">
                    <Badge tone={RESULT_TONES[check.result] || "muted"} label={resultLabel(check)} />
                </div>
                <div className="gc-pack-check-main">
                    <h3 id={titleId} className="gc-pack-check-title">{check.title}</h3>
                    <p className="gc-cell-sub">
                        {humanize(check.severity)} severity · <code className="gc-code gc-pack-check-id">{check.id}</code>
                    </p>
                </div>
                <div className="gc-pack-check-when">
                    <span className="gc-pack-check-reported">
                        Reported {formatDateTime(check.reported_at)}
                        {check.stale ? <Badge tone="muted" label="Stale" /> : null}
                    </span>
                    {check.stale ? (
                        <span className="gc-cell-sub">Out of date since {formatDateTime(check.valid_until)}</span>
                    ) : null}
                </div>
                <div className="gc-pack-check-finding">
                    {check.finding ? (
                        <Link
                            className="gc-table-link"
                            to={`/console/${orgSlug}/security/findings/${check.finding.id}?env=${environment}`}
                            aria-label={`View the finding for ${check.title}`}
                        >
                            View finding
                            <span className="gc-cell-sub">{humanize(check.finding.status)}</span>
                        </Link>
                    ) : null}
                </div>
            </div>
            <details className="gc-pack-check-details">
                <summary>Details and how to fix</summary>
                <div className="gc-pack-check-details-body">
                    <h4 className="gc-pack-check-subhead">What your application reported</h4>
                    {check.id === KNOWN_VULNS_CHECK ? <KnownVulnsFacts facts={check.facts} /> : <Facts facts={check.facts} />}
                    <h4 className="gc-pack-check-subhead">How to fix</h4>
                    <p className="gc-card-text">{check.remediation}</p>
                    {check.source_reference ? (
                        <p className="gc-cell-sub">
                            Source: <code className="gc-code">{check.source_reference}</code>
                        </p>
                    ) : null}
                </div>
            </details>
        </li>
    );
}

/**
 * "18 of 21 checks reported · 2 failing", or null before anything is
 * reported. The total is Gait's `total_checks`: the checks in the packs this
 * application has reported, never a number built in here.
 */
export function checksSummary(data) {
    if (!data || !data.reported_checks) return null;
    const failing = data.checks.filter((check) => check.result === "FAIL").length;
    const parts = [`${data.reported_checks} of ${data.total_checks} checks reported`];
    if (failing) parts.push(`${failing} failing`);
    return parts.join(" · ");
}

export function ChecksCard({ checks, orgSlug, environment }) {
    const subtitle = (
        <span className="gc-badge-row">
            <Badge value="SELF_REPORTED" label="Reported by your application" />
            {checks.data?.last_run_at ? <span>Last run {formatDateTime(checks.data.last_run_at)}</span> : null}
        </span>
    );

    let body;
    if (checks.isLoading) body = <LoadingState label="Loading checks…" />;
    else if (checks.isError) body = <ErrorState error={checks.error} onRetry={checks.refetch} />;
    else if (!checks.data.checks.length) {
        body = (
            <EmptyState title="No checks reported yet">
                <p className="gc-card-text">
                    Run the built-in checks from your application with gait-sdk; each run reports its results here.
                </p>
                <SetupSnippet />
                <p className="gc-card-text gc-muted">
                    Add <code className="gc-code">--pack deps</code> to include dependency checks.
                </p>
                <p className="gc-card-text">
                    <a href="/docs/gait-sdk">gait-sdk docs</a>
                </p>
            </EmptyState>
        );
    } else {
        body = (
            <>
                <p className="gc-card-text gc-muted gc-pack-checks-count">
                    {checksSummary(checks.data)}
                    {checks.data.packs?.length ? ` · Packs: ${checks.data.packs.map(packLabel).join(", ")}` : null}
                </p>
                <ul className="gc-pack-checks" aria-label="Built-in checks">
                    {sortChecks(checks.data.checks).map((check) => (
                        <CheckRow key={check.id} check={check} orgSlug={orgSlug} environment={environment} />
                    ))}
                </ul>
            </>
        );
    }

    return (
        <Card title="Built-in checks" subtitle={subtitle} actions={<EarlyAccessBadge />}>
            {body}
        </Card>
    );
}

export default ChecksCard;
