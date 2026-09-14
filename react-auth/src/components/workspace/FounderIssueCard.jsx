import React from "react";
import { Link } from "react-router-dom";

export function SeverityPill({ tone, children }) {
  return <span className={`fw-pill tone-${tone || "neutral"}`}>{children}</span>;
}

function issueNote(issue) {
  if (issue.needsYou) {
    return issue.needsYouReason || "This needs your decision.";
  }
  if (issue.isResolved) {
    return issue.resolutionSummary || "Gait marked this resolved.";
  }
  if (issue.whatGaitFound) {
    return issue.whatGaitFound;
  }
  if (issue.hasCase) {
    return "Gait is looking into this.";
  }
  return "Detected — not yet investigated.";
}

export function FounderIssueCard({ issue }) {
  return (
    <Link to={`/workspace/issues/${issue.id}`} className="founder-issue-card">
      <div className="founder-issue-top">
        <SeverityPill tone={issue.severityTone}>{issue.severityLabel}</SeverityPill>
        {issue.needsYou && <span className="founder-issue-action-flag">Needs you</span>}
      </div>
      <h3 className="founder-issue-title">{issue.title}</h3>
      <p className="founder-issue-status">{issue.statusLabel}</p>
      <p className="founder-issue-note">{issueNote(issue)}</p>
    </Link>
  );
}

export default FounderIssueCard;
