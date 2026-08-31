import React from "react";

export function SecurityLoadingState({ label = "Loading security data" }) {
  return (
    <div className="security-state security-loading" role="status" aria-live="polite">
      <span className="security-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
