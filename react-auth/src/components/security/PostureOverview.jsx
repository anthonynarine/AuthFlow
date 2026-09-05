import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, getControlStatusHelp } from "./securityLabels";

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

export function PostureOverview({ posture, isLoading, error, onRetry }) {
  if (isLoading && !posture) {
    return <SecurityLoadingState label="Loading security posture" />;
  }

  if (error && !posture) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!posture) {
    return null;
  }

  const helperText = getControlStatusHelp(posture.overall_status);

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
        <span className="last-updated">
          Last evaluated {posture.last_evaluated_at ? formatDateTime(posture.last_evaluated_at) : "Never"}
        </span>
      </div>
      {helperText && <p className="posture-help">{helperText}</p>}
      <div className="posture-columns">
        <div className="posture-group">
          <h3>Controls</h3>
          <div className="posture-grid">
            {CONTROL_ROWS.map((row) => (
              <div className={`posture-card posture-${row.key}`} key={row.key}>
                <span>{row.label}</span>
                <strong>{posture.controls?.[row.key] ?? 0}</strong>
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
                <strong>{posture.open_findings?.[row.key] ?? 0}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="posture-note">
        Active findings and unhealthy or unknown controls contribute to overall posture. Posture is derived by the
        backend, not calculated here.
      </p>
    </section>
  );
}
