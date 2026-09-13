/**
 * The security architecture docs page is server-rendered HTML served
 * directly by django_auth (Mermaid diagrams, pan/zoom), not a client-side
 * route -- a plain external link. Derived from the same env vars
 * src/interceptors/axios.js uses for its own baseURL, read directly
 * (not via the axios instance) so this widely-shared, previously
 * axios-free utility module doesn't drag the real, Jest-unmockable axios
 * package into every file that imports it.
 */
export function getSecurityArchitectureDocsUrl() {
  const apiBase =
    process.env.REACT_APP_USE_PRODUCTION_API === "true"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEV_URL;
  return `${(apiBase || "").replace(/\/api\/?$/, "")}/docs/security/architecture/`;
}

/**
 * B-OBS-ENV1: Security Truth (posture/domains) is now scoped by deployment
 * environment ("local"|"test"|"ci"|"staging"|"production") and the backend
 * requires this query param -- there is no server-side default. This app
 * only ever talks to one backend at a time (dev or production, chosen by
 * REACT_APP_USE_PRODUCTION_API, same as getSecurityArchitectureDocsUrl()
 * above), so the environment follows that same switch rather than needing
 * its own separate setting.
 */
export function getSecurityTruthEnvironment() {
  return process.env.REACT_APP_USE_PRODUCTION_API === "true" ? "production" : "local";
}

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

export const CONTROL_STATUSES = ["HEALTHY", "NEEDS_ATTENTION", "CONTROL_FAILURE", "UNKNOWN", "NOT_APPLICABLE"];

export const CONTROL_STATUS_LABELS = {
  HEALTHY: "Healthy",
  NEEDS_ATTENTION: "Needs attention",
  CONTROL_FAILURE: "Control failure",
  UNKNOWN: "Unknown",
  NOT_APPLICABLE: "Not applicable",
};

export function getControlStatusLabel(status) {
  return CONTROL_STATUS_LABELS[status] || humanizeEnum(status);
}

export const CONTROL_TYPES = ["LIVE", "PERIODIC", "DOCUMENTARY", "MANUAL"];

export const CONTROL_TYPE_LABELS = {
  LIVE: "Live",
  PERIODIC: "Periodic",
  DOCUMENTARY: "Documentary",
  MANUAL: "Manual",
};

const CONTROL_TYPE_DESCRIPTIONS = {
  LIVE: "Continuously or operationally evaluated.",
  PERIODIC: "Evaluated on a recurring schedule.",
  DOCUMENTARY: "Supported primarily by policy or document evidence.",
  MANUAL: "Requires deliberate human verification.",
};

export function getControlTypeLabel(type) {
  return CONTROL_TYPE_LABELS[type] || humanizeEnum(type);
}

export function getControlTypeDescription(type) {
  return CONTROL_TYPE_DESCRIPTIONS[type] || "";
}

export function getControlTypeGlossary() {
  return CONTROL_TYPES.map((type) => [getControlTypeLabel(type), getControlTypeDescription(type)]);
}

/**
 * SecurityControl.Domain has 19 fine-grained values (security/models.py) --
 * more categories than a first-time operator can be expected to already
 * know. Keyed by the human-readable domain_label the backend already sends
 * (not the raw enum key, which the controls list payload doesn't expose),
 * these are plain-language glossary entries, not a redefinition of any
 * specific control -- individual control titles/descriptions remain
 * backend-authoritative.
 */
const CONTROL_DOMAIN_DESCRIPTIONS = {
  Identity: "Who a user is and how their identity is established.",
  Session: "How a logged-in session is created, tracked, and ended.",
  "Multi-factor authentication": "A second proof of identity beyond just a password.",
  "Authentication assurance": "How confident Gait is that a login attempt is genuinely the real user.",
  "Abuse control": "Preventing or throttling malicious or excessive request patterns.",
  Audit: "Recording what happened so it can be reviewed later.",
  Authorization: "What an authenticated user or agent is allowed to do.",
  "Data protection": "Keeping stored and transmitted data safe from exposure.",
  Database: "Security properties of the database layer itself.",
  Infrastructure: "Security of the servers, network, and hosting environment.",
  "Backup & recovery": "Whether data can be restored if something goes wrong.",
  "Incident response": "How Gait detects and reacts to a live security incident.",
  Monitoring: "Ongoing visibility into what the system is doing.",
  "Secure SDLC": "Security built into how code is written and shipped, not bolted on after.",
  "Vulnerability management": "Finding and tracking known weaknesses before they're exploited.",
  Governance: "Policies and oversight for how security decisions get made.",
  "Vendor risk": "Security risk introduced by third-party services Gait depends on.",
  "Compliance evidence": "Proof needed to satisfy a regulatory or contractual requirement.",
  "Agent security": "Constraints on what Gait's own AI/automation agents are allowed to do.",
};

export function getControlDomainDescription(domainLabel) {
  return CONTROL_DOMAIN_DESCRIPTIONS[domainLabel] || "";
}

export function getControlDomainGlossary() {
  return Object.entries(CONTROL_DOMAIN_DESCRIPTIONS);
}

export const EVIDENCE_RESULTS = ["PASS", "FAIL", "WARNING", "INFORMATIONAL"];

export const EVIDENCE_RESULT_LABELS = {
  PASS: "Pass",
  FAIL: "Fail",
  WARNING: "Warning",
  INFORMATIONAL: "Informational",
};

export function getEvidenceResultLabel(result) {
  return EVIDENCE_RESULT_LABELS[result] || humanizeEnum(result);
}

export const EVIDENCE_TYPES = [
  "SECURITY_EVENT",
  "AUTOMATED_TEST",
  "CI_RESULT",
  "CONFIGURATION_CHECK",
  "MANUAL_VERIFICATION",
  "POLICY_REVIEW",
  "RISK_ASSESSMENT",
  "BACKUP_TEST",
  "RESTORE_TEST",
  "VULNERABILITY_SCAN",
  "PENETRATION_TEST",
  "VENDOR_REVIEW",
  "INCIDENT_EXERCISE",
  "OTHER",
];

export const EVIDENCE_TYPE_LABELS = {
  SECURITY_EVENT: "Security event",
  AUTOMATED_TEST: "Automated test",
  CI_RESULT: "CI result",
  CONFIGURATION_CHECK: "Configuration check",
  MANUAL_VERIFICATION: "Manual verification",
  POLICY_REVIEW: "Policy review",
  RISK_ASSESSMENT: "Risk assessment",
  BACKUP_TEST: "Backup test",
  RESTORE_TEST: "Restore test",
  VULNERABILITY_SCAN: "Vulnerability scan",
  PENETRATION_TEST: "Penetration test",
  VENDOR_REVIEW: "Vendor review",
  INCIDENT_EXERCISE: "Incident exercise",
  OTHER: "Other",
};

export function getEvidenceTypeLabel(type) {
  return EVIDENCE_TYPE_LABELS[type] || humanizeEnum(type);
}

export const FINDING_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "ACCEPTED_RISK", "FALSE_POSITIVE"];

export const FINDING_STATUS_LABELS = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
  ACCEPTED_RISK: "Accepted risk",
  FALSE_POSITIVE: "False positive",
};

export function getFindingStatusLabel(status) {
  return FINDING_STATUS_LABELS[status] || humanizeEnum(status);
}

export function isEvidenceExpired(evidence) {
  if (evidence?.is_stale !== undefined && evidence?.is_stale !== null) {
    return Boolean(evidence.is_stale);
  }

  if (!evidence?.valid_until) {
    return false;
  }

  const validUntil = new Date(evidence.valid_until);
  return !Number.isNaN(validUntil.getTime()) && validUntil <= new Date();
}

export function formatShortId(value) {
  if (!value) {
    return "—";
  }

  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 8)}…${text.slice(-4)}` : text;
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
