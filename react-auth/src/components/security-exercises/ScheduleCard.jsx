import React, { useState } from "react";
import { formatDateTime } from "../security/securityLabels";
import { environmentLabel } from "./securityExerciseLabels";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";
import { getCadenceLabel, getScheduleRequestErrorMessage } from "./scheduleLabels";

export function ScheduleCard({
  schedule,
  playbookTitle,
  canManage,
  onView,
  onViewOccurrences,
  onViewRun,
  onToggleEnabled,
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  const toggleLabel = schedule.enabled ? "Disable Schedule" : "Enable Schedule";

  const handleConfirmToggle = async () => {
    setIsToggling(true);
    setToggleError(null);
    try {
      await onToggleEnabled(schedule, !schedule.enabled);
      setIsConfirming(false);
    } catch (requestError) {
      setToggleError(requestError);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <article className="schedule-card" aria-labelledby={`schedule-card-${schedule.id}`}>
      <div className="schedule-card-head">
        <h3 id={`schedule-card-${schedule.id}`} className="schedule-card-title">
          {schedule.name}
        </h3>
        <ScheduleStatusBadge enabled={schedule.enabled} />
      </div>

      <p className="security-muted schedule-card-playbook">
        {playbookTitle || schedule.playbook_key} · {getCadenceLabel(schedule.cadence)}
      </p>

      <dl className="schedule-card-meta">
        <div>
          <dt>Environment</dt>
          <dd>{environmentLabel(schedule.environment)}</dd>
        </div>
        <div>
          <dt>Next Run</dt>
          <dd>{formatDateTime(schedule.next_run_at)}</dd>
        </div>
        <div>
          <dt>Last Occurrence</dt>
          <dd>{schedule.last_occurrence_at ? formatDateTime(schedule.last_occurrence_at) : "Not yet"}</dd>
        </div>
        <div>
          <dt>Last Run</dt>
          <dd>
            {schedule.last_run_id ? (
              <button type="button" className="link-button" onClick={() => onViewRun(schedule.last_run_id)}>
                View last run
              </button>
            ) : (
              "No runs yet"
            )}
          </dd>
        </div>
      </dl>

      {toggleError && (
        <p className="security-error compact" role="alert">
          <span>{getScheduleRequestErrorMessage(toggleError)}</span>
        </p>
      )}

      <div className="schedule-card-actions">
        {!isConfirming && (
          <>
            <button type="button" className="security-button secondary" onClick={() => onView(schedule)}>
              View
            </button>
            <button type="button" className="security-button secondary" onClick={() => onViewOccurrences(schedule)}>
              Occurrences
            </button>
            {canManage && (
              <button type="button" className="security-button secondary" onClick={() => setIsConfirming(true)}>
                {toggleLabel}
              </button>
            )}
          </>
        )}
        {isConfirming && (
          <div className="schedule-card-confirm">
            <span>{schedule.enabled ? "Disable this schedule?" : "Enable this schedule?"}</span>
            <button
              type="button"
              className="security-button secondary"
              onClick={() => {
                setIsConfirming(false);
                setToggleError(null);
              }}
              disabled={isToggling}
            >
              Cancel
            </button>
            <button type="button" className="security-button primary" onClick={handleConfirmToggle} disabled={isToggling}>
              {isToggling ? "Saving…" : `Confirm ${schedule.enabled ? "Disable" : "Enable"}`}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default ScheduleCard;
