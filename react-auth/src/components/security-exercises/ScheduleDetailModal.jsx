import React, { useEffect, useRef, useState } from "react";
import { formatDateTime } from "../security/securityLabels";
import { environmentLabel, getSafeEnvironments } from "./securityExerciseLabels";
import { useScheduleMutations } from "../../hooks/useScheduleMutations";
import { CADENCE_VALUES, getCadenceLabel, getScheduleRequestErrorMessage } from "./scheduleLabels";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";

function DetailRow({ label, value, children }) {
  const content = children ?? (value || "—");
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function toDatetimeLocalValue(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

/**
 * Inspect one Security Exercise schedule: full definition, Enable/Disable,
 * and editing the future-only fields the backend PATCH endpoint accepts
 * (name, cadence, environment, target_control_key, next_run_at). Playbook
 * and playbook_version are intentionally not editable from this dialog --
 * changing the underlying approved playbook is a bigger decision than the
 * cadence/environment fields here, so it is out of scope for this form.
 * Historical occurrence data is never shown as editable here.
 */
export function ScheduleDetailModal({ schedule, playbooks, canManage, onClose, onUpdated, onViewOccurrences }) {
  const closeRef = useRef(null);
  const mutations = useScheduleMutations();
  const [mode, setMode] = useState("view");
  const [isConfirmingToggle, setIsConfirmingToggle] = useState(false);

  const [name, setName] = useState("");
  const [cadence, setCadence] = useState("");
  const [environment, setEnvironment] = useState("");
  const [targetControlKey, setTargetControlKey] = useState("");
  const [nextRunAt, setNextRunAt] = useState("");

  const matchingPlaybook = (playbooks || []).find(
    (playbook) => playbook.key === schedule?.playbook_key && playbook.version === schedule?.playbook_version
  );
  const safeEnvironments = matchingPlaybook
    ? getSafeEnvironments(matchingPlaybook.allowed_environments)
    : schedule
    ? [schedule.environment]
    : [];
  const targetControls = matchingPlaybook?.target_controls || [];

  useEffect(() => {
    if (!schedule) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [schedule]);

  useEffect(() => {
    setMode("view");
    setIsConfirmingToggle(false);
    mutations.resetError();
    if (schedule) {
      setName(schedule.name);
      setCadence(schedule.cadence);
      setEnvironment(schedule.environment);
      setTargetControlKey(schedule.target_control_key || "");
      setNextRunAt(toDatetimeLocalValue(schedule.next_run_at));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.id]);

  const canClose = !mutations.isSubmitting;

  const handleClose = () => {
    if (!canClose) {
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!schedule) {
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
  }, [schedule, canClose]);

  if (!schedule) {
    return null;
  }

  const handleToggleConfirm = async () => {
    try {
      const updated = await mutations.updateSchedule(schedule.id, { enabled: !schedule.enabled });
      setIsConfirmingToggle(false);
      onUpdated?.(updated);
    } catch (requestError) {
      // Surfaced via mutations.submitError below.
    }
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    const nextRunAtDate = new Date(nextRunAt);
    if (Number.isNaN(nextRunAtDate.getTime())) {
      return;
    }
    const payload = {
      name: name.trim(),
      cadence,
      environment,
      target_control_key: targetControlKey || "",
      next_run_at: nextRunAtDate.toISOString(),
    };
    try {
      const updated = await mutations.updateSchedule(schedule.id, payload);
      setMode("view");
      onUpdated?.(updated);
    } catch (requestError) {
      // Surfaced via mutations.submitError below.
    }
  };

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-detail-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Security Exercise Schedule</p>
            <h2 id="schedule-detail-heading">{schedule.name}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={handleClose}
            aria-label="Close schedule detail"
            disabled={!canClose}
          >
            ×
          </button>
        </div>

        <div className="exercise-run-result-head">
          <ScheduleStatusBadge enabled={schedule.enabled} />
        </div>
        <p className="security-muted">
          This schedule requests an approved Security Exercise when due. Execution still passes through Red Team
          and the Agent Gateway -- enabling this schedule does not itself grant execution authority. Future due
          occurrences may be requested while this schedule is enabled.
        </p>

        {mode === "view" && (
          <>
            <dl className="detail-grid">
              <DetailRow label="Playbook" value={`${matchingPlaybook?.title || schedule.playbook_key} v${schedule.playbook_version}`} />
              <DetailRow label="Environment" value={environmentLabel(schedule.environment)} />
              <DetailRow label="Target control" value={schedule.target_control_key || "—"} />
              <DetailRow label="Cadence" value={getCadenceLabel(schedule.cadence)} />
              <DetailRow label="Next Run" value={formatDateTime(schedule.next_run_at)} />
              <DetailRow
                label="Last Occurrence"
                value={schedule.last_occurrence_at ? formatDateTime(schedule.last_occurrence_at) : "Not yet"}
              />
              <DetailRow label="Created by" value={schedule.created_by_display} />
              <DetailRow label="Created" value={formatDateTime(schedule.created_at)} />
              <DetailRow label="Updated" value={formatDateTime(schedule.updated_at)} />
            </dl>

            {mutations.submitError && (
              <p className="security-error compact" role="alert">
                <span>{getScheduleRequestErrorMessage(mutations.submitError)}</span>
              </p>
            )}

            {isConfirmingToggle ? (
              <div className="schedule-card-confirm">
                <span>{schedule.enabled ? "Disable this schedule?" : "Enable this schedule?"}</span>
                <button
                  type="button"
                  className="security-button secondary"
                  onClick={() => {
                    setIsConfirmingToggle(false);
                    mutations.resetError();
                  }}
                  disabled={mutations.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="security-button primary"
                  onClick={handleToggleConfirm}
                  disabled={mutations.isSubmitting}
                >
                  {mutations.isSubmitting ? "Saving…" : `Confirm ${schedule.enabled ? "Disable" : "Enable"}`}
                </button>
              </div>
            ) : (
              <div className="security-modal-footer">
                <button type="button" className="security-button secondary" onClick={() => onViewOccurrences(schedule)}>
                  View Occurrences
                </button>
                {canManage && (
                  <>
                    <button type="button" className="security-button secondary" onClick={() => setMode("edit")}>
                      Edit
                    </button>
                    <button type="button" className="security-button secondary" onClick={() => setIsConfirmingToggle(true)}>
                      {schedule.enabled ? "Disable Schedule" : "Enable Schedule"}
                    </button>
                  </>
                )}
                <button type="button" className="security-button primary" onClick={handleClose}>
                  Close
                </button>
              </div>
            )}
          </>
        )}

        {mode === "edit" && (
          <form className="schedule-form" onSubmit={handleSaveEdit}>
            <p className="security-muted">Changes apply to future occurrences only. Past occurrence history is never rewritten.</p>

            <label className="schedule-form-field">
              <span>Schedule Name</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

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

            {mutations.submitError && (
              <p className="security-error compact" role="alert">
                <strong>Could not save changes</strong>
                <span>{getScheduleRequestErrorMessage(mutations.submitError)}</span>
              </p>
            )}

            <div className="security-modal-footer">
              <button
                type="button"
                className="security-button secondary"
                onClick={() => {
                  setMode("view");
                  mutations.resetError();
                }}
                disabled={mutations.isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="security-button primary" disabled={mutations.isSubmitting}>
                {mutations.isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default ScheduleDetailModal;
