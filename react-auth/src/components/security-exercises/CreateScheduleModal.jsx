import React, { useEffect, useMemo, useRef, useState } from "react";
import { useScheduleMutations } from "../../hooks/useScheduleMutations";
import { environmentLabel, getSafeEnvironments, isSafelyExecutable } from "./securityExerciseLabels";
import { CADENCE_VALUES, getCadenceLabel, getScheduleRequestErrorMessage } from "./scheduleLabels";

/**
 * Create a standing Security Exercise schedule.
 *
 * The POST body sent to /security-exercises/schedules/ is built from
 * exactly the fields SecurityExerciseScheduleRequestSerializer accepts --
 * name, playbook_key, playbook_version, environment, the optional
 * target_control_key, cadence, enabled, and next_run_at. No probe, tool,
 * capability, authority, AgentPrincipal, or Trunks/occurrence identifier
 * is ever constructed here -- this is schedule-definition management, not
 * the manual-run execution path (see RunExerciseModal / useExerciseRunExecution).
 *
 * next_run_at is required here because the backend does not compute an
 * initial value on create (SecurityExerciseScheduleRequestSerializer.next_run_at
 * has no default) -- it only auto-advances next_run_at once the schedule
 * has actually run or been re-enabled.
 */
export function CreateScheduleModal({ open, playbooks, onClose, onCreated }) {
  const closeRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const mutations = useScheduleMutations();

  const schedulablePlaybooks = useMemo(
    () => (playbooks || []).filter((playbook) => isSafelyExecutable(playbook)),
    [playbooks]
  );

  const [name, setName] = useState("");
  const [playbookChoice, setPlaybookChoice] = useState("");
  const [environment, setEnvironment] = useState("");
  const [targetControlKey, setTargetControlKey] = useState("");
  const [cadence, setCadence] = useState(CADENCE_VALUES[0]);
  const [enabled, setEnabled] = useState(true);
  const [nextRunAt, setNextRunAt] = useState("");
  const [createdSchedule, setCreatedSchedule] = useState(null);

  const selectedPlaybook = schedulablePlaybooks.find(
    (playbook) => `${playbook.key}:${playbook.version}` === playbookChoice
  );
  const safeEnvironments = getSafeEnvironments(selectedPlaybook?.allowed_environments);
  const targetControls = selectedPlaybook?.target_controls || [];

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setPlaybookChoice("");
      setEnvironment("");
      setTargetControlKey("");
      setCadence(CADENCE_VALUES[0]);
      setEnabled(true);
      setNextRunAt("");
      setCreatedSchedule(null);
      mutations.resetError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setEnvironment(safeEnvironments[0] || "");
    setTargetControlKey(targetControls.length === 1 ? targetControls[0].control_key : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbookChoice]);

  const canClose = !mutations.isSubmitting;

  const handleClose = () => {
    if (!canClose) {
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) {
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
  }, [open, canClose]);

  if (!open) {
    return null;
  }

  const isValid = Boolean(name.trim() && selectedPlaybook && environment && cadence && nextRunAt);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    const nextRunAtDate = new Date(nextRunAt);
    if (Number.isNaN(nextRunAtDate.getTime())) {
      return;
    }
    const payload = {
      name: name.trim(),
      playbook_key: selectedPlaybook.key,
      playbook_version: selectedPlaybook.version,
      environment,
      cadence,
      enabled,
      next_run_at: nextRunAtDate.toISOString(),
    };
    if (targetControlKey) {
      payload.target_control_key = targetControlKey;
    }
    try {
      const schedule = await mutations.createSchedule(payload);
      setCreatedSchedule(schedule);
      onCreated?.(schedule);
    } catch (requestError) {
      // Surfaced via mutations.submitError below.
    }
  };

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-schedule-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Security Exercise Schedule</p>
            <h2 id="create-schedule-heading">Create Schedule</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={handleClose}
            aria-label="Close create schedule"
            disabled={!canClose}
          >
            ×
          </button>
        </div>

        {!createdSchedule && (
          <form className="schedule-form" onSubmit={handleSubmit}>
            <p>
              A schedule requests an approved Security Exercise playbook on a bounded cadence. Execution still
              passes through Incident Commander, Red Team, and the Agent Gateway every time -- a schedule only
              decides <em>when</em> to ask.
            </p>

            <label className="schedule-form-field">
              <span>Schedule Name</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="schedule-form-field">
              <span>Playbook</span>
              <select value={playbookChoice} onChange={(event) => setPlaybookChoice(event.target.value)} required>
                <option value="">Select an approved playbook…</option>
                {schedulablePlaybooks.map((playbook) => (
                  <option value={`${playbook.key}:${playbook.version}`} key={`${playbook.key}:${playbook.version}`}>
                    {playbook.title} (v{playbook.version})
                  </option>
                ))}
              </select>
            </label>
            {schedulablePlaybooks.length === 0 && (
              <p className="security-muted">No approved, executable playbooks are currently schedulable.</p>
            )}

            {selectedPlaybook && (
              <>
                <label className="schedule-form-field">
                  <span>Environment</span>
                  <select value={environment} onChange={(event) => setEnvironment(event.target.value)} required>
                    {safeEnvironments.map((env) => (
                      <option value={env} key={env}>
                        {environmentLabel(env)}
                      </option>
                    ))}
                  </select>
                </label>

                {targetControls.length > 1 && (
                  <label className="schedule-form-field">
                    <span>Target Control</span>
                    <select value={targetControlKey} onChange={(event) => setTargetControlKey(event.target.value)}>
                      {targetControls.map((control) => (
                        <option value={control.control_key} key={control.control_key}>
                          {control.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}

            <label className="schedule-form-field">
              <span>Cadence</span>
              <select value={cadence} onChange={(event) => setCadence(event.target.value)} required>
                {CADENCE_VALUES.map((value) => (
                  <option value={value} key={value}>
                    {getCadenceLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="schedule-form-field">
              <span>Next Run</span>
              <input
                type="datetime-local"
                value={nextRunAt}
                onChange={(event) => setNextRunAt(event.target.value)}
                required
              />
            </label>

            <label className="security-checkbox-field">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              Enabled
            </label>

            {mutations.submitError && (
              <p className="security-error compact" role="alert">
                <strong>Could not create schedule</strong>
                <span>{getScheduleRequestErrorMessage(mutations.submitError)}</span>
              </p>
            )}

            <div className="security-modal-footer">
              <button type="button" className="security-button secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="security-button primary" disabled={!isValid || mutations.isSubmitting}>
                {mutations.isSubmitting ? "Creating…" : "Create Schedule"}
              </button>
            </div>
          </form>
        )}

        {createdSchedule && (
          <div className="schedule-form-success" role="status">
            <p>
              <strong>{createdSchedule.name}</strong> was created and is{" "}
              {createdSchedule.enabled ? "enabled" : "disabled"}.
            </p>
            <p className="security-muted">
              Future due occurrences may be requested while this schedule is enabled. Itachi's own scheduler
              infrastructure claims due schedules independently of this browser session.
            </p>
            <div className="security-modal-footer">
              <button type="button" className="security-button primary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default CreateScheduleModal;
