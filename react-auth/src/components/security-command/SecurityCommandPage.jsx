import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RiArrowGoBackLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { useSecurityPosture } from "../../hooks/useSecurityPosture";
import { useActiveSecurityCases } from "../../hooks/useActiveSecurityCases";
import { useSecurityCaseSnapshot } from "../../hooks/useSecurityCaseSnapshot";
import { useSecurityCaseTimeline } from "../../hooks/useSecurityCaseTimeline";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { useSecurityFindingRecommendation } from "../../hooks/useSecurityFindingRecommendation";
import { useSecurityRecommendationActions } from "../../hooks/useSecurityRecommendationActions";
import { useSecurityCaseInvestigationSummary } from "../../hooks/useSecurityCaseInvestigationSummary";
import { useSecurityCaseDiagnosis } from "../../hooks/useSecurityCaseDiagnosis";
import { PostureOverview } from "../security/PostureOverview";
import { SecurityPageSwitcher } from "../security/SecurityPageSwitcher";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { AccountMenu } from "../../account/AccountMenu";
import { canRunSecurityExercises } from "../security-exercises/securityExerciseLabels";
import { ActiveCasesPanel } from "./ActiveCasesPanel";
import { CaseHeader } from "./CaseHeader";
import { WorkflowProgress } from "./WorkflowProgress";
import { HumanAttentionBanner } from "./HumanAttentionBanner";
import { CaseTimeline } from "./CaseTimeline";
import { SecurityCopilotPanel } from "./SecurityCopilotPanel";
import { SpecialistCard } from "./SpecialistCard";
import { CommanderRoutingPanel } from "./CommanderRoutingPanel";
import { InvestigationBlockedNotice } from "./InvestigationBlockedNotice";
import { DiagnosisPanel } from "./DiagnosisPanel";
import "../security/SecurityObservatory.css";
import "./SecurityCommand.css";

function isForbidden(...errors) {
  return errors.some((error) => error?.response?.status === 403);
}

export function SecurityCommandPage() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const location = useLocation();
  const navigate = useNavigate();
  const posture = useSecurityPosture();
  const activeCases = useActiveSecurityCases();
  const help = useSecurityHelp();
  const [selectedCase, setSelectedCase] = useState(null);

  const snapshotState = useSecurityCaseSnapshot(selectedCase?.id);
  const timelineState = useSecurityCaseTimeline(selectedCase?.id);
  const recommendationState = useSecurityFindingRecommendation(selectedCase?.finding_id);
  const recommendationActions = useSecurityRecommendationActions();
  const investigationSummaryState = useSecurityCaseInvestigationSummary(selectedCase?.id);
  const diagnosisState = useSecurityCaseDiagnosis(selectedCase?.id);
  const canActOnRecommendation = canRunSecurityExercises(user);

  const handleGenerateRecommendation = () => {
    if (!selectedCase?.finding_id) {
      return;
    }
    recommendationActions
      .generateRecommendation(selectedCase.finding_id)
      .then(() => {
        recommendationState.refetch().catch(() => {});
      })
      .catch(() => {});
  };

  const handleAcceptRecommendation = (recommendation) => {
    recommendationActions
      .acceptRecommendation(recommendation.id)
      .then(() => {
        // Backend remains authoritative: never mark HANDED_OFF
        // optimistically, just refetch the real state. Accepting an
        // INVESTIGATE recommendation can create/advance a case, so the
        // existing case-scoped hooks are refetched too.
        recommendationState.refetch().catch(() => {});
        snapshotState.refetch({ silent: true }).catch(() => {});
        timelineState.refetch().catch(() => {});
        activeCases.refetch().catch(() => {});
        investigationSummaryState.refetch().catch(() => {});
        diagnosisState.refetch().catch(() => {});
      })
      .catch(() => {});
  };

  const handleDismissRecommendation = (recommendation) => {
    recommendationActions
      .dismissRecommendation(recommendation.id)
      .then(() => {
        recommendationState.refetch().catch(() => {});
      })
      .catch(() => {});
  };

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
            <AccountMenu status="Read only" />
          </div>
        </header>

        <SecurityPageSwitcher current="command" user={user} />

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
              recommendation={recommendationState.recommendation}
              isRecommendationLoading={recommendationState.isLoading}
              recommendationError={recommendationState.error}
              onRetryRecommendation={recommendationState.refetch}
              onGenerateRecommendation={handleGenerateRecommendation}
              onAcceptRecommendation={handleAcceptRecommendation}
              onDismissRecommendation={handleDismissRecommendation}
              isRecommendationSubmitting={recommendationActions.isSubmitting}
              canActOnRecommendation={canActOnRecommendation}
              recommendationActionError={recommendationActions.submitError}
              lastRecommendationAction={recommendationActions.lastAction}
              investigationSummary={investigationSummaryState.summary}
              isInvestigationSummaryLoading={investigationSummaryState.isLoading}
              diagnosis={diagnosisState.diagnosis}
              isDiagnosisLoading={diagnosisState.isLoading}
            />
            {selectedCase && investigationSummaryState.summary?.case_status === "INVESTIGATION_BLOCKED" && (
              <InvestigationBlockedNotice
                reasonCategory={investigationSummaryState.summary?.investigation_blocked_reason_category}
              />
            )}
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
            {selectedCase && investigationSummaryState.summary?.specialist_display_name && (
              <section className="security-panel" aria-labelledby="commander-routing-heading">
                <div className="security-section-heading">
                  <div>
                    <p className="security-eyebrow">Commander Routing</p>
                    <h2 id="commander-routing-heading" className="sr-only">Commander routing</h2>
                  </div>
                  {help.getTopic("commander_specialist_routing") && (
                    <SecurityInfoButton
                      title="Commander Routing"
                      content={help.getTopic("commander_specialist_routing")}
                    />
                  )}
                </div>
                <div className="commander-routing-and-specialist">
                  <CommanderRoutingPanel
                    specialistDisplayName={investigationSummaryState.summary.specialist_display_name}
                    routingReasonCode={investigationSummaryState.summary.routing_reason_code}
                    routingVersion={investigationSummaryState.summary.routing_version}
                    fallbackUsed={investigationSummaryState.summary.fallback_used}
                    isPreview={investigationSummaryState.summary.is_preview}
                  />
                  <SpecialistCard
                    specialistDisplayName={investigationSummaryState.summary.specialist_display_name}
                    statusLabel={snapshotState.snapshot?.status_label}
                    environment={investigationSummaryState.summary.environment}
                    isPreview={investigationSummaryState.summary.is_preview}
                    isLoading={investigationSummaryState.isLoading}
                  />
                </div>
              </section>
            )}
            {selectedCase && diagnosisState.diagnosis && (
              <section className="security-panel" aria-labelledby="diagnosis-panel-heading">
                <div className="security-section-heading">
                  <div>
                    <p className="security-eyebrow">AI Diagnosis</p>
                    <h2 id="diagnosis-panel-heading" className="sr-only">AI diagnosis</h2>
                  </div>
                  {help.getTopic("grounded_diagnosis") && (
                    <SecurityInfoButton title="AI Diagnosis" content={help.getTopic("grounded_diagnosis")} />
                  )}
                </div>
                <DiagnosisPanel
                  diagnosis={diagnosisState.diagnosis}
                  isLoading={diagnosisState.isLoading}
                  isActivelyInvestigating={snapshotState.snapshot?.current_state === "INVESTIGATING"}
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
                initialPrompt={location.state?.sagePrompt}
                onInitialPromptConsumed={() => {
                  // Clear the hand-off state so browser back / a remount
                  // never resends the same "Ask Gait about this" prompt.
                  navigate(location.pathname, { replace: true, state: {} });
                }}
                onOperationalResponse={() => {
                  // Backend remains authoritative: never infer new workflow
                  // state from the Copilot response, just refetch it
                  // immediately. Snapshot first (current truth), then the
                  // incremental cursor-based timeline, then the active-case
                  // summary. Normal polling continues underneath this.
                  snapshotState.refetch({ silent: true }).catch(() => {});
                  timelineState.refetch().catch(() => {});
                  activeCases.refetch().catch(() => {});
                  investigationSummaryState.refetch().catch(() => {});
                  diagnosisState.refetch().catch(() => {});
                }}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default SecurityCommandPage;
