import React, { useEffect, useRef } from "react";
import { useExerciseRunDetail } from "../../hooks/useExerciseRunDetail";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { ExerciseRunStatusBadge } from "./ExerciseRunStatusBadge";
import { getRunStatusExplanation, isActiveRunStatus } from "./securityExerciseLabels";

function DetailRow({ label, value, children }) {
  const content = children ?? (value || "—");
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

export function ExerciseRunDetailModal({ runId, initialRun, onClose }) {
  const closeRef = useRef(null);
  const detail = useExerciseRunDetail(runId);
  const run = detail.run || initialRun;

  useEffect(() => {
    if (!runId) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [runId, onClose]);

  if (!runId) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-run-detail-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Exercise Run</p>
            <h2 id="exercise-run-detail-heading">{run?.playbook_title || run?.playbook_key || "Run detail"}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close run detail">
            ×
          </button>
        </div>

        {detail.isLoading && !run && <SecurityLoadingState label="Loading run detail" />}
        {detail.error && !run && <SecurityErrorState error={detail.error} compact />}

        {run && (
          <>
            <div className="exercise-run-result-head">
              <ExerciseRunStatusBadge status={run.status} />
              {isActiveRunStatus(run.status) && <span className="security-muted">Updating…</span>}
            </div>
            <p>{getRunStatusExplanation(run.status)}</p>
            <p className="security-muted security-truth-note">
              This is an exercise result, not Security Truth. Security Truth is evaluated independently by the
              security domain from trusted evidence.
            </p>
            <dl className="detail-grid">
              <DetailRow label="Playbook" value={`${run.playbook_key} v${run.playbook_version}`} />
              <DetailRow label="Category" value={run.category} />
              <DetailRow label="Environment" value={run.environment} />
              <DetailRow label="Requested by" value={run.requested_by_display} />
              <DetailRow label="Requested at" value={formatDateTime(run.requested_at)} />
              <DetailRow label="Started at" value={formatDateTime(run.started_at)} />
              <DetailRow label="Completed at" value={formatDateTime(run.completed_at)} />
              <DetailRow label="Result summary" value={run.result_summary} />
              <DetailRow label="Failure reason" value={run.failure_reason} />
              <DetailRow label="Authorization reason" value={run.authorization_reason} />
              <DetailRow label="Target control" value={run.target_control_key} />
              <DetailRow label="Case" value={run.case_id ? formatShortId(run.case_id) : "—"} />
              <DetailRow label="Finding" value={run.finding_id ? formatShortId(run.finding_id) : "—"} />
            </dl>
          </>
        )}
      </section>
    </div>
  );
}

export default ExerciseRunDetailModal;
