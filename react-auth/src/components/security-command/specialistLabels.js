import { humanizeEnum } from "../security/securityLabels";

/**
 * B-UX4: presentation-only label maps for the backend's deterministic
 * specialist-routing-v1 vocabulary (security_agents.specialist_routing
 * .RoutingReason) and investigation-eligibility/blocked-reason vocabularies
 * (security_agents.auto_investigation.AutoInvestigationOutcome,
 * security_agents.investigation_reconciliation._SAFE_REASON_CATEGORY).
 *
 * This file translates backend-supplied enum VALUES into human-readable
 * text -- it never decides which specialist handles a finding, never maps
 * a control/threat/domain to a specialist, and never computes routing
 * itself. That mapping is backend-only (specialist_routing.py); this file
 * would still work correctly if the backend added a seventh specialist
 * tomorrow, because every label here keys off a routing REASON code, not
 * a specialist identity.
 */

const ROUTING_REASON_LABELS = {
  CONTROL_MAPPING: "Control mapping",
  THREAT_MAPPING: "Threat mapping",
  ATTACK_SURFACE_MAPPING: "Attack surface mapping",
  DOMAIN_MAPPING: "Domain mapping",
  GENERAL_FALLBACK: "General fallback",
};

export function getRoutingReasonLabel(reasonCode) {
  if (!reasonCode) {
    return "Not available";
  }
  return ROUTING_REASON_LABELS[reasonCode] || humanizeEnum(reasonCode);
}

const ROUTING_REASON_EXPLANATIONS = {
  CONTROL_MAPPING: "This finding's control maps directly to this specialist's declared domain.",
  THREAT_MAPPING: "This finding's threat category maps to this specialist's declared coverage.",
  ATTACK_SURFACE_MAPPING: "This finding's attack surface category maps to this specialist's declared coverage.",
  DOMAIN_MAPPING: "This finding's control domain maps to this specialist's declared coverage.",
  GENERAL_FALLBACK: "No specific mapping matched, so Commander routed this to the general specialist.",
};

export function getRoutingReasonExplanation(reasonCode) {
  return ROUTING_REASON_EXPLANATIONS[reasonCode] || "";
}

const INVESTIGATION_ELIGIBILITY_LABELS = {
  DISABLED: "Automatic investigation is disabled",
  UNSCOPED: "Finding predates environment scoping",
  WRONG_ENVIRONMENT: "Environment not eligible for automatic investigation",
  FINDING_NOT_ACTIONABLE: "Finding is not in an actionable state",
  CASE_NOT_TRIAGED: "Case has not reached Triaged yet",
  NO_INVESTIGATION_RECOMMENDED: "No investigation is recommended",
  ELIGIBLE: "Eligible for automatic investigation",
  ALREADY_DISPATCHED: "An investigation is already running",
  ALREADY_DIAGNOSED: "This case is already diagnosed",
  INVESTIGATION_BLOCKED: "A prior investigation attempt is blocked",
};

export function getInvestigationEligibilityLabel(outcome) {
  if (!outcome) {
    return "Unknown";
  }
  return INVESTIGATION_ELIGIBILITY_LABELS[outcome] || humanizeEnum(outcome);
}

const BLOCKED_REASON_CATEGORY_LABELS = {
  KILL_SWITCH: "Automatic AI execution is disabled",
  BUDGET_EXCEEDED: "Monthly AI budget threshold reached",
  CAPABILITY_DENIED: "The Agent Gateway denied this investigation",
  EXECUTION_FAILED: "The investigation attempt failed to execute",
  UNKNOWN_FAILURE: "The investigation could not complete",
};

export function getInvestigationBlockedReasonLabel(reasonCategory) {
  if (!reasonCategory) {
    return "The investigation could not complete for an unrecorded reason.";
  }
  return BLOCKED_REASON_CATEGORY_LABELS[reasonCategory] || humanizeEnum(reasonCategory);
}

const BLOCKED_REASON_RECOMMENDATIONS = {
  KILL_SWITCH: "Ask an administrator to re-enable automatic AI execution, or investigate manually.",
  BUDGET_EXCEEDED: "Review the AI Intelligence budget below, or investigate manually until it resets.",
  CAPABILITY_DENIED: "Review the specialist's granted authority, or investigate manually.",
  EXECUTION_FAILED: "Review recent activity for this case, or investigate manually.",
  UNKNOWN_FAILURE: "Review recent activity for this case, or investigate manually.",
};

export function getInvestigationBlockedRecommendation(reasonCategory) {
  return BLOCKED_REASON_RECOMMENDATIONS[reasonCategory] || "Review recent activity for this case, or investigate manually.";
}

export function isBudgetRelatedBlock(reasonCategory) {
  return reasonCategory === "BUDGET_EXCEEDED";
}

export function getInvestigationOriginLabel(origin) {
  if (origin === "AUTO") {
    return "Automatic";
  }
  if (origin === "MANUAL") {
    return "Manual";
  }
  return "Unknown";
}
