import React from "react";
import { humanizeEnum } from "../security/securityLabels";
import { normalizeSecurityRoleText } from "./roleTerminology";

const TONE_BY_ACTION_STATUS = {
  DISPATCHED: "success",
  ALREADY_COMPLETE: "neutral",
  SUGGESTED: "neutral",
  NOT_ELIGIBLE: "attention",
  DENIED: "danger",
  FAILED: "danger",
};

const LABEL_BY_ACTION_STATUS = {
  DISPATCHED: "Dispatched",
  ALREADY_COMPLETE: "Already complete",
  SUGGESTED: "Suggested next step",
  NOT_ELIGIBLE: "Not eligible",
  DENIED: "Denied",
  FAILED: "Failed",
};

function decisionSentence(response, actionStatus) {
  const specialist = response?.specialist ? normalizeSecurityRoleText(response.specialist) : null;
  const reason = normalizedDecisionReason(response?.decision_reason);

  if (actionStatus === "DISPATCHED" && specialist) {
    return `Incident Commander dispatched ${specialist}.`;
  }
  if (actionStatus === "DISPATCHED") {
    return "Incident Commander accepted the request.";
  }
  if (actionStatus === "DENIED" && reason) {
    return `Incident Commander denied the request because ${reason}.`;
  }
  if (actionStatus === "NOT_ELIGIBLE" && reason) {
    return `Incident Commander cannot dispatch that step because ${reason}.`;
  }
  if (actionStatus === "ALREADY_COMPLETE") {
    return "Incident Commander found that step already complete.";
  }
  if (actionStatus === "SUGGESTED" && specialist) {
    return `Incident Commander suggested ${specialist} as the next eligible step.`;
  }
  if (actionStatus === "FAILED") {
    return "Incident Commander could not complete the request.";
  }
  return `Incident Commander returned ${normalizeSecurityRoleText(humanizeEnum(actionStatus))}.`;
}

function normalizedDecisionReason(reason) {
  if (!reason) {
    return null;
  }
  return normalizeSecurityRoleText(humanizeEnum(reason)).replace(/\b(Required|Incomplete|Complete)\b/g, (match) =>
    match.toLowerCase()
  );
}

/**
 * Renders what Incident Commander actually decided about an operational request, so
 * an operator never has to guess whether Copilot merely answered a question
 * or Incident Commander evaluated / dispatched a specialist.
 */
export function CommanderDecision({ response }) {
  const actionStatus = response?.action_status;
  if (!actionStatus || actionStatus === "NO_ACTION") {
    return null;
  }

  const tone = TONE_BY_ACTION_STATUS[actionStatus] || "neutral";
  const label = LABEL_BY_ACTION_STATUS[actionStatus] || humanizeEnum(actionStatus);
  const sentence = decisionSentence(response, actionStatus);

  return (
    <div className={`commander-decision commander-decision--${tone}`}>
      <div className="commander-decision-head">
        <span className="commander-decision-label">Incident Commander</span>
        <span className={`commander-decision-badge commander-decision-badge--${tone}`}>{label}</span>
        {response.specialist && (
          <span className="commander-decision-specialist">{normalizeSecurityRoleText(response.specialist)}</span>
        )}
      </div>
      <p className="commander-decision-summary">{sentence}</p>
      {response.decision_reason && (
        <p className="commander-decision-reason">
          Reason: {normalizedDecisionReason(response.decision_reason)}
        </p>
      )}
      {Array.isArray(response.sources) && response.sources.length > 0 && (
        <details className="commander-decision-sources">
          <summary>Sources ({response.sources.length})</summary>
          <ul>
            {response.sources.map((source) => (
              <li key={`${source.type}:${source.id}`}>
                {source.type} #{source.id}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
