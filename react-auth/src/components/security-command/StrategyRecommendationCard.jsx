import React from "react";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime } from "../security/securityLabels";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { normalizeSecurityRoleText } from "./roleTerminology";
import {
  getAcceptErrorMessage,
  getDismissErrorMessage,
  getGenerateErrorMessage,
  getRecommendationStatusExplanation,
  getRecommendationStatusLabel,
  getRecommendationStatusTone,
  getRecommendationTypeLabel,
} from "./strategyLabels";

function getActionErrorMessage(actionError, lastAction) {
  if (lastAction === "dismiss") {
    return getDismissErrorMessage(actionError);
  }
  if (lastAction === "generate") {
    return getGenerateErrorMessage(actionError);
  }
  return getAcceptErrorMessage(actionError);
}

function RefChips({ label, values }) {
  if (!values || values.length === 0) {
    return null;
  }
  return (
    <div className="strategy-recommendation-refs-group">
      <span className="strategy-recommendation-refs-label">{label}</span>
      <ul className="related-id-list" aria-label={label}>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export function StrategyRecommendationCard({
  recommendation,
  isLoading,
  error,
  onRetry,
  onAccept,
  onDismiss,
  onGenerate,
  isSubmitting,
  canAct,
  actionError,
  lastAction,
}) {
  const help = useSecurityHelp();
  const helpTopic = help.getTopic("security_strategy_recommendation");

  if (isLoading && !recommendation) {
    return <SecurityLoadingState label="Loading strategy recommendation" />;
  }

  if (error && !recommendation) {
    return <SecurityErrorState error={error} onRetry={onRetry} compact />;
  }

  if (!recommendation) {
    return (
      <div className="strategy-recommendation-card strategy-recommendation-empty">
        <p className="strategy-recommendation-eyebrow">AI-assisted recommendation</p>
        <p>No strategy recommendation has been generated for this security concern.</p>
        {actionError && lastAction === "generate" && (
          <p className="strategy-recommendation-action-error" role="alert">
            {getGenerateErrorMessage(actionError)}
          </p>
        )}
        {canAct && onGenerate && (
          <button type="button" className="security-button primary" onClick={onGenerate} disabled={isSubmitting}>
            {isSubmitting ? "Requesting a strategy recommendation…" : "Generate Strategy Recommendation"}
          </button>
        )}
      </div>
    );
  }

  const tone = getRecommendationStatusTone(recommendation.status);
  const canShowActions = canAct && recommendation.status === "VALIDATED";

  return (
    <div className="strategy-recommendation-card">
      <div className="strategy-recommendation-head">
        <div>
          <p className="strategy-recommendation-eyebrow">
            AI-assisted recommendation
            {helpTopic && <SecurityInfoButton title="AI Strategy Recommendation" content={helpTopic} />}
          </p>
          <h3 className="strategy-recommendation-title">{normalizeSecurityRoleText(recommendation.title)}</h3>
        </div>
        <div className="strategy-recommendation-badges">
          <span className={`security-badge tone-${tone}`}>{getRecommendationStatusLabel(recommendation.status)}</span>
        </div>
      </div>

      <dl className="strategy-recommendation-facts">
        <div>
          <dt>Recommended action</dt>
          <dd>{getRecommendationTypeLabel(recommendation.recommendation_type)}</dd>
        </div>
        {recommendation.priority && (
          <div>
            <dt>Priority</dt>
            <dd>{recommendation.priority}</dd>
          </div>
        )}
        {recommendation.confidence && (
          <div>
            <dt>Confidence</dt>
            <dd>{recommendation.confidence}</dd>
          </div>
        )}
        <div>
          <dt>Generated</dt>
          <dd>{formatDateTime(recommendation.generated_at)}</dd>
        </div>
        {recommendation.decided_at && (
          <div>
            <dt>Decided</dt>
            <dd>{formatDateTime(recommendation.decided_at)}</dd>
          </div>
        )}
      </dl>

      {recommendation.rationale && (
        <div className="strategy-recommendation-rationale">
          <p className="strategy-recommendation-rationale-label">Rationale</p>
          <p>{normalizeSecurityRoleText(recommendation.rationale)}</p>
        </div>
      )}

      <RefChips label="Threats" values={recommendation.threat_keys} />
      <RefChips label="Attack surfaces" values={recommendation.attack_surface_keys} />
      <RefChips label="Controls" values={recommendation.control_keys} />

      {recommendation.recommended_campaign?.campaign_key && (
        <p className="strategy-recommendation-downstream-ref">
          Recommended campaign: {recommendation.recommended_campaign.campaign_key}{" "}
          v{recommendation.recommended_campaign.campaign_version} in{" "}
          {recommendation.recommended_campaign.environment}
        </p>
      )}

      {(recommendation.recommended_assessments || []).filter((assessment) => assessment?.adapter_key).length > 0 && (
        <ul className="strategy-recommendation-downstream-ref-list">
          {recommendation.recommended_assessments
            .filter((assessment) => assessment?.adapter_key)
            .map((assessment, index) => (
              <li key={`${assessment.adapter_key}-${assessment.target_key}-${index}`}>
                Recommended assessment: {assessment.adapter_key} on {assessment.target_key} in{" "}
                {assessment.environment}
              </li>
            ))}
        </ul>
      )}

      {recommendation.status === "REJECTED" && recommendation.rejection_reason && (
        <p className="strategy-recommendation-rejection">
          {normalizeSecurityRoleText(recommendation.rejection_reason)}
        </p>
      )}

      <p className="strategy-recommendation-status-note">
        {getRecommendationStatusExplanation(recommendation.status)}
      </p>

      {actionError && (
        <p className="strategy-recommendation-action-error" role="alert">
          {getActionErrorMessage(actionError, lastAction)}
        </p>
      )}

      {canShowActions && (
        <div className="strategy-recommendation-actions">
          <button
            type="button"
            className="security-button primary"
            onClick={() => onAccept(recommendation)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Handing recommendation to Commander…" : "Accept Recommendation"}
          </button>
          <button
            type="button"
            className="security-button secondary"
            onClick={() => onDismiss(recommendation)}
            disabled={isSubmitting}
          >
            Dismiss
          </button>
        </div>
      )}

      <details className="case-timeline-details strategy-recommendation-technical">
        <summary>Technical details</summary>
        <dl>
          <div>
            <dt>Provider</dt>
            <dd>{recommendation.provider_name || "—"}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{recommendation.model_identifier || "—"}</dd>
          </div>
          <div>
            <dt>Context hash</dt>
            <dd>{recommendation.context_hash || "—"}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

export default StrategyRecommendationCard;
