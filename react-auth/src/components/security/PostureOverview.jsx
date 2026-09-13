import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityInfoButton } from "./SecurityInfoButton";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime } from "./securityLabels";

const CONTROL_ROWS = [
  { key: "healthy", label: "Healthy" },
  { key: "needs_attention", label: "Needs attention" },
  { key: "control_failure", label: "Control failures" },
  { key: "unknown", label: "Unknown" },
  { key: "not_applicable", label: "Not applicable" },
];

const FINDING_ROWS = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function buildSummarySentence({ needsAttentionControls, pendingControls, needsAttentionFindings }) {
  const attentionParts = [];
  if (needsAttentionControls > 0) {
    attentionParts.push(pluralize(needsAttentionControls, "control"));
  }
  if (needsAttentionFindings > 0) {
    attentionParts.push(pluralize(needsAttentionFindings, "finding"));
  }

  const attentionSentence =
    attentionParts.length > 0
      ? `${attentionParts.join(" and ")} need attention.`
      : "Nothing needs attention right now.";

  const pendingSentence =
    pendingControls > 0
      ? ` ${pluralize(pendingControls, "control")} ${
          pendingControls === 1 ? "hasn't" : "haven't"
        } been evaluated yet -- that's not a problem by itself, just missing evidence.`
      : "";

  return attentionSentence + pendingSentence;
}

function AttentionCard({ label, value, tone, onClick }) {
  const className = `posture-attention-card posture-attention-card--${tone}`;
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={`${value} ${label}`}>
        <strong>{value}</strong>
        <span>{label}</span>
      </button>
    );
  }
  return (
    <div className={className}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function PostureOverview({ posture, isLoading, error, onRetry, info, onViewControls, onViewFindings }) {
  if (isLoading && !posture) {
    return <SecurityLoadingState label="Loading security posture" />;
  }

  if (error && !posture) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!posture) {
    return null;
  }

  const controls = posture.controls || {};
  const openFindings = posture.open_findings || {};

  const needsAttentionControls = (controls.needs_attention ?? 0) + (controls.control_failure ?? 0);
  const pendingControls = (controls.unknown ?? 0) + (controls.not_applicable ?? 0);
  const healthyControls = controls.healthy ?? 0;

  const needsAttentionFindings = (openFindings.critical ?? 0) + (openFindings.high ?? 0);
  const lowerPriorityFindings = (openFindings.warning ?? 0) + (openFindings.info ?? 0);

  const summarySentence = buildSummarySentence({ needsAttentionControls, pendingControls, needsAttentionFindings });

  return (
    <section className="security-panel posture-panel" aria-labelledby="security-posture-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Security Posture</p>
          <h2 id="security-posture-heading">
            Overall:{" "}
            <StatusBadge
              status={posture.overall_status}
              type="control-status"
              label={posture.overall_status_label}
            />
          </h2>
        </div>
        <div className="security-section-heading-actions">
          <span className="last-updated">
            Last evaluated {posture.last_evaluated_at ? formatDateTime(posture.last_evaluated_at) : "Never"}
          </span>
          {info && (
            <SecurityInfoButton
              title={info.title}
              label={info.label}
              content={info.content}
              currentStatus={posture.overall_status}
            />
          )}
        </div>
      </div>

      <p className="posture-summary">{summarySentence}</p>

      <div className="posture-attention-grid">
        <AttentionCard
          label="Controls needing attention"
          value={needsAttentionControls}
          tone={needsAttentionControls > 0 ? "danger" : "success"}
          onClick={onViewControls}
        />
        <AttentionCard label="Controls pending evaluation" value={pendingControls} tone="neutral" />
        <AttentionCard label="Healthy controls" value={healthyControls} tone="success" />
        <AttentionCard
          label="Findings needing attention"
          value={needsAttentionFindings}
          tone={needsAttentionFindings > 0 ? "danger" : "success"}
          onClick={onViewFindings}
        />
        <AttentionCard label="Lower-priority findings" value={lowerPriorityFindings} tone="neutral" />
      </div>

      <details className="posture-details">
        <summary>Show full breakdown</summary>
        <div className="posture-columns">
          <div className="posture-group">
            <h3>Controls</h3>
            <div className="posture-grid">
              {CONTROL_ROWS.map((row) => (
                <div className={`posture-card posture-${row.key}`} key={row.key}>
                  <span>{row.label}</span>
                  <strong>{controls[row.key] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="posture-group">
            <h3>Open findings</h3>
            <div className="posture-grid">
              {FINDING_ROWS.map((row) => (
                <div className={`posture-card posture-finding-${row.key}`} key={row.key}>
                  <span>{row.label}</span>
                  <strong>{openFindings[row.key] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <p className="posture-note">
        Active findings and unhealthy or unknown controls contribute to overall posture. Posture is derived by the
        backend, not calculated here.
      </p>
    </section>
  );
}
