import React from "react";
import { getOccurrenceStatusLabel, getOccurrenceStatusTone } from "./scheduleLabels";

/**
 * Occurrence status (PENDING / DISPATCHED / BLOCKED / ERROR) uses its own
 * class prefix (`occurrence-status-*`), deliberately distinct from
 * ExerciseRunStatusBadge's `exercise-status-*` -- these are two different
 * vocabularies and must never look interchangeable. An occurrence badge
 * says whether Itachi could request the exercise; a run badge says what
 * the exercise itself produced.
 */
export function OccurrenceStatusBadge({ status }) {
  const tone = getOccurrenceStatusTone(status);
  return (
    <span className={`security-badge occurrence-status-${tone}`}>
      {getOccurrenceStatusLabel(status)}
    </span>
  );
}

export default OccurrenceStatusBadge;
