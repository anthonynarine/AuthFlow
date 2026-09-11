import React from "react";
import { SecurityEmptyState } from "../security/SecurityEmptyState";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { ExerciseRunStatusBadge } from "./ExerciseRunStatusBadge";
import { getNetworkErrorMessage } from "./securityExerciseLabels";

export function ExerciseRunHistoryTable({ runs, isLoading, error, isStale, onRetry, onSelectRun }) {
  if (isLoading && runs.length === 0) {
    return <SecurityLoadingState label="Loading run history" />;
  }

  if (error && runs.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (runs.length === 0) {
    return <SecurityEmptyState message="No Security Exercise runs yet." />;
  }

  return (
    <div className="exercise-run-history">
      {isStale && error && (
        <p className="security-muted stale-banner" role="status">
          Showing the last known run history. {getNetworkErrorMessage(error)}
        </p>
      )}
      <ul className="exercise-run-history-list">
        {runs.map((run) => (
          <li key={run.id}>
            <button type="button" className="exercise-run-history-row" onClick={() => onSelectRun(run)}>
              <span className="exercise-run-history-title">
                <strong>{run.playbook_title || run.playbook_key}</strong>
                <span className="security-muted">v{run.playbook_version}</span>
              </span>
              <ExerciseRunStatusBadge status={run.status} />
              <span className="security-muted">{formatDateTime(run.requested_at)}</span>
              <span className="security-muted">{run.requested_by_display || "—"}</span>
              {(run.case_id || run.finding_id) && (
                <span className="security-muted">
                  {run.case_id && `Case ${formatShortId(run.case_id)}`}
                  {run.case_id && run.finding_id && " · "}
                  {run.finding_id && `Finding ${formatShortId(run.finding_id)}`}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExerciseRunHistoryTable;
