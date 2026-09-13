import React from "react";
import { Link } from "react-router-dom";
import {
  getInvestigationBlockedReasonLabel,
  getInvestigationBlockedRecommendation,
  isBudgetRelatedBlock,
} from "./specialistLabels";

/**
 * B-UX4 section 19/20: honest, safe presentation of an
 * INVESTIGATION_BLOCKED case. `reasonCategory` is always one of the
 * backend's fixed, presentation-ready categories (KILL_SWITCH,
 * BUDGET_EXCEEDED, CAPABILITY_DENIED, EXECUTION_FAILED, UNKNOWN_FAILURE,
 * or null) -- never a raw exception, stack trace, or provider payload.
 * There is no retry action here: Gait never bypasses budget/Gateway
 * policy from the browser, so the only way forward is a human decision
 * (investigate manually, or wait/fix the underlying block).
 */
export function InvestigationBlockedNotice({ reasonCategory }) {
  const reasonLabel = getInvestigationBlockedReasonLabel(reasonCategory);
  const recommendation = getInvestigationBlockedRecommendation(reasonCategory);
  const isBudgetRelated = isBudgetRelatedBlock(reasonCategory);

  return (
    <div className="investigation-blocked-notice" role="status">
      <p className="investigation-blocked-notice-title">AI investigation blocked</p>
      <dl className="investigation-blocked-notice-facts">
        <div>
          <dt>Reason</dt>
          <dd>{reasonLabel}</dd>
        </div>
        <div>
          <dt>Recommended action</dt>
          <dd>{recommendation}</dd>
        </div>
      </dl>
      {isBudgetRelated && (
        <p className="investigation-blocked-notice-budget-link">
          <Link to="/security-observatory#ai-budget-heading">View the AI Intelligence budget on the Security Observatory</Link>
        </p>
      )}
    </div>
  );
}

export default InvestigationBlockedNotice;
