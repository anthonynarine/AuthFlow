import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityEmptyState } from "./SecurityEmptyState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, formatSessionId, formatUser, getSessionStatus } from "./securityLabels";

function getSessionId(session) {
  return session?.uuid || session?.id || session?.session_id;
}

export function SecuritySessionsTable({
  sessions,
  count,
  page,
  pageSize,
  next,
  previous,
  isLoading,
  error,
  onPageChange,
  onSelectSession,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  if (isLoading && sessions.length === 0) {
    return <SecurityLoadingState label="Loading sessions" />;
  }

  if (error && sessions.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!sessions.length) {
    return <SecurityEmptyState message="No sessions found." />;
  }

  return (
    <>
      <div className="security-table-wrap">
        <table className="security-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Status</th>
              <th scope="col">Authentication</th>
              <th scope="col">Created</th>
              <th scope="col">Last Seen</th>
              <th scope="col">Expires</th>
              <th scope="col">Session</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const sessionId = getSessionId(session);
              const status = getSessionStatus(session);
              return (
                <tr
                  key={sessionId}
                  onClick={() => onSelectSession(session)}
                  tabIndex={0}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault();
                      onSelectSession(session);
                    }
                  }}
                >
                  <td>{formatUser(session.user)}</td>
                  <td><StatusBadge status={status} type="session" /></td>
                  <td>{session.authentication_method || session.auth_method || "—"}</td>
                  <td>{formatDateTime(session.created_at)}</td>
                  <td>{formatDateTime(session.last_seen_at || session.last_seen)}</td>
                  <td>{formatDateTime(session.expires_at)}</td>
                  <td>
                    <button type="button" className="table-link">
                      {formatSessionId(sessionId)}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="security-pagination">
        <span>{count} sessions</span>
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
