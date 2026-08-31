import React from "react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { SecurityEmptyState } from "./SecurityEmptyState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, formatSessionId, formatUser, getEventLabel } from "./securityLabels";

function getEventId(event) {
  return event?.id || event?.uuid || event?.event_id;
}

export function SecurityEventsTable({
  events,
  count,
  page,
  pageSize,
  next,
  previous,
  isLoading,
  error,
  onPageChange,
  onSelectEvent,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  if (isLoading && events.length === 0) {
    return <SecurityLoadingState label="Loading security events" />;
  }

  if (error && events.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!events.length) {
    return <SecurityEmptyState message="No security events match these filters." />;
  }

  return (
    <>
      <div className="security-table-wrap">
        <table className="security-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Event</th>
              <th scope="col">User</th>
              <th scope="col">Severity</th>
              <th scope="col">Outcome</th>
              <th scope="col">Reason</th>
              <th scope="col">Session</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const eventId = getEventId(event);
              const isReplay = event.event_type === "REFRESH_REPLAY_DETECTED";
              return (
                <tr
                  key={eventId}
                  className={isReplay ? "replay-row" : undefined}
                  onClick={() => onSelectEvent(event)}
                  tabIndex={0}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault();
                      onSelectEvent(event);
                    }
                  }}
                >
                  <td>{formatDateTime(event.timestamp || event.created_at)}</td>
                  <td>
                    <button type="button" className="table-link">
                      {getEventLabel(event.event_type)}
                    </button>
                    {isReplay && <span className="row-note">Replay detected</span>}
                  </td>
                  <td>{formatUser(event.user)}</td>
                  <td><SeverityBadge severity={event.severity} /></td>
                  <td><StatusBadge status={event.outcome} /></td>
                  <td>{event.reason_code || event.reason || "—"}</td>
                  <td>{formatSessionId(event.session || event.session_id)}</td>
                  <td>{event.ip_address || event.ip || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="security-pagination">
        <span>{count} events</span>
        <div>
          <button
            type="button"
            className="security-button secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={!previous || page <= 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="security-button secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={!next && page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
