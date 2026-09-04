export const EVENT_TYPE_LABELS = {
  LOGIN_SUCCESS: "Login successful",
  LOGIN_FAILURE: "Login failed",
  MFA_SUCCESS: "MFA verification successful",
  MFA_FAILURE: "MFA verification failed",
  SESSION_CREATED: "Session created",
  SESSION_REVOKED: "Session revoked",
  LOGOUT: "Logout",
  LOGOUT_ALL: "All sessions logged out",
  TOKEN_REFRESHED: "Credentials refreshed",
  REFRESH_REPLAY_DETECTED: "Refresh token replay detected",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET_COMPLETED: "Password reset completed",
  INACTIVE_USER_DENIED: "Inactive user denied",
  SESSION_ACCESS_DENIED: "Session access denied",
  PASSWORD_CHANGE_SUCCESS: "Password changed successfully",
  PASSWORD_CHANGE_FAILURE: "Password change failed",
  REAUTH_SUCCESS: "Step-up reauthentication successful",
  REAUTH_FAILURE: "Step-up reauthentication failed",
  MFA_ENABLED: "Two-factor enabled",
  MFA_DISABLED: "Two-factor disabled",
  MFA_CHANGE_DENIED: "Two-factor change denied",
  ACCOUNT_DISABLED: "Account disabled",
  STEP_UP_REQUIRED: "Additional verification required",
  STEP_UP_SUCCESS: "Step-up verification successful",
  STEP_UP_FAILURE: "Step-up verification failed",
  LOGIN_THROTTLED: "Login throttled",
  LOGIN_BLOCKED: "Login temporarily blocked",
  OTP_THROTTLED: "OTP verification throttled",
  OTP_BLOCKED: "OTP verification blocked",
  PASSWORD_RESET_THROTTLED: "Password reset throttled",
  REAUTH_THROTTLED: "Reauthentication throttled",
  MFA_CHANGE_THROTTLED: "Two-factor change throttled",
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);
export const SEVERITIES = ["INFO", "WARNING", "HIGH", "CRITICAL"];
export const OUTCOMES = ["SUCCESS", "FAILURE", "DENIED", "REVOKED"];

export function getEventLabel(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType || "Unknown event";
}

export function getShortEventLabel(eventType) {
  if (eventType === "REFRESH_REPLAY_DETECTED") {
    return "Replay detected";
  }

  return getEventLabel(eventType);
}

export function humanizeEnum(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatUser(user) {
  if (!user) {
    return "—";
  }

  if (typeof user === "string") {
    return user;
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email || user.username || user.id || "—";
}

export function formatUserEmail(user) {
  if (!user) {
    return "—";
  }

  if (typeof user !== "object") {
    return String(user);
  }

  return user.email
    || user.full_name
    || user.name
    || user.user_email
    || user.username
    || user.id
    || "—";
}

export function getRecordUserEmail(record) {
  if (!record) {
    return "—";
  }

  const directValue = record.user_email
    || record.email
    || record.username
    || record.actor_email
    || record.actor_username
    || record.subject_email
    || record.subject_username;

  if (directValue) {
    return String(directValue);
  }

  return formatUserEmail(record.user || record.actor || record.subject || record.user_id);
}

export function formatSessionId(value) {
  if (!value) {
    return "—";
  }

  const sessionId = typeof value === "object"
    ? value.uuid || value.id || value.session_id
    : value;

  if (!sessionId) {
    return "—";
  }

  const text = String(sessionId);
  return text.length > 12 ? `${text.slice(0, 8)}…${text.slice(-4)}` : text;
}

export function getSessionStatus(session) {
  if (session?.revoked_at) {
    return "REVOKED";
  }

  if (session?.expires_at) {
    const expiresAt = new Date(session.expires_at);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date()) {
      return "EXPIRED";
    }
  }

  return "ACTIVE";
}

export function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: data?.results || [],
    count: data?.count || 0,
    next: data?.next || null,
    previous: data?.previous || null,
  };
}
