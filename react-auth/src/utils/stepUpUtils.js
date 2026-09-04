export const STEP_UP_REQUIRED_CODE = "STEP_UP_REQUIRED";

export function isStepUpRequiredError(error) {
  return error?.response?.status === 403 && error?.response?.data?.code === STEP_UP_REQUIRED_CODE;
}

export function getStepUpRequirement(error, fallbackStrength = "password") {
  const data = error?.response?.data || {};

  return {
    code: data.code || STEP_UP_REQUIRED_CODE,
    reason: data.reason || "RECENT_AUTH_REQUIRED",
    requiredStrength: data.required_strength || fallbackStrength,
    currentStrength: data.current_strength || null,
    authAgeSeconds: Number.isFinite(data.auth_age_seconds) ? data.auth_age_seconds : null,
    maxAuthAgeSeconds: Number.isFinite(data.max_auth_age_seconds) ? data.max_auth_age_seconds : null,
    operation: data.operation || null,
  };
}

export function parseRetryAfter(headerValue) {
  if (!headerValue) {
    return null;
  }

  const numericValue = Number(headerValue);
  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.round(numericValue));
  }

  const retryDate = Date.parse(headerValue);
  if (Number.isNaN(retryDate)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

export function formatRetryAfter(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (!remainder) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"} ${remainder} second${remainder === 1 ? "" : "s"}`;
}

export function getStepUpTitle(requiredStrength) {
  return requiredStrength === "mfa"
    ? "Additional verification required"
    : "Additional verification required";
}

export function getStepUpPrompt(requiredStrength, actionLabel) {
  const actionText = actionLabel ? ` before continuing with ${actionLabel}` : "";

  if (requiredStrength === "mfa") {
    return `For your security, enter your current password and authenticator code${actionText}.`;
  }

  return `For your security, enter your current password${actionText}.`;
}

export function getStepUpSuccessMessage(actionLabel) {
  return actionLabel
    ? `Verification successful. You can now continue with ${actionLabel}.`
    : "Verification successful. You can continue.";
}

export function getStepUpFailureMessage(requiredStrength) {
  return requiredStrength === "mfa"
    ? "The password or authenticator code was not accepted. Please try again."
    : "The current password was not accepted. Please try again.";
}

export function getStepUpThrottleMessage(retryAfterSeconds) {
  const retryText = formatRetryAfter(retryAfterSeconds);
  if (retryText) {
    return `Too many verification attempts. Try again in ${retryText}.`;
  }

  return "Too many verification attempts. Try again shortly.";
}
