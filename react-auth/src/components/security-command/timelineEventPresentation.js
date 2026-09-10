import { humanizeEnum } from "../security/securityLabels";
import { normalizeSecurityRoleText } from "./roleTerminology";

/**
 * Presentation-only shortening of backend workflow-event summaries. This
 * never changes event identifiers, actor names, or outcomes — the backend
 * already writes most agent-lifecycle summaries concisely, so most events pass through with
 * only trailing-period trimming. Only the couple of genuinely verbose event
 * types get a shorter presentation label; the full backend summary always
 * remains available in the event's expandable technical details.
 */
export function getConciseEventLabel(event) {
  const type = event?.event_type || "";

  if (type.startsWith("CASE_TRANSITION_")) {
    if (!type.endsWith("ALLOW")) {
      return "Dispatch blocked";
    }
    const dispatchLabels = {
      INVESTIGATING: "Blue Team dispatched",
      DIAGNOSED: "Blue Team completed diagnosis",
      REPAIRING: "Green Team dispatched",
      REPAIR_PROPOSED: "Green Team prepared repair",
      VALIDATING: "Security Validator dispatched",
      AWAITING_DEPLOY_APPROVAL: "Human Approver review required",
      DEPLOY_AUTHORIZED: "Release Engineer authorized",
      DEPLOYING: "Release Engineer started deployment",
    };
    return dispatchLabels[event?.status] || `${normalizeSecurityRoleText(humanizeEnum(event.status))} now available`;
  }

  if (type === "REPAIR_PROPOSAL_CREATED") {
    return "Repair prepared";
  }

  if (type === "VALIDATION_REPORT_CREATED") {
    return "Validation completed";
  }

  if (type === "DEPLOYMENT_APPROVED") {
    return "Exact artifact approved";
  }

  if (type === "DEPLOYMENT_STARTED") {
    return "Deployment started";
  }

  if (type === "DEPLOYMENT_SUCCEEDED") {
    return "Release completed";
  }

  if (type.startsWith("POST_DEPLOY_VERIFICATION")) {
    return "Post-deploy evidence evaluated";
  }

  if (type === "SECURITY_CONTROL_EVALUATED" || type === "CONTROL_EVALUATED") {
    return "Control";
  }

  const summary = (event?.summary || "").trim().replace(/\.$/, "");
  return normalizeSecurityRoleText(summary || humanizeEnum(type));
}

const OUTCOME_EVENT_TYPES = new Set([
  "RED_TEAM_REPRODUCED",
  "VALIDATION_REPORT_CREATED",
  "DEPLOYMENT_FAILED",
  "SECURITY_CONTROL_EVALUATED",
  "CONTROL_EVALUATED",
]);

const EXACT_OUTCOMES = new Set([
  "VALID",
  "INVALID",
  "INCONCLUSIVE",
  "REPRODUCED",
  "FAILED",
  "BLOCKED",
  "HEALTHY",
  "NEEDS_ATTENTION",
  "CONTROL_FAILURE",
  "UNKNOWN",
]);

/** The trusted, exact outcome for events where the result matters (VALID,
 * INVALID, INCONCLUSIVE, REPRODUCED, ...) — never softened into generic
 * "finished" language. Returns null for events with no meaningful verdict. */
export function getEventOutcome(event) {
  const type = event?.event_type || "";
  if (!OUTCOME_EVENT_TYPES.has(type) || !EXACT_OUTCOMES.has(event?.status)) {
    return null;
  }
  return event.status;
}

const STAGE_BY_CATEGORY = {
  SECURITY: "Detection",
  COMMANDER: "Coordination",
  AGENT: "Specialist Activity",
  REPAIR: "Repair",
  VALIDATION: "Validation",
  APPROVAL: "Human Approver Review",
  DEPLOYMENT: "Deployment",
  VERIFICATION: "Verification",
};

export function getEventStage(event) {
  return STAGE_BY_CATEGORY[event?.category] || null;
}
