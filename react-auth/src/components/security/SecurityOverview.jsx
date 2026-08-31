import React from "react";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";

const CARDS = [
  { key: "active_sessions", label: "Active Sessions" },
  { key: "successful_logins", label: "Successful Logins" },
  { key: "failed_logins", label: "Failed Logins" },
  { key: "replay_events", label: "Replay Events", highlight: true },
  { key: "sessions_revoked", label: "Sessions Revoked" },
];

export function SecurityOverview({ summary, isLoading, error, onRetry }) {
  if (isLoading && !summary) {
    return <SecurityLoadingState label="Loading security overview" />;
  }

  if (error && !summary) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  const windowLabel = summary?.window_hours ? `Last ${summary.window_hours} hours` : "Current window";

  return (
    <section className="security-panel" aria-labelledby="security-overview-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Overview</p>
          <h2 id="security-overview-heading">Security Overview</h2>
        </div>
        <span className="window-chip">{windowLabel}</span>
      </div>
      <div className="security-summary-grid">
        {CARDS.map((card) => (
          <div className={`summary-card${card.highlight ? " replay-card" : ""}`} key={card.key}>
            <span>{card.label}</span>
            <strong>{summary?.[card.key] ?? "—"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
