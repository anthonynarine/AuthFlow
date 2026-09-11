import React from "react";
import { getRunStatusLabel, getRunStatusTone } from "./securityExerciseLabels";

/**
 * Status is conveyed in the label text itself, not color alone
 * (B-RED1C section 34) -- the tone class is a visual reinforcement only.
 */
export function ExerciseRunStatusBadge({ status }) {
  const tone = getRunStatusTone(status);
  return (
    <span className={`security-badge exercise-status-${tone}`}>
      {getRunStatusLabel(status)}
    </span>
  );
}

export default ExerciseRunStatusBadge;
