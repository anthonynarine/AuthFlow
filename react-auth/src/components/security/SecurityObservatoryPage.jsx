import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowGoBackLine, RiRefreshLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { useSecuritySummary } from "../../hooks/useSecuritySummary";
import { useSecurityEvents } from "../../hooks/useSecurityEvents";
import { useSecurityEventDetail } from "../../hooks/useSecurityEventDetail";
import { useSecuritySessions } from "../../hooks/useSecuritySessions";
import { useSecuritySessionDetail } from "../../hooks/useSecuritySessionDetail";
import { useSecurityPosture } from "../../hooks/useSecurityPosture";
import { useAiBudgetStatus } from "../../hooks/useAiBudgetStatus";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { SecurityNav } from "./SecurityNav";
import { SecurityPageSwitcher } from "./SecurityPageSwitcher";
import { AccountMenu } from "../../account/AccountMenu";
import { SecurityInfoButton } from "./SecurityInfoButton";
import { SecurityOverview } from "./SecurityOverview";
import { PostureOverview } from "./PostureOverview";
import { AiBudgetCountdown } from "./AiBudgetCountdown";
import { SecurityEventFilters } from "./SecurityEventFilters";
import { SecurityEventsTable } from "./SecurityEventsTable";
import { SecurityEventDetailModal } from "./SecurityEventDetailModal";
import { SecuritySessionsTable } from "./SecuritySessionsTable";
import { SecuritySessionDetailModal } from "./SecuritySessionDetailModal";
import { SecurityControlsSection } from "./SecurityControlsSection";
import { SecurityFindingsSection } from "./SecurityFindingsSection";
import { SecurityEvidenceSection } from "./SecurityEvidenceSection";
import { SecurityErrorState } from "./SecurityErrorState";
import { CurrentSessionSummary } from "./CurrentSessionSummary";
import { formatDateTime } from "./securityLabels";
import "./SecurityObservatory.css";

function isForbidden(...errors) {
  return errors.some((error) => error?.response?.status === 403);
}

function getRecordId(record) {
  return record?.uuid || record?.id || record?.session_id || record?.event_id;
}

export function SecurityObservatoryPage() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const summary = useSecuritySummary();
  const posture = useSecurityPosture();
  const events = useSecurityEvents();
  const eventDetail = useSecurityEventDetail();
  const sessions = useSecuritySessions();
  const sessionDetail = useSecuritySessionDetail();
  const aiBudget = useAiBudgetStatus();
  const help = useSecurityHelp();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const forbidden = isForbidden(summary.error, events.error, sessions.error, posture.error, aiBudget.error);

  useEffect(() => {
    validateSession().catch(() => {});
  }, [validateSession]);

  const refreshAll = useCallback(() => {
    Promise.allSettled([
      summary.refetch(),
      events.refetch(),
      sessions.refetch(),
      posture.refetch(),
      aiBudget.refetch(),
    ]);
  }, [aiBudget, events, posture, sessions, summary]);

  useEffect(() => {
    const handleFocus = () => refreshAll();
    window.addEventListener("focus", handleFocus);
    const timer = window.setInterval(refreshAll, 60000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(timer);
    };
  }, [refreshAll]);

  const lastUpdated = [
    summary.lastUpdated,
    events.lastUpdated,
    sessions.lastUpdated,
    posture.lastUpdated,
    aiBudget.lastUpdated,
  ]
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  const handleSelectEvent = (event) => {
    setSelectedEventId(getRecordId(event));
  };

  const handleSelectSession = (session) => {
    setSelectedSessionId(getRecordId(session));
  };

  const closeEventDetail = () => {
    setSelectedEventId(null);
    eventDetail.clearEvent();
  };

  const closeSessionDetail = () => {
    setSelectedSessionId(null);
    sessionDetail.clearSession();
  };

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
            <h1>Security Observatory</h1>
            <p>Authentication, session, and security posture</p>
          </div>
          <div className="security-header-actions">
            <AccountMenu status="Read only" />
            <button type="button" className="security-button primary" onClick={refreshAll}>
              <RiRefreshLine /> Refresh
            </button>
            <span className="last-updated">
              Last updated {lastUpdated ? formatDateTime(lastUpdated) : "—"}
            </span>
          </div>
        </header>

        <SecurityPageSwitcher current="observatory" user={user} />

        <SecurityNav activeSection={activeSection} onSelect={setActiveSection} />

        {activeSection === "overview" && (
          <>
            <PostureOverview
              posture={posture.posture}
              isLoading={posture.isLoading}
              error={posture.error}
              onRetry={posture.refetch}
              info={help.getTopic("security_posture") ? { content: help.getTopic("security_posture") } : null}
              onViewControls={() => setActiveSection("controls")}
              onViewFindings={() => setActiveSection("findings")}
            />

            <AiBudgetCountdown
              budget={aiBudget.budget}
              isLoading={aiBudget.isLoading}
              error={aiBudget.error}
              onRetry={aiBudget.refetch}
              info={
                help.getTopic("ai_budget_countdown") ? { content: help.getTopic("ai_budget_countdown") } : null
              }
            />

            <SecurityOverview
              summary={summary.summary}
              isLoading={summary.isLoading}
              error={summary.error}
              onRetry={summary.refetch}
            />

            <CurrentSessionSummary
              user={user}
              sessions={sessions.sessions}
              summary={summary.summary}
              info={help.getTopic("sessions") ? { content: help.getTopic("sessions") } : null}
            />
          </>
        )}

        {activeSection === "controls" && <SecurityControlsSection />}

        {activeSection === "findings" && <SecurityFindingsSection />}

        {activeSection === "evidence" && <SecurityEvidenceSection />}

        {activeSection === "events" && (
          <section className="security-panel" aria-labelledby="security-events-heading">
            <div className="security-section-heading">
              <div>
                <p className="security-eyebrow">Recent Security Events</p>
                <h2 id="security-events-heading">Events</h2>
              </div>
              {help.getTopic("events") && (
                <SecurityInfoButton title="Events" content={help.getTopic("events")} />
              )}
            </div>
            <SecurityEventFilters
              filters={events.filters}
              onChange={events.updateFilter}
              onReset={events.resetFilters}
            />
            <SecurityEventsTable
              events={events.events}
              count={events.count}
              page={events.page}
              pageSize={events.pageSize}
              next={events.next}
              previous={events.previous}
              isLoading={events.isLoading}
              error={events.error}
              onPageChange={events.setPage}
              onSelectEvent={handleSelectEvent}
              onRetry={events.refetch}
            />
          </section>
        )}

        {activeSection === "sessions" && (
          <section className="security-panel" aria-labelledby="security-sessions-heading">
            <div className="security-section-heading">
              <div>
                <p className="security-eyebrow">Sessions</p>
                <h2 id="security-sessions-heading">Authentication Sessions</h2>
              </div>
              {help.getTopic("sessions") && (
                <SecurityInfoButton title="Authentication Sessions" content={help.getTopic("sessions")} />
              )}
            </div>
            <SecuritySessionsTable
              sessions={sessions.sessions}
              count={sessions.count}
              page={sessions.page}
              pageSize={sessions.pageSize}
              next={sessions.next}
              previous={sessions.previous}
              isLoading={sessions.isLoading}
              error={sessions.error}
              onPageChange={sessions.setPage}
              onSelectSession={handleSelectSession}
              onRetry={sessions.refetch}
            />
          </section>
        )}
      </section>

      <SecurityEventDetailModal
        eventId={selectedEventId}
        event={eventDetail.event}
        isLoading={eventDetail.isLoading}
        error={eventDetail.error}
        onLoad={eventDetail.fetchEvent}
        onClose={closeEventDetail}
      />

      <SecuritySessionDetailModal
        sessionId={selectedSessionId}
        session={sessionDetail.session}
        timelineEvents={sessionDetail.timelineEvents}
        isLoading={sessionDetail.isLoading}
        error={sessionDetail.error}
        onLoad={sessionDetail.fetchSession}
        onClose={closeSessionDetail}
      />
    </main>
  );
}

export default SecurityObservatoryPage;
