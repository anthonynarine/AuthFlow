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
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);
export const SEVERITIES = ["INFO", "WARNING", "HIGH", "CRITICAL"];
export const OUTCOMES = ["SUCCESS", "FAILURE", "DENIED", "REVOKED"];

export function getEventLabel(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType || "Unknown event";
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
