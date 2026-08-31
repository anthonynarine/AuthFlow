import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowGoBackLine, RiRefreshLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useSecuritySummary } from "../../hooks/useSecuritySummary";
import { useSecurityEvents } from "../../hooks/useSecurityEvents";
import { useSecurityEventDetail } from "../../hooks/useSecurityEventDetail";
import { useSecuritySessions } from "../../hooks/useSecuritySessions";
import { useSecuritySessionDetail } from "../../hooks/useSecuritySessionDetail";
import { SecurityOverview } from "./SecurityOverview";
import { SecurityEventFilters } from "./SecurityEventFilters";
import { SecurityEventsTable } from "./SecurityEventsTable";
import { SecurityEventDetailModal } from "./SecurityEventDetailModal";
import { SecuritySessionsTable } from "./SecuritySessionsTable";
import { SecuritySessionDetailModal } from "./SecuritySessionDetailModal";
import { SecurityErrorState } from "./SecurityErrorState";
import { formatDateTime } from "./securityLabels";
import "./SecurityObservatory.css";

function isForbidden(...errors) {
  return errors.some((error) => error?.response?.status === 403);
}

function getRecordId(record) {
  return record?.uuid || record?.id || record?.session_id || record?.event_id;
}

export function SecurityObservatoryPage() {
  const summary = useSecuritySummary();
  const events = useSecurityEvents();
  const eventDetail = useSecurityEventDetail();
  const sessions = useSecuritySessions();
  const sessionDetail = useSecuritySessionDetail();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const forbidden = isForbidden(summary.error, events.error, sessions.error);

  const refreshAll = useCallback(() => {
    Promise.allSettled([
      summary.refetch(),
      events.refetch(),
      sessions.refetch(),
    ]);
  }, [events, sessions, summary]);

  useEffect(() => {
    const handleFocus = () => refreshAll();
    window.addEventListener("focus", handleFocus);
    const timer = window.setInterval(refreshAll, 60000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(timer);
    };
  }, [refreshAll]);

  const lastUpdated = [summary.lastUpdated, events.lastUpdated, sessions.lastUpdated]
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
            <p>Authentication, session, and security activity</p>
          </div>
          <div className="security-header-actions">
            <span className="read-only-chip">Read only</span>
            <button type="button" className="security-button primary" onClick={refreshAll}>
              <RiRefreshLine /> Refresh
            </button>
            <span className="last-updated">
              Last updated {lastUpdated ? formatDateTime(lastUpdated) : "—"}
            </span>
          </div>
        </header>

        <SecurityOverview
          summary={summary.summary}
          isLoading={summary.isLoading}
          error={summary.error}
          onRetry={summary.refetch}
        />

        <section className="security-panel" aria-labelledby="security-events-heading">
          <div className="security-section-heading">
            <div>
              <p className="security-eyebrow">Recent Security Events</p>
              <h2 id="security-events-heading">Events</h2>
            </div>
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

        <section className="security-panel" aria-labelledby="security-sessions-heading">
          <div className="security-section-heading">
            <div>
              <p className="security-eyebrow">Sessions</p>
              <h2 id="security-sessions-heading">Authentication Sessions</h2>
            </div>
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
