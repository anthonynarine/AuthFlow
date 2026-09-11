import { humanizeEnum } from "../security/securityLabels";

/**
 * B-RED1D (Itachi). Backend SecurityExerciseSchedule.Cadence values --
 * intentionally bounded to these three (no cron, no custom intervals).
 * See security_exercises/models.py::SecurityExerciseSchedule.Cadence.
 */
export const CADENCE_VALUES = ["HOURLY", "DAILY", "WEEKLY"];

const CADENCE_LABELS = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
};

export function getCadenceLabel(cadence) {
  return CADENCE_LABELS[cadence] || humanizeEnum(cadence);
}

/**
 * A schedule's enabled/disabled state is never a run/exercise result
 * (PASSED/FAILED/HEALTHY, etc.) -- it only says whether Itachi will
 * produce new occurrences for this schedule going forward.
 */
export function getScheduleStateLabel(enabled) {
  return enabled ? "Enabled" : "Disabled";
}

export function getScheduleStateTone(enabled) {
  return enabled ? "success" : "neutral";
}

/**
 * Backend SecurityExerciseOccurrence.Status values (security_exercises/
 * models.py). Deliberately a distinct vocabulary from SecurityExerciseRun
 * status -- an occurrence describes whether Itachi could safely *request*
 * the exercise, not the exercise's own PASSED/FAILED/DENIED/ERROR result.
 */
export const OCCURRENCE_STATUSES = ["PENDING", "DISPATCHED", "BLOCKED", "ERROR"];

const OCCURRENCE_STATUS_LABELS = {
  PENDING: "Pending",
  DISPATCHED: "Dispatched",
  BLOCKED: "Blocked",
  ERROR: "Error",
};

export function getOccurrenceStatusLabel(status) {
  return OCCURRENCE_STATUS_LABELS[status] || humanizeEnum(status);
}

// DISPATCHED is deliberately "neutral", not "success" -- a dispatched
// occurrence only means Itachi successfully handed the request to Trunks.
// The exercise's own result (PASSED/FAILED/DENIED/ERROR) is a separate,
// independently-rendered SecurityExerciseRun.
const OCCURRENCE_STATUS_TONE = {
  PENDING: "neutral",
  DISPATCHED: "neutral",
  BLOCKED: "attention",
  ERROR: "danger",
};

export function getOccurrenceStatusTone(status) {
  return OCCURRENCE_STATUS_TONE[status] || "neutral";
}

const OCCURRENCE_STATUS_EXPLANATIONS = {
  PENDING: "This occurrence has not been processed yet.",
  DISPATCHED:
    "Itachi successfully requested this exercise through the same governed run path a manual request uses. See the linked run for the actual exercise result.",
  BLOCKED:
    "Itachi could not safely request this exercise -- no SecurityExerciseRun was created. This is not an exercise result.",
  ERROR: "Itachi could not complete this request due to an unexpected error. This is not an exercise result.",
};

export function getOccurrenceStatusExplanation(status) {
  return OCCURRENCE_STATUS_EXPLANATIONS[status] || "";
}

export function humanizeBlockReason(reason) {
  if (!reason) {
    return "";
  }
  return humanizeEnum(reason);
}

/**
 * Schedule create/update (POST and PATCH /security-exercises/schedules/)
 * error surfacing -- mirrors getExecutionErrorMessage's precedence (backend
 * detail first, safe fallback by status/code) rather than inventing new
 * copy for the same underlying reason codes.
 */
export function getScheduleRequestErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to reach Gait. Check your connection and try again.";
  }
  const status = error.response.status;
  if (status === 403) {
    return "You do not have permission to manage Security Exercise schedules.";
  }
  if (status === 404) {
    return error.response.data?.detail || "This schedule could not be found.";
  }
  if (status >= 500) {
    return "The Security Exercises service is unavailable right now.";
  }
  return error.response.data?.detail || "This schedule request was rejected.";
}
