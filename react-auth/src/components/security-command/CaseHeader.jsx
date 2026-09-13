import React from "react";
import { Link } from "react-router-dom";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { formatShortId } from "../security/securityLabels";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { normalizeSecurityRoleText } from "./roleTerminology";
import { StrategyRecommendationCard } from "./StrategyRecommendationCard";
import { CommanderHandoffCard } from "./CommanderHandoffCard";

export function CaseHeader({
  selectedCase,
  snapshot,
  isSnapshotLoading,
  recommendation,
  isRecommendationLoading,
  recommendationError,
  onRetryRecommendation,
  onGenerateRecommendation,
  onAcceptRecommendation,
  onDismissRecommendation,
  isRecommendationSubmitting,
  canActOnRecommendation,
  recommendationActionError,
  lastRecommendationAction,
  investigationSummary,
  isInvestigationSummaryLoading,
}) {
  const help = useSecurityHelp();
  const selectedCaseHelpTopic = help.getTopic("selected_case");

  if (!selectedCase) {
    return (
      <div className="case-header case-header--empty">
        <p>Select an active case to see its current workflow state.</p>
      </div>
    );
  }

  return (
    <div className="case-header">
      <div className="case-header-top">
        <h2>{selectedCase.finding_title}</h2>
        <div className="case-header-actions">
          <Link to="/security-observatory" className="security-button secondary case-header-observatory-link">
            View in Observatory
          </Link>
          {selectedCaseHelpTopic && <SecurityInfoButton title="Selected Case" content={selectedCaseHelpTopic} />}
        </div>
      </div>
      <div className="case-header-ids">
        <span>Finding #{formatShortId(selectedCase.finding_id)}</span>
        <span>Case #{formatShortId(selectedCase.id)}</span>
      </div>

      {!isInvestigationSummaryLoading && investigationSummary?.specialist_display_name && (
        <p className="case-header-specialist">
          Assigned: <strong>{investigationSummary.specialist_display_name}</strong>
        </p>
      )}

      {isSnapshotLoading && !snapshot ? (
        <p className="case-header-loading">Loading current workflow state…</p>
      ) : snapshot ? (
        <dl className="case-header-facts">
          <div>
            <dt>State</dt>
            <dd>{normalizeSecurityRoleText(snapshot.current_state_label)}</dd>
          </div>
          <div>
            <dt>Human Approver attention</dt>
            <dd>{normalizeSecurityRoleText(snapshot.human_attention_label)}</dd>
          </div>
          <div>
            <dt>Next</dt>
            <dd>{normalizeSecurityRoleText(snapshot.next_available_action_label)}</dd>
          </div>
        </dl>
      ) : null}

      <div className="case-header-strategy">
        <StrategyRecommendationCard
          recommendation={recommendation}
          isLoading={isRecommendationLoading}
          error={recommendationError}
          onRetry={onRetryRecommendation}
          onGenerate={onGenerateRecommendation}
          onAccept={onAcceptRecommendation}
          onDismiss={onDismissRecommendation}
          isSubmitting={isRecommendationSubmitting}
          canAct={canActOnRecommendation}
          actionError={recommendationActionError}
          lastAction={lastRecommendationAction}
        />
        <CommanderHandoffCard recommendation={recommendation} />
      </div>
    </div>
  );
}
