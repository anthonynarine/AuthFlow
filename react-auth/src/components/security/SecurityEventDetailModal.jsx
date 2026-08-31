import React, { useEffect } from "react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, formatSessionId, formatUser, getEventLabel } from "./securityLabels";

function DetailRow({ label, value, children }) {
  const content = children || value || "—";
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function SafeMetadata({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span>—</span>;
  }

  return <pre className="metadata-block">{JSON.stringify(metadata, null, 2)}</pre>;
}

export function SecurityEventDetailModal({ eventId, event, isLoading, error, onLoad, onClose }) {
  useEffect(() => {
    if (eventId) {
      onLoad(eventId).catch(() => {});
    }
  }, [eventId, onLoad]);

  if (!eventId) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Event Detail</p>
            <h2 id="event-detail-heading">{event ? getEventLabel(event.event_type) : "Security event"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close event detail">
            ×
          </button>
        </div>
        {isLoading && <SecurityLoadingState label="Loading event detail" />}
        {error && <SecurityErrorState error={error} compact />}
        {event && !isLoading && (
          <dl className="detail-grid">
            <DetailRow label="Event" value={getEventLabel(event.event_type)} />
            <DetailRow label="Raw event type" value={event.event_type} />
            <DetailRow label="Timestamp" value={formatDateTime(event.timestamp || event.created_at)} />
            <DetailRow label="Severity"><SeverityBadge severity={event.severity} /></DetailRow>
            <DetailRow label="Outcome"><StatusBadge status={event.outcome} /></DetailRow>
            <DetailRow label="User" value={formatUser(event.user)} />
            <DetailRow label="Session ID" value={formatSessionId(event.session || event.session_id)} />
            <DetailRow label="IP address" value={event.ip_address || event.ip} />
            <DetailRow label="User agent" value={event.user_agent} />
            <DetailRow label="HTTP method" value={event.http_method || event.method} />
            <DetailRow label="Request path" value={event.request_path || event.path} />
            <DetailRow label="Reason code" value={event.reason_code || event.reason} />
            <DetailRow label="Metadata"><SafeMetadata metadata={event.metadata} /></DetailRow>
          </dl>
        )}
      </section>
    </div>
  );
}
