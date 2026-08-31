import React from "react";

function getErrorMessage(error) {
  if (error?.response?.status === 403) {
    return "You do not have permission to view Security Observatory data.";
  }

  if (error?.response?.status >= 500) {
    return "The security service is unavailable right now.";
  }

  if (!error?.response) {
    return "Network error while loading security data.";
  }

  return error?.response?.data?.detail || "Unable to load security data.";
}

export function SecurityErrorState({ error, onRetry, compact = false }) {
  const isForbidden = error?.response?.status === 403;

  return (
    <div className={`security-state security-error${compact ? " compact" : ""}`} role="alert">
      <strong>{isForbidden ? "Permission denied" : "Request failed"}</strong>
      <span>{getErrorMessage(error)}</span>
      {!isForbidden && onRetry && (
        <button type="button" className="security-button secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
