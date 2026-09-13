import React from "react";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { normalizeSecurityRoleText } from "./roleTerminology";
import {
  getCommanderIntentActorLabel,
  getFailureReasonCodeExplanation,
  getHandoffStatusExplanation,
  getHandoffStatusLabel,
  getHandoffStatusTone,
  getRecommendationTypeLabel,
  parseFailureReason,
} from "./strategyLabels";

export function CommanderHandoffCard({ recommendation }) {
  if (!recommendation) {
    return null;
  }

  const handoff = recommendation.commander_handoff;
  const actorLabel = getCommanderIntentActorLabel(recommendation.recommendation_type);

  if (!handoff) {
    if (recommendation.recommendation_type === "NO_ACTION" && recommendation.status === "ACCEPTED") {
      return (
        <div className="commander-handoff-card commander-handoff-empty">
          <p className="strategy-recommendation-eyebrow">Commander</p>
          <p>Strategy review found no recommended governed action.</p>
        </div>
      );
    }
    return (
      <div className="commander-handoff-card commander-handoff-empty">
        <p className="strategy-recommendation-eyebrow">Commander</p>
        <p>This recommendation has not been accepted.</p>
      </div>
    );
  }

  const tone = getHandoffStatusTone(handoff.status);
  const isTerminalFailure = handoff.status === "DENIED" || handoff.status === "ERROR";
  const { code, detail } = parseFailureReason(handoff.failure_reason);

  return (
    <div className="commander-handoff-card">
      <p className="strategy-recommendation-eyebrow">Commander</p>
      <dl className="commander-handoff-facts">
        <div>
          <dt>Received</dt>
          <dd>{getRecommendationTypeLabel(recommendation.recommendation_type)}</dd>
        </div>
        <div>
          <dt>Routed to</dt>
          <dd>{actorLabel}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`security-badge tone-${tone}`}>{getHandoffStatusLabel(handoff.status)}</span>
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatDateTime(handoff.completed_at || handoff.created_at)}</dd>
        </div>
      </dl>

      <p className="commander-handoff-status-note">{getHandoffStatusExplanation(handoff.status)}</p>

      {handoff.status === "COMPLETED" && handoff.case_id && (
        <p className="commander-handoff-downstream-note">
          Blue Team investigation detail is shown in the workflow and timeline below.
        </p>
      )}

      {handoff.status === "COMPLETED" && (handoff.campaign_run_id || handoff.assessment_run_id) && (
        <p className="commander-handoff-downstream-note">
          Routed to {actorLabel}. Downstream run detail isn't available in this view yet — run id{" "}
          {formatShortId(handoff.campaign_run_id || handoff.assessment_run_id)}.
        </p>
      )}

      {isTerminalFailure && (
        <div className="commander-handoff-failure">
          {code && (
            <p className="commander-handoff-failure-reason">
              {getFailureReasonCodeExplanation(code) || `Failure reason: ${code}`}
              {detail && <span className="commander-handoff-failure-detail"> ({normalizeSecurityRoleText(detail)})</span>}
            </p>
          )}
          <div className="commander-handoff-immutable-note">
            <p>Recommendation accepted ✓</p>
            <p>Commander handoff: Failed / denied ✕</p>
            <p>
              This governed attempt is immutable. Generate a new recommendation if you want Gait to reassess the
              current state.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommanderHandoffCard;
