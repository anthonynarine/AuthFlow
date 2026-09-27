import React from "react";
import { Link, useParams } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useFounderIssue } from "../../hooks/useFounderIssue";
import { SeverityPill } from "./FounderIssueCard";
import { ApprovalCard } from "./ApprovalCard";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityCopilotPanel } from "../security-command/SecurityCopilotPanel";
import { WorkflowProgress } from "../security-command/WorkflowProgress";
import { DiagnosisPanel } from "../security-command/DiagnosisPanel";
import { CaseTimeline } from "../security-command/CaseTimeline";
import { InvestigationBlockedNotice } from "../security-command/InvestigationBlockedNotice";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import "./FounderWorkspace.css";
import "../security-command/SecurityCommand.css";

const DEPLOY_CHECKLIST_STEPS = [
  { key: "approved", label: "Human approval recorded" },
  { key: "validated", label: "Validated repair locked" },
  { key: "started", label: "Deployment started" },
  { key: "verified", label: "Post-deployment verification" },
];

function StoryBlock({ title, text }) {
  return (
    <div className={`founder-story-block${text ? "" : " is-empty"}`}>
      <h3>{title}</h3>
      <p>{text || "Not available yet."}</p>
    </div>
  );
}

function Lifecycle({ steps }) {
  return (
    <ol className="founder-lifecycle" aria-label="Issue lifecycle">
      {steps.map((step) => (
        <li key={step.key} className={`founder-lifecycle-step is-${step.state}`}>
          <div className="founder-lifecycle-dot-row">
            <span className="founder-lifecycle-dot" aria-hidden="true" />
            <span className="founder-lifecycle-line" aria-hidden="true" />
          </div>
          <span className="founder-lifecycle-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

// UI1.1 fix: "Deployment started" was only ever marked done while
// currentState === "DEPLOYING" — once a deployment actually reached
// DEPLOYED, that step stayed stuck showing "active" forever, understating
// real progress. "Post-deployment verification" stays "○" (pending) in
// every case: there is no backend signal (BACKEND_UI_CONTRACT_GAP —
// no post-deploy re-verification proof) that Gait is actively verifying
// anything, so it is never shown as active/in-progress, only pending —
// and it can never be marked done here. The only place this workspace
// ever claims verification is the separate "Resolved ✓" card, and only
// when finding.status is actually RESOLVED.
function DeployingStatus({ currentState }) {
  const startedDone = currentState === "DEPLOYING" || currentState === "DEPLOYED";
  const doneKeys = { approved: true, validated: true, started: startedDone };
  return (
    <div className="founder-deploy-status">
      <h2>Deploying fix</h2>
      <ul className="founder-deploy-checklist">
        {DEPLOY_CHECKLIST_STEPS.map((step) => {
          const isDone = Boolean(doneKeys[step.key]);
          const isActive = !isDone && step.key === "started" && !startedDone;
          return (
            <li key={step.key} className={isDone ? "is-done" : isActive ? "is-active" : ""}>
              {isDone ? "✓" : isActive ? "●" : "○"} {step.label}
            </li>
          );
        })}
      </ul>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
        You don't need to stay on this page — Gait will keep working.
      </p>
    </div>
  );
}

export function FounderIssueWorkspacePage() {
  const { id } = useParams();
  const { issue, isLoading, error, isForbidden, caseId, timeline, investigationSummary, refetchAll } =
    useFounderIssue(id);

  if (isForbidden) {
    return (
      <div className="founder-workspace">
        <main className="founder-shell">
          <SecurityErrorState error={{ response: { status: 403 } }} />
        </main>
      </div>
    );
  }

  if (isLoading && !issue) {
    return (
      <div className="founder-workspace">
        <main className="founder-shell">
          <p className="founder-empty">Loading…</p>
        </main>
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="founder-workspace">
        <main className="founder-shell">
          <SecurityErrorState error={error} />
        </main>
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  const isInvestigationBlocked = investigationSummary.summary?.case_status === "INVESTIGATION_BLOCKED";
  const isDeploying = issue.currentState === "DEPLOYING" || issue.currentState === "DEPLOYED";

  return (
    <div className="founder-workspace">
      <main className="founder-shell">
        <header className="founder-issue-header">
          <Link to="/workspace/issues" className="founder-back-link">
            <RiArrowGoBackLine /> All issues
          </Link>
          <div className="founder-issue-header-top">
            <SeverityPill tone={issue.severityTone}>{issue.severityLabel}</SeverityPill>
          </div>
          <h1>{issue.title}</h1>
          <div className="founder-issue-header-meta">
            <span>{issue.statusLabel}</span>
            {issue.environment && <span>· {issue.environment}</span>}
            {issue.affectedSystem && <span>· {issue.affectedSystem}</span>}
          </div>
        </header>

        <Lifecycle steps={issue.lifecycle} />

        <div className="founder-story">
          <StoryBlock title="What happened" text={issue.whatHappened} />
          <StoryBlock title="Why it matters" text={issue.whyItMatters} />
          <StoryBlock title="What Gait found" text={issue.whatGaitFound} />
          <StoryBlock title="What Gait recommends" text={issue.recommendation} />
        </div>

        {isInvestigationBlocked && (
          <InvestigationBlockedNotice
            reasonCategory={investigationSummary.summary?.investigation_blocked_reason_category}
          />
        )}

        {issue.needsYou && issue.approvalKind && (
          <ApprovalCard caseId={caseId} approvalKind={issue.approvalKind} onActionComplete={refetchAll} />
        )}

        {issue.needsYou && !issue.approvalKind && (
          <div className={`founder-needs-you-card${issue.humanAttentionState === "HUMAN_APPROVAL_REQUIRED" ? "" : " tone-danger"}`}>
            <p className="founder-needs-you-title">Needs you</p>
            <p className="founder-needs-you-reason">
              {issue.needsYouReason || "Gait needs a decision here before it can continue."}
            </p>
          </div>
        )}

        {!issue.needsYou && isDeploying && <DeployingStatus currentState={issue.currentState} />}

        {issue.isResolved && (
          <div className="founder-resolved-card">
            <h2>Resolved ✓</h2>
            <p>{issue.resolutionSummary || "Gait marked this resolved."}</p>
            {issue.resolvedAt && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
                Resolved {formatDateTime(issue.resolvedAt)}
              </p>
            )}
          </div>
        )}

        <section className="founder-ask-gait" aria-labelledby="ask-gait-heading">
          <h2 className="founder-section-title" id="ask-gait-heading">Ask Gait</h2>
          <SecurityCopilotPanel caseId={caseId} findingId={issue.id} onOperationalResponse={refetchAll} />
        </section>

        <section className="founder-section" aria-labelledby="activity-heading">
          <h2 className="founder-section-title" id="activity-heading">Security team activity</h2>
          <CaseTimeline
            events={timeline.events}
            isLoading={timeline.isLoading}
            error={timeline.error}
            isStale={timeline.isStale}
            lastUpdated={timeline.lastUpdated}
            onRetry={timeline.refetch}
          />
        </section>

        <details className="founder-disclosure">
          <summary>Technical details</summary>
          <div className="founder-disclosure-body">
            <dl className="founder-approval-fact-grid">
              <div className="founder-approval-fact">
                <dt>Finding key</dt>
                <dd>{issue.findingKey}</dd>
              </div>
              <div className="founder-approval-fact">
                <dt>Finding ID</dt>
                <dd>{formatShortId(issue.id)}</dd>
              </div>
              {caseId && (
                <div className="founder-approval-fact">
                  <dt>Case ID</dt>
                  <dd>{formatShortId(caseId)}</dd>
                </div>
              )}
              {issue.specialistDisplayName && (
                <div className="founder-approval-fact">
                  <dt>Assigned specialist</dt>
                  <dd>{issue.specialistDisplayName}</dd>
                </div>
              )}
            </dl>

            {caseId && (
              <div className="security-panel" style={{ marginTop: "1rem" }}>
                <p className="panel-label">Specialist workflow</p>
                <WorkflowProgress
                  specialists={issue._raw.snapshot?.specialists}
                  humanAttentionState={issue.humanAttentionState}
                  isLoading={false}
                />
              </div>
            )}

            {issue._raw.diagnosis && (
              <div className="security-panel" style={{ marginTop: "1rem" }}>
                <p className="panel-label">AI diagnosis (advisory)</p>
                <DiagnosisPanel diagnosis={issue._raw.diagnosis} isLoading={false} isActivelyInvestigating={false} />
              </div>
            )}
          </div>
        </details>
      </main>
    </div>
  );
}

export default FounderIssueWorkspacePage;
