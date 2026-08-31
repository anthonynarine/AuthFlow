import React, { useEffect } from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import {
  formatDateTime,
  formatSessionId,
  formatTime,
  formatUser,
  getEventLabel,
  getSessionStatus,
} from "./securityLabels";

function DetailRow({ label, value, children }) {
  const content = children || value || "—";
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function ReplaySequenceHint({ events }) {
  const types = events.map((event) => event.event_type);
  const hasReplayPath = types.includes("TOKEN_REFRESHED")
    && types.includes("REFRESH_REPLAY_DETECTED")
    && types.includes("SESSION_REVOKED");

  if (!hasReplayPath) {
    return null;
  }

  return (
    <div className="replay-sequence" aria-label="Replay sequence detected in related events">
      <span>TOKEN_REFRESHED</span>
      <span aria-hidden="true">↓</span>
      <span>REFRESH_REPLAY_DETECTED</span>
      <span aria-hidden="true">↓</span>
      <span>SESSION_REVOKED</span>
    </div>
  );
}

export function SecuritySessionDetailModal({
  sessionId,
  session,
  timelineEvents,
  isLoading,
  error,
  onLoad,
  onClose,
}) {
  useEffect(() => {
    if (sessionId) {
      onLoad(sessionId).catch(() => {});
    }
  }, [sessionId, onLoad]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Session Detail</p>
            <h2 id="session-detail-heading">Session {formatSessionId(sessionId)}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close session detail">
            ×
          </button>
        </div>
        {isLoading && <SecurityLoadingState label="Loading session detail" />}
        {error && <SecurityErrorState error={error} compact />}
        {session && !isLoading && (
          <>
            <dl className="detail-grid">
              <DetailRow label="Session UUID" value={session.uuid || session.id || session.session_id} />
              <DetailRow label="User" value={formatUser(session.user)} />
              <DetailRow label="Status"><StatusBadge status={getSessionStatus(session)} type="session" /></DetailRow>
              <DetailRow label="Authentication method" value={session.authentication_method || session.auth_method} />
              <DetailRow label="Authentication strength" value={session.authentication_strength || session.auth_strength} />
              <DetailRow label="Created" value={formatDateTime(session.created_at)} />
              <DetailRow label="Last seen" value={formatDateTime(session.last_seen_at || session.last_seen)} />
              <DetailRow label="Expires" value={formatDateTime(session.expires_at)} />
              <DetailRow label="Revoked at" value={formatDateTime(session.revoked_at)} />
              <DetailRow label="Revocation reason" value={session.revocation_reason} />
              <DetailRow label="Created IP" value={session.created_ip || session.created_ip_address} />
              <DetailRow label="Last IP" value={session.last_ip || session.last_ip_address} />
              <DetailRow label="User agent" value={session.user_agent} />
            </dl>

            <section className="timeline-section" aria-labelledby="session-timeline-heading">
              <div className="security-section-heading compact-heading">
                <div>
                  <p className="security-eyebrow">Related Events</p>
                  <h3 id="session-timeline-heading">Session Timeline</h3>
                </div>
              </div>
              <ReplaySequenceHint events={timelineEvents} />
              {timelineEvents.length ? (
                <ol className="session-timeline">
                  {timelineEvents.map((event) => (
                    <li key={event.id || event.uuid || `${event.event_type}-${event.timestamp}`}>
                      <time>{formatTime(event.timestamp || event.created_at)}</time>
                      <span>{getEventLabel(event.event_type)}</span>
                      <small>{event.reason_code || event.outcome || ""}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="timeline-empty">No related security events found for this session.</p>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
