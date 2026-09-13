import { humanizeEnum } from "../security/securityLabels";

export const RECOMMENDATION_STATUSES = [
  "GENERATED",
  "VALIDATED",
  "REJECTED",
  "ACCEPTED",
  "DISMISSED",
  "HANDED_OFF",
];

const RECOMMENDATION_STATUS_LABELS = {
  GENERATED: "Generated",
  VALIDATED: "Ready for review",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
  DISMISSED: "Dismissed",
  HANDED_OFF: "Handed off",
};

export function getRecommendationStatusLabel(status) {
  if (!status) {
    return "Unknown status";
  }
  return RECOMMENDATION_STATUS_LABELS[status] || humanizeEnum(status);
}

const RECOMMENDATION_STATUS_TONE = {
  GENERATED: "neutral",
  VALIDATED: "attention",
  REJECTED: "danger",
  ACCEPTED: "neutral",
  DISMISSED: "neutral",
  HANDED_OFF: "success",
};

export function getRecommendationStatusTone(status) {
  return RECOMMENDATION_STATUS_TONE[status] || "neutral";
}

const RECOMMENDATION_STATUS_EXPLANATIONS = {
  GENERATED: "The Strategy Engine generated this recommendation; it has not yet passed deterministic validation.",
  VALIDATED: "This recommendation passed Gait's deterministic validation and is ready for a human to accept or dismiss.",
  REJECTED: "The AI's output did not pass Gait's deterministic validation and cannot be acted on.",
  ACCEPTED: "A human accepted this recommendation. Commander is routing it, or already has.",
  DISMISSED: "An operator dismissed this recommendation without acting on it.",
  HANDED_OFF: "Commander successfully routed this recommendation to a downstream security function.",
};

export function getRecommendationStatusExplanation(status) {
  return RECOMMENDATION_STATUS_EXPLANATIONS[status] || "";
}

export const HANDOFF_STATUSES = ["REQUESTED", "COMPLETED", "DENIED", "ERROR"];

const HANDOFF_STATUS_LABELS = {
  REQUESTED: "Requested",
  COMPLETED: "Completed",
  DENIED: "Denied",
  ERROR: "Error",
};

export function getHandoffStatusLabel(status) {
  if (!status) {
    return "Unknown status";
  }
  return HANDOFF_STATUS_LABELS[status] || humanizeEnum(status);
}

const HANDOFF_STATUS_TONE = {
  REQUESTED: "neutral",
  COMPLETED: "success",
  DENIED: "danger",
  ERROR: "danger",
};

export function getHandoffStatusTone(status) {
  return HANDOFF_STATUS_TONE[status] || "neutral";
}

const HANDOFF_STATUS_EXPLANATIONS = {
  REQUESTED: "Commander received this recommendation and is routing it.",
  COMPLETED: "Commander successfully routed this recommendation downstream.",
  DENIED: "Commander attempted to route this recommendation, but downstream governance denied execution.",
  ERROR: "Commander could not complete the downstream request.",
};

export function getHandoffStatusExplanation(status) {
  return HANDOFF_STATUS_EXPLANATIONS[status] || "";
}

export const RECOMMENDATION_TYPES = [
  "INVESTIGATE",
  "RUN_PENTEST_CAMPAIGN",
  "RUN_SECURITY_ASSESSMENT",
  "REVIEW_CONTROL_COVERAGE",
  "NO_ACTION",
];

const RECOMMENDATION_TYPE_LABELS = {
  INVESTIGATE: "Investigate",
  RUN_PENTEST_CAMPAIGN: "Run Pentest Campaign",
  RUN_SECURITY_ASSESSMENT: "Run Security Assessment",
  REVIEW_CONTROL_COVERAGE: "Review Control Coverage",
  NO_ACTION: "No Action",
};

export function getRecommendationTypeLabel(type) {
  if (!type) {
    return "Unknown recommendation type";
  }
  return RECOMMENDATION_TYPE_LABELS[type] || humanizeEnum(type);
}

const COMMANDER_INTENT_ACTOR_LABELS = {
  INVESTIGATE: "Blue Team",
  RUN_PENTEST_CAMPAIGN: "Red Team / Pentest Campaign",
  RUN_SECURITY_ASSESSMENT: "Security Assessment Engine",
  REVIEW_CONTROL_COVERAGE: "Control Review (read-only)",
  NO_ACTION: "No downstream action",
};

export function getCommanderIntentActorLabel(commanderIntent) {
  if (!commanderIntent) {
    return "Unknown route";
  }
  return COMMANDER_INTENT_ACTOR_LABELS[commanderIntent] || humanizeEnum(commanderIntent);
}

/**
 * StrategyCommanderHandoff.failure_reason is a compound "CODE:detail"
 * string (truncated to 128 chars server-side), not a flat enum. Split on
 * the first colon only -- a detail string may itself contain colons.
 */
export function parseFailureReason(failureReason) {
  if (!failureReason) {
    return { code: null, detail: null };
  }
  const separatorIndex = failureReason.indexOf(":");
  if (separatorIndex === -1) {
    return { code: failureReason, detail: null };
  }
  return {
    code: failureReason.slice(0, separatorIndex),
    detail: failureReason.slice(separatorIndex + 1) || null,
  };
}

const FAILURE_REASON_CODE_EXPLANATIONS = {
  STALE_RECOMMENDATION:
    "This recommendation is no longer valid because the underlying security state (attack surface, threat, or control) changed.",
  DOWNSTREAM_REQUEST_DENIED: "Commander routed the request, but downstream governance denied execution.",
  DOWNSTREAM_REQUEST_ERROR: "Commander could not complete the downstream request.",
  MALFORMED_RECOMMENDED_CAMPAIGN: "The recommended campaign reference was incomplete and could not be routed.",
  MALFORMED_RECOMMENDED_ASSESSMENTS: "The recommended assessment reference was incomplete and could not be routed.",
  INVESTIGATE_REQUIRES_FINDING: "This investigation could not be routed because no finding could be resolved.",
};

export function getFailureReasonCodeExplanation(code) {
  return FAILURE_REASON_CODE_EXPLANATIONS[code] || "";
}

const ACCEPT_ERROR_CODE_EXPLANATIONS = {
  RECOMMENDATION_NOT_VALIDATED: "This recommendation has not passed validation and cannot be accepted.",
  RECOMMENDATION_ALREADY_DISMISSED: "This recommendation was dismissed and cannot be accepted.",
  RECOMMENDATION_NOT_FOUND: "This recommendation no longer exists.",
  REQUESTER_NOT_AUTHORIZED: "You are not authorized to accept this recommendation.",
  STALE_RECOMMENDATION:
    "This recommendation is no longer valid because the underlying security state changed. Generate a new recommendation.",
};

export function getAcceptErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to reach Gait. Check your connection and try again.";
  }
  const code = error.response.data?.error;
  if (code && ACCEPT_ERROR_CODE_EXPLANATIONS[code]) {
    return ACCEPT_ERROR_CODE_EXPLANATIONS[code];
  }
  if (error.response.status === 403) {
    return "You do not have permission to accept this recommendation.";
  }
  return error.response.data?.detail || "This recommendation could not be accepted.";
}

export function getGenerateErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to reach Gait. Check your connection and try again.";
  }
  if (error.response.status === 403) {
    return "You do not have permission to request a strategy recommendation.";
  }
  return error.response.data?.detail || "Gait could not generate a strategy recommendation for this finding.";
}

export function getDismissErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (!error.response) {
    return "Unable to reach Gait. Check your connection and try again.";
  }
  if (error.response.status === 403) {
    return "You do not have permission to dismiss this recommendation.";
  }
  return error.response.data?.detail || "This recommendation could not be dismissed.";
}
