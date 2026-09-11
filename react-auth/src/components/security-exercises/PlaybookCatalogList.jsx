import React from "react";
import { SecurityEmptyState } from "../security/SecurityEmptyState";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { PlaybookCard } from "./PlaybookCard";
import { getNetworkErrorMessage } from "./securityExerciseLabels";

export function PlaybookCatalogList({
  playbooks,
  isLoading,
  error,
  isStale,
  onRetry,
  onViewDetails,
  onRunExercise,
  canRun = true,
}) {
  if (isLoading && playbooks.length === 0) {
    return <SecurityLoadingState label="Loading playbook catalog" />;
  }

  if (error && playbooks.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (playbooks.length === 0) {
    return <SecurityEmptyState message="No playbooks match the current filters." />;
  }

  return (
    <div className="playbook-catalog">
      {isStale && error && (
        <p className="security-muted stale-banner" role="status">
          Showing the last known catalog. {getNetworkErrorMessage(error)}
          {onRetry && (
            <button type="button" className="security-button secondary" onClick={onRetry}>
              Retry
            </button>
          )}
        </p>
      )}
      <div className="playbook-catalog-grid">
        {playbooks.map((playbook) => (
          <PlaybookCard
            key={`${playbook.key}:${playbook.version}`}
            playbook={playbook}
            onViewDetails={onViewDetails}
            onRunExercise={onRunExercise}
            canRun={canRun}
          />
        ))}
      </div>
    </div>
  );
}

export default PlaybookCatalogList;
