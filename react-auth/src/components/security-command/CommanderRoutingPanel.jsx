import React from "react";
import { getRoutingReasonExplanation, getRoutingReasonLabel } from "./specialistLabels";

function fallbackLabel(fallbackUsed) {
  if (fallbackUsed === true) {
    return "Yes";
  }
  if (fallbackUsed === false) {
    return "No";
  }
  return "Not available";
}

/**
 * B-UX4: Commander routing provenance for the specialist assigned to a
 * case -- "who was assigned, and why." Every field is backend-supplied
 * (security_agents.auto_investigation.get_case_specialist_provenance);
 * this component performs no routing computation of its own and does not
 * reproduce specialist-routing-v1's control/threat/domain mappings.
 *
 * `routingReasonCode`/`fallbackUsed` are only known for a routing PREVIEW
 * (no investigation has been dispatched yet) -- once a specialist has
 * actually been dispatched, the backend reports the authoritative
 * specialist but not a fresh routing reason, since re-running the router
 * after the fact would not describe what actually happened.
 */
export function CommanderRoutingPanel({ specialistDisplayName, routingReasonCode, routingVersion, fallbackUsed, isPreview }) {
  if (!specialistDisplayName) {
    return null;
  }

  const reasonLabel = getRoutingReasonLabel(routingReasonCode);
  const reasonExplanation = getRoutingReasonExplanation(routingReasonCode);

  return (
    <dl className="commander-routing-panel-facts">
      <div>
        <dt>Assigned to</dt>
        <dd>{specialistDisplayName}</dd>
      </div>
      <div>
        <dt>Routing reason</dt>
        <dd>
          {reasonLabel}
          {isPreview && !routingReasonCode ? " (preview)" : ""}
        </dd>
      </div>
      {routingVersion && (
        <div>
          <dt>Router</dt>
          <dd>{routingVersion}</dd>
        </div>
      )}
      <div>
        <dt>Fallback</dt>
        <dd>{fallbackLabel(fallbackUsed)}</dd>
      </div>
      {reasonExplanation && <p className="commander-routing-panel-explanation">{reasonExplanation}</p>}
    </dl>
  );
}

export default CommanderRoutingPanel;
