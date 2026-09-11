import { humanizeEnum } from "../security/securityLabels";

export const RUN_STATUSES = [
  "REQUESTED",
  "AUTHORIZED",
  "RUNNING",
  "PASSED",
  "FAILED",
  "DENIED",
  "ERROR",
  "CANCELLED",
];

export const TERMINAL_RUN_STATUSES = ["PASSED", "FAILED", "DENIED", "ERROR", "CANCELLED"];
export const ACTIVE_RUN_STATUSES = ["REQUESTED", "AUTHORIZED", "RUNNING"];

export function isTerminalRunStatus(status) {
  return TERMINAL_RUN_STATUSES.includes(status);
}

export function isActiveRunStatus(status) {
  return ACTIVE_RUN_STATUSES.includes(status);
}

const RUN_STATUS_TONE = {
  REQUESTED: "neutral",
  AUTHORIZED: "neutral",
  RUNNING: "neutral",
  PASSED: "success",
  FAILED: "danger",
  DENIED: "attention",
  ERROR: "attention",
  CANCELLED: "neutral",
};

export function getRunStatusTone(status) {
  return RUN_STATUS_TONE[status] || "neutral";
}

const RUN_STATUS_LABELS = {
  REQUESTED: "Requested",
  AUTHORIZED: "Authorized",
  RUNNING: "Running",
  PASSED: "Passed",
  FAILED: "Failed",
  DENIED: "Denied",
  ERROR: "Error",
  CANCELLED: "Cancelled",
};

export function getRunStatusLabel(status) {
  return RUN_STATUS_LABELS[status] || humanizeEnum(status);
}

/**
 * PASSED, FAILED, DENIED, and ERROR read as unmistakably different
 * outcomes with different causes (B-RED1C section 30). None of these
 * imply Security Truth -- a run result is exercise lineage, not a
 * control verdict.
 */
const RUN_STATUS_EXPLANATIONS = {
  REQUESTED: "Requested. Waiting on Incident Commander / Gateway authorization.",
  AUTHORIZED: "Authorized. Gait governance approved this request; the bounded probe has not started yet.",
  RUNNING: "Running. The bounded probe is executing now.",
  PASSED: "The exercise demonstrated the expected secure behavior. The targeted protection held under this bounded probe.",
  FAILED: "The expected security protection was not satisfied. The exercise demonstrated a real gap.",
  DENIED: "Gait governance prevented execution. This says nothing about whether the targeted protection works -- the exercise itself was not authorized to run.",
  ERROR: "The probe could not establish a result. This is not a pass or a fail -- no verdict was reached.",
  CANCELLED: "This exercise was cancelled before it reached a result.",
};

export function getRunStatusExplanation(status) {
  return RUN_STATUS_EXPLANATIONS[status] || "";
}

export function getNetworkErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to reach Gait. Check your connection and try again.";
  }
  if (error.response.status === 403) {
    return "You do not have permission to run Security Exercises.";
  }
  if (error.response.status >= 500) {
    return "The Security Exercises service is unavailable right now.";
  }
  return error.response.data?.detail || "Unable to load Security Exercises data.";
}

/**
 * B-RED1C.1 (Trunks): the three idempotency-specific error codes the
 * governed run-creation endpoint can return.
 */
export const IDEMPOTENCY_KEY_CONFLICT = "IDEMPOTENCY_KEY_CONFLICT";
export const IDEMPOTENCY_KEY_REQUIRED = "IDEMPOTENCY_KEY_REQUIRED";
export const IDEMPOTENCY_KEY_INVALID = "IDEMPOTENCY_KEY_INVALID";

export function getExecutionErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to refresh exercise status. The request did not reach Gait.";
  }
  const status = error.response.status;
  const code = error.response.data?.error;

  if (code === IDEMPOTENCY_KEY_CONFLICT) {
    return "This request identifier was already used for a different exercise request. Start a new run.";
  }
  if (code === IDEMPOTENCY_KEY_REQUIRED || code === IDEMPOTENCY_KEY_INVALID) {
    // Should never happen once this integration is correct -- it means a
    // request left the client without a valid Idempotency-Key. Keep the
    // backend's own detail for diagnosability rather than masking it.
    return (
      error.response.data?.detail ||
      "This submission was missing a valid request identifier. Please try again; contact support if this persists."
    );
  }
  if (status === 403) {
    return "You do not have permission to run Security Exercises.";
  }
  if (status === 400) {
    return error.response.data?.detail || "This exercise request was rejected.";
  }
  if (status >= 500) {
    return "The Security Exercises service is unavailable right now.";
  }
  return error.response.data?.detail || "Unable to submit this exercise.";
}

export const PLAYBOOK_STATUS_LABELS = {
  IMPLEMENTED: "Ready",
  PLANNED: "Planned",
  DISABLED: "Disabled",
};

export function getPlaybookStatusLabel(status) {
  return PLAYBOOK_STATUS_LABELS[status] || humanizeEnum(status);
}

export function getPlaybookStatusTone(status) {
  if (status === "IMPLEMENTED") {
    return "success";
  }
  if (status === "DISABLED") {
    return "danger";
  }
  return "neutral";
}

const CATEGORY_LABELS = {
  AUTHENTICATION: "Authentication",
  AUTHORIZATION: "Authorization",
  TENANCY: "Tenancy",
  ABUSE_RESISTANCE: "Abuse Resistance",
  AGENT_SECURITY: "Agent Security",
  DEPLOYMENT_SECURITY: "Deployment Security",
  APPLICATION_SECURITY: "Application Security",
};

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || humanizeEnum(category);
}

export function environmentLabel(env) {
  if (!env) {
    return "—";
  }
  return String(env).charAt(0).toUpperCase() + String(env).slice(1);
}

/**
 * B-RED1C section 33: no PRODUCTION option anywhere in this execution UI,
 * even if a backend response somehow advertises it.
 */
export function getSafeEnvironments(allowedEnvironments) {
  const list = Array.isArray(allowedEnvironments) ? allowedEnvironments : [];
  return list.filter((env) => env !== "production");
}

export function hasUnsafeProductionEnvironment(allowedEnvironments) {
  const list = Array.isArray(allowedEnvironments) ? allowedEnvironments : [];
  return list.includes("production");
}

/**
 * A playbook is genuinely runnable from this UI only when the backend
 * marked it executable AND it has at least one non-production environment
 * to run against. `executable` alone is trusted for the READY/PLANNED
 * distinction; this additional check is the production fail-safe.
 */
export function isSafelyExecutable(playbook) {
  if (!playbook?.executable) {
    return false;
  }
  return getSafeEnvironments(playbook.allowed_environments).length > 0;
}

/**
 * Gait Security Exercise access is `is_staff` only -- it is Gait security
 * authorization, not Lumen/business role gating. `user.role` (admin /
 * physician / technologist) is Lumen's own role model and must never gate
 * Minato: a `role: "technologist"` user with `is_staff: true` is a
 * legitimate Gait operator.
 *
 * This is a UX-only mirror of the backend policy, never a security
 * boundary: POST /security-exercises/runs/ is authorized again, and
 * independently, by CanRunSecurityExercise itself.
 */
export function canRunSecurityExercises(user) {
  return Boolean(user?.is_staff);
}
