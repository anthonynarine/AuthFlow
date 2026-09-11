import React from "react";
import { getScheduleStateLabel, getScheduleStateTone } from "./scheduleLabels";

/**
 * Enabled/Disabled only -- a schedule is never labeled PASSED, FAILED, or
 * HEALTHY. Those are exercise-run and Security Truth concepts; a
 * schedule's own state is a separate, narrower thing (whether it will
 * produce future occurrences).
 */
export function ScheduleStatusBadge({ enabled }) {
  const tone = getScheduleStateTone(enabled);
  return (
    <span className={`security-badge schedule-state-${tone}`}>
      {getScheduleStateLabel(enabled)}
    </span>
  );
}

export default ScheduleStatusBadge;
