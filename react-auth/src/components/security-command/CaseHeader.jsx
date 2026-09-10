import React from "react";
import { Link } from "react-router-dom";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { formatShortId } from "../security/securityLabels";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { normalizeSecurityRoleText } from "./roleTerminology";

const REVIEW_SECTIONS = [
  { label: "DIAGNOSIS", producer: "Produced by Blue Team" },
  { label: "ADVERSARIAL TEST", producer: "Produced by Red Team" },
  { label: "REPAIR", producer: "Produced by Green Team" },
  {
    label: "VALIDATION",
    producer: "Produced by Security Validator",
    topicKey: "security_validation",
  },
  { label: "APPROVAL", producer: "Human Approver" },
  { label: "DEPLOYMENT", producer: "Release Engineer", topicKey: "deployment" },
  {
    label: "POST-DEPLOY VERIFICATION",
    producer: "Security Truth",
    topicKey: "post_deploy_verification",
  },
];

export function CaseHeader({ selectedCase, snapshot, isSnapshotLoading }) {
  const help = useSecurityHelp();
  const selectedCaseHelpTopic = help.getTopic("selected_case");
  const humanReviewHelpTopic = help.getTopic("human_review");

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

      <div className="case-header-approval-stub">
        <p className="case-header-approval-stub-label">
          Human Review / Approval
          {humanReviewHelpTopic && <SecurityInfoButton title="Human Review" content={humanReviewHelpTopic} />}
        </p>
        <dl className="case-header-review-sections" aria-label="Human review sections">
          {REVIEW_SECTIONS.map(({ label, producer, topicKey }) => {
            const sectionHelpTopic = topicKey ? help.getTopic(topicKey) : null;
            return (
              <div key={label}>
                <dt>
                  {label}
                  {sectionHelpTopic && (
                    <SecurityInfoButton title={sectionHelpTopic.title} content={sectionHelpTopic} />
                  )}
                </dt>
                <dd>{producer}</dd>
              </div>
            );
          })}
        </dl>
        <div className="case-header-approval-stub-actions">
          <button type="button" disabled>Review Green Team Repair</button>
          <button type="button" disabled>View Diff</button>
          <button type="button" disabled>View Validation</button>
          <button type="button" disabled>Approve</button>
          <button type="button" disabled>Reject</button>
        </div>
        <p className="case-header-approval-stub-note">
          Human Approver authority is not implemented yet — coming in the next milestone.
        </p>
      </div>
    </div>
  );
}
