import React from "react";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { formatDateTime } from "../security/securityLabels";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { normalizeSecurityRoleText } from "./roleTerminology";

const TONE_BY_STATE = {
  NO_ACTION_REQUIRED: "calm",
  COMPLETE: "calm",
  ACTION_AVAILABLE: "info",
  HUMAN_APPROVAL_REQUIRED: "attention",
  BLOCKED: "danger",
  FAILED: "danger",
};

export function HumanAttentionBanner({ snapshot, isLoading, isStale, lastUpdated }) {
  const help = useSecurityHelp();
  const humanAttentionHelpTopic = help.getTopic("human_attention");

  if (isLoading && !snapshot) {
    return (
      <div className="attention-banner attention-banner--loading" role="status">
        Checking human attention state…
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const tone = TONE_BY_STATE[snapshot.human_attention_state] || "info";

  return (
    <div className={`attention-banner attention-banner--${tone}`} role="status" aria-live="polite">
      <div className="attention-banner-head">
        <div>
          <span className="attention-banner-label">{normalizeSecurityRoleText(snapshot.human_attention_label)}</span>
          {snapshot.next_available_action_label && (
            <span className="attention-banner-next">
              Next: {normalizeSecurityRoleText(snapshot.next_available_action_label)}
            </span>
          )}
        </div>
        {humanAttentionHelpTopic && (
          <SecurityInfoButton title="Human Approver Attention" content={humanAttentionHelpTopic} />
        )}
      </div>
      {snapshot.human_attention_reason && (
        <p className="attention-banner-reason">{normalizeSecurityRoleText(snapshot.human_attention_reason)}</p>
      )}
      {snapshot.human_attention_state === "HUMAN_APPROVAL_REQUIRED" && (
        <div className="attention-banner-approval-stub">
          <p>Human Review / Approval UI coming in the next milestone.</p>
        </div>
      )}
      {isStale && (
        <p className="attention-banner-stale">
          Live updates temporarily unavailable. Showing the last known state
          {lastUpdated ? ` from ${formatDateTime(lastUpdated)}` : ""}.
        </p>
      )}
    </div>
  );
}
