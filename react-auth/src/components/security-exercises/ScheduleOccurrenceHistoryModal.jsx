import React, { useEffect, useRef } from "react";
import { useScheduleOccurrences } from "../../hooks/useScheduleOccurrences";
import { SecurityEmptyState } from "../security/SecurityEmptyState";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { OccurrenceStatusBadge } from "./OccurrenceStatusBadge";
import { getOccurrenceStatusExplanation, humanizeBlockReason } from "./scheduleLabels";

/**
 * One schedule's durable occurrence history
 * (GET /security-exercises/schedules/<id>/occurrences/).
 *
 * An occurrence's own status (PENDING/DISPATCHED/BLOCKED/ERROR) is kept
 * visually and textually separate from the linked SecurityExerciseRun's
 * result (PASSED/FAILED/DENIED/ERROR) -- OccurrenceStatusBadge never
 * reuses ExerciseRunStatusBadge's markup, and the run is opened through
 * the existing Run Detail dialog rather than a second representation.
 */
export function ScheduleOccurrenceHistoryModal({ schedule, onClose, onViewRun }) {
  const closeRef = useRef(null);
  const { occurrences, isLoading, error, refetch } = useScheduleOccurrences(schedule?.id || null);

  useEffect(() => {
    if (!schedule) {
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
  }, [schedule, onClose]);

  if (!schedule) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-occurrences-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Occurrence History</p>
            <h2 id="schedule-occurrences-heading">{schedule.name}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close occurrence history"
          >
            ×
          </button>
        </div>

        <div className="schedule-occurrence-toolbar">
          <button type="button" className="security-button secondary" onClick={() => refetch().catch(() => {})}>
            Refresh
          </button>
        </div>

        {isLoading && occurrences.length === 0 && <SecurityLoadingState label="Loading occurrence history" />}
        {error && occurrences.length === 0 && <SecurityErrorState error={error} onRetry={refetch} compact />}

        {!isLoading && !error && occurrences.length === 0 && (
          <SecurityEmptyState message="This schedule has not produced an occurrence yet." />
        )}

        {occurrences.length > 0 && (
          <ul className="occurrence-history-list">
            {occurrences.map((occurrence) => (
              <li key={occurrence.id} className="occurrence-history-row">
                <div className="occurrence-history-row-head">
                  <span className="security-muted">{formatDateTime(occurrence.scheduled_for)}</span>
                  <OccurrenceStatusBadge status={occurrence.status} />
                </div>
                <p className="security-muted occurrence-history-explanation">
                  {getOccurrenceStatusExplanation(occurrence.status)}
                </p>
                {occurrence.failure_reason && (
                  <p className="security-muted">Reason: {humanizeBlockReason(occurrence.failure_reason)}</p>
                )}
                <div className="occurrence-history-row-meta">
                  <span>Created {formatDateTime(occurrence.created_at)}</span>
                  {occurrence.dispatched_at && <span>Dispatched {formatDateTime(occurrence.dispatched_at)}</span>}
                  {occurrence.run_id ? (
                    <button type="button" className="link-button" onClick={() => onViewRun(occurrence.run_id)}>
                      View run {formatShortId(occurrence.run_id)}
                    </button>
                  ) : (
                    <span>No run created</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ScheduleOccurrenceHistoryModal;
