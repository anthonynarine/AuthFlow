import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowGoBackLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { useSecurityPosture } from "../../hooks/useSecurityPosture";
import { useActiveSecurityCases } from "../../hooks/useActiveSecurityCases";
import { useSecurityCaseSnapshot } from "../../hooks/useSecurityCaseSnapshot";
import { useSecurityCaseTimeline } from "../../hooks/useSecurityCaseTimeline";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { PostureOverview } from "../security/PostureOverview";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { formatUser } from "../security/securityLabels";
import { ActiveCasesPanel } from "./ActiveCasesPanel";
import { CaseHeader } from "./CaseHeader";
import { WorkflowProgress } from "./WorkflowProgress";
import { HumanAttentionBanner } from "./HumanAttentionBanner";
import { CaseTimeline } from "./CaseTimeline";
import { SecurityCopilotPanel } from "./SecurityCopilotPanel";
import "../security/SecurityObservatory.css";
import "./SecurityCommand.css";

function isForbidden(...errors) {
  return errors.some((error) => error?.response?.status === 403);
}

export function SecurityCommandPage() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const posture = useSecurityPosture();
  const activeCases = useActiveSecurityCases();
  const help = useSecurityHelp();
  const [selectedCase, setSelectedCase] = useState(null);

  const snapshotState = useSecurityCaseSnapshot(selectedCase?.id);
  const timelineState = useSecurityCaseTimeline(selectedCase?.id);

  useEffect(() => {
    validateSession().catch(() => {});
  }, [validateSession]);

  useEffect(() => {
    if (!selectedCase && activeCases.cases.length > 0) {
      setSelectedCase(activeCases.cases[0]);
    }
  }, [activeCases.cases, selectedCase]);

  const forbidden = isForbidden(posture.error, activeCases.error);

  if (forbidden) {
    return (
      <main className="security-page">
        <section className="security-shell">
          <Link to="/" className="security-back-link">
            <RiArrowGoBackLine /> Home
          </Link>
          <SecurityErrorState error={{ response: { status: 403 } }} />
        </section>
      </main>
    );
  }

  return (
    <main className="security-page">
      <section className="security-shell">
        <header className="security-header">
          <div>
            <Link to="/" className="security-back-link">
              <RiArrowGoBackLine /> Home
            </Link>
            <p className="security-kicker"><RiShieldKeyholeLine /> Gait Security</p>
            <h1>Security Command</h1>
            <p>Operate Gait — current workflow, specialist status, and Copilot.</p>
          </div>
          <div className="security-header-actions">
            {user && (
              <div className="security-operator" title={`Signed in as ${formatUser(user)}`}>
                <span>Signed in as</span>
                <strong>{formatUser(user)}</strong>
              </div>
            )}
            <span className="read-only-chip">Read only</span>
            <Link to="/security-observatory" className="security-button secondary">
              Security Observatory
            </Link>
          </div>
        </header>

        <div className="command-center-grid">
          <section className="command-column command-column--posture" aria-labelledby="command-posture-heading">
            <h2 id="command-posture-heading" className="sr-only">Security posture</h2>
            <PostureOverview
              posture={posture.posture}
              isLoading={posture.isLoading}
              error={posture.error}
              onRetry={posture.refetch}
              info={help.getTopic("security_posture") ? { content: help.getTopic("security_posture") } : null}
            />
            <section className="security-panel active-cases-panel" aria-labelledby="active-cases-heading">
              <div className="security-section-heading">
                <div>
                  <p className="security-eyebrow">Active Cases</p>
                  <h2 id="active-cases-heading">{activeCases.cases.length}</h2>
                </div>
                {help.getTopic("active_cases") && (
                  <SecurityInfoButton title="Active Cases" content={help.getTopic("active_cases")} />
                )}
              </div>
              <ActiveCasesPanel
                cases={activeCases.cases}
                isLoading={activeCases.isLoading}
                error={activeCases.error}
                onRetry={activeCases.refetch}
                selectedCaseId={selectedCase?.id}
                onSelectCase={setSelectedCase}
              />
            </section>
          </section>

          <section className="command-column command-column--case" aria-labelledby="command-case-heading">
            <h2 id="command-case-heading" className="sr-only">Selected case</h2>
            <HumanAttentionBanner
              snapshot={snapshotState.snapshot}
              isLoading={snapshotState.isLoading}
              isStale={snapshotState.isStale}
              lastUpdated={snapshotState.lastUpdated}
            />
            <CaseHeader
              selectedCase={selectedCase}
              snapshot={snapshotState.snapshot}
              isSnapshotLoading={snapshotState.isLoading}
            />
            {selectedCase && (
              <section className="security-panel" aria-labelledby="workflow-progress-heading">
                <div className="security-section-heading">
                  <div>
                    <p className="security-eyebrow">Specialist Workflow</p>
                    <h2 id="workflow-progress-heading" className="sr-only">Specialist workflow progress</h2>
                  </div>
                  {help.getTopic("specialist_workflow") && (
                    <SecurityInfoButton title="Specialist Workflow" content={help.getTopic("specialist_workflow")} />
                  )}
                </div>
                <WorkflowProgress
                  specialists={snapshotState.snapshot?.specialists}
                  humanAttentionState={snapshotState.snapshot?.human_attention_state}
                  isLoading={snapshotState.isLoading}
                />
              </section>
            )}
            {selectedCase && (
              <section className="security-panel" aria-labelledby="case-timeline-heading">
                <div className="security-section-heading">
                  <div>
                    <p className="security-eyebrow">Case Timeline</p>
                    <h2 id="case-timeline-heading" className="sr-only">Case timeline</h2>
                  </div>
                  {help.getTopic("case_timeline") && (
                    <SecurityInfoButton title="Case Timeline" content={help.getTopic("case_timeline")} />
                  )}
                </div>
                <CaseTimeline
                  events={timelineState.events}
                  isLoading={timelineState.isLoading}
                  error={timelineState.error}
                  isStale={timelineState.isStale}
                  lastUpdated={timelineState.lastUpdated}
                  onRetry={timelineState.refetch}
                />
              </section>
            )}
          </section>

          <section className="command-column command-column--copilot" aria-labelledby="command-copilot-heading">
            <div className="security-panel copilot-panel-wrapper">
              <div className="security-section-heading">
                <div>
                  <p className="security-eyebrow">Security Copilot</p>
                  <h2 id="command-copilot-heading" className="sr-only">Security Copilot</h2>
                </div>
                {help.getTopic("security_copilot") && (
                  <SecurityInfoButton title="Security Copilot" content={help.getTopic("security_copilot")} />
                )}
              </div>
              <SecurityCopilotPanel
                caseId={selectedCase?.id}
                findingId={selectedCase?.finding_id}
                nextAvailableAction={snapshotState.snapshot?.next_available_action}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default SecurityCommandPage;
