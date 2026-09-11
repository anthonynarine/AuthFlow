import React, { useEffect, useRef, useState } from "react";
import { useExerciseRunExecution } from "../../hooks/useExerciseRunExecution";
import { ExerciseRunStatusBadge } from "./ExerciseRunStatusBadge";
import {
  environmentLabel,
  getExecutionErrorMessage,
  getRunStatusExplanation,
  getSafeEnvironments,
} from "./securityExerciseLabels";

/**
 * Confirm -> execute -> live status, all in one dialog, mirroring the
 * existing StepUpDialog convention (initial focus, Escape-to-close unless
 * a submission is in flight, success/result rendered in place).
 *
 * The POST body sent to /security-exercises/runs/ is built from exactly
 * the fields the API contract accepts -- playbook_key, playbook_version,
 * environment, and the optional target_control_key -- and nothing else.
 * No probe, capability, or authority field is ever constructed here. The
 * Idempotency-Key header and its retry/renewal lifecycle live entirely in
 * useExerciseRunExecution; this component just calls submit(payload).
 */
export function RunExerciseModal({ playbook, onClose, onRunSettled }) {
  const safeEnvironments = getSafeEnvironments(playbook?.allowed_environments);
  const [environment, setEnvironment] = useState(safeEnvironments[0] || "");
  const closeRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const execution = useExerciseRunExecution({
    onRunSettled: (settledRun) => onRunSettled?.(settledRun),
  });

  useEffect(() => {
    if (!playbook) {
      return undefined;
    }
    previouslyFocusedRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook]);

  useEffect(() => {
    setEnvironment(safeEnvironments[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook?.key, playbook?.version]);

  const canClose = execution.status !== "submitting";

  const handleClose = () => {
    if (!canClose) {
      return;
    }
    execution.reset();
    onClose();
  };

  useEffect(() => {
    if (!playbook) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook, canClose]);

  if (!playbook) {
    return null;
  }

  const handleConfirm = () => {
    if (!environment) {
      return;
    }
    const payload = {
      playbook_key: playbook.key,
      playbook_version: playbook.version,
      environment,
    };
    if (Array.isArray(playbook.target_controls) && playbook.target_controls.length === 1) {
      payload.target_control_key = playbook.target_controls[0].control_key;
    }
    execution.submit(payload).catch(() => {});
  };

  const showConfirmForm = execution.status === "idle" || execution.status === "error";

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-exercise-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Run Exercise</p>
            <h2 id="run-exercise-heading">{playbook.title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={handleClose}
            aria-label="Close run confirmation"
            disabled={!canClose}
          >
            ×
          </button>
        </div>

        {showConfirmForm && (
          <>
            <p>
              This runs the <strong>{playbook.title}</strong> playbook (version {playbook.version}) as a bounded,
              governed exercise. Gait's Incident Commander and Gateway authorize execution server-side; this
              confirmation does not itself grant authority.
            </p>

            {safeEnvironments.length > 1 ? (
              <label className="run-exercise-environment-field">
                <span>Environment</span>
                <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                  {safeEnvironments.map((env) => (
                    <option value={env} key={env}>
                      {environmentLabel(env)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p>
                Environment: <strong>{environmentLabel(safeEnvironments[0])}</strong>
              </p>
            )}

            {execution.submitError && (
              <p className="security-error compact" role="alert">
                <strong>Could not submit</strong>
                <span>{getExecutionErrorMessage(execution.submitError)}</span>
              </p>
            )}

            <div className="security-modal-footer">
              <button type="button" className="security-button secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="button" className="security-button primary" onClick={handleConfirm} disabled={!environment}>
                {execution.status === "error" ? "Try again" : "Confirm and Run"}
              </button>
            </div>
          </>
        )}

        {execution.status === "submitting" && (
          <div className="security-state security-loading" role="status" aria-live="polite">
            <span className="security-spinner" aria-hidden="true" />
            <span>Submitting exercise…</span>
          </div>
        )}

        {execution.run && (execution.status === "polling" || execution.status === "settled") && (
          <div className="exercise-run-result" role="status" aria-live="polite">
            <div className="exercise-run-result-head">
              <ExerciseRunStatusBadge status={execution.run.status} />
              {execution.status === "polling" && <span className="security-muted">Updating…</span>}
            </div>
            <p>{getRunStatusExplanation(execution.run.status)}</p>
            {execution.run.failure_reason && <p className="security-muted">{execution.run.failure_reason}</p>}
            <p className="security-muted security-truth-note">
              This is an exercise result, not Security Truth. Security Truth is evaluated independently by the
              security domain from trusted evidence.
            </p>
            <div className="security-modal-footer">
              <button type="button" className="security-button secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default RunExerciseModal;
