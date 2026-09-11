import React from "react";
import { SecurityInfoButton } from "./SecurityInfoButton";
import { StatusBadge } from "./StatusBadge";
import {
  formatDateTime,
  formatUserEmail,
  getRecordUserEmail,
  getSessionStatus,
} from "./securityLabels";

function getCurrentSessionFromList(sessions) {
  return sessions.find((session) => (
    session.is_current
    || session.is_current_session
    || session.current
  )) || null;
}

function Detail({ label, value, children }) {
  return (
    <div className="current-session-detail">
      <span>{label}</span>
      <strong>{children || value || "—"}</strong>
    </div>
  );
}

export function CurrentSessionSummary({ user, sessions = [], summary, info }) {
  const currentSession = summary?.current_session || getCurrentSessionFromList(sessions);
  const email = currentSession ? getRecordUserEmail(currentSession) : formatUserEmail(user);
  const status = currentSession ? getSessionStatus(currentSession) : null;

  return (
    <section className="security-panel current-session-panel" aria-labelledby="current-session-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Current Session</p>
          <h2 id="current-session-heading">Signed-in context</h2>
        </div>
        {info && (
          <SecurityInfoButton
            title={info.title}
            label={info.label}
            content={info.content}
            currentStatus={status}
          />
        )}
      </div>
      <div className="current-session-grid">
        <Detail label="User email" value={email} />
        <Detail label="Status">
          {status ? <StatusBadge status={status} type="session" /> : "—"}
        </Detail>
        <Detail
          label="Auth method"
          value={currentSession?.authentication_method || currentSession?.auth_method}
        />
        <Detail label="Created" value={formatDateTime(currentSession?.created_at)} />
        <Detail
          label="Last seen"
          value={formatDateTime(currentSession?.last_seen_at || currentSession?.last_seen)}
        />
        <Detail label="Expires" value={formatDateTime(currentSession?.expires_at)} />
      </div>
      {!currentSession && (
        <p className="current-session-note">
          Current session timing is unavailable from the sessions payload.
        </p>
      )}
    </section>
  );
}
