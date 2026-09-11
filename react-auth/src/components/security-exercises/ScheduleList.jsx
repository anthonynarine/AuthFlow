import React from "react";
import { SecurityEmptyState } from "../security/SecurityEmptyState";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { getNetworkErrorMessage } from "./securityExerciseLabels";
import { ScheduleCard } from "./ScheduleCard";

function findPlaybookTitle(playbooks, playbookKey, playbookVersion) {
  const match = (playbooks || []).find(
    (playbook) => playbook.key === playbookKey && playbook.version === playbookVersion
  );
  return match?.title || null;
}

export function ScheduleList({
  schedules,
  playbooks,
  isLoading,
  error,
  isStale,
  canManage,
  onRetry,
  onView,
  onViewOccurrences,
  onViewRun,
  onToggleEnabled,
}) {
  if (isLoading && schedules.length === 0) {
    return <SecurityLoadingState label="Loading schedules" />;
  }

  if (error && schedules.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (schedules.length === 0) {
    return (
      <SecurityEmptyState
        message="No Security Exercise schedules yet. Schedules can automatically request approved exercises on a bounded cadence in Test or Staging."
      />
    );
  }

  return (
    <div className="schedule-list">
      {isStale && error && (
        <p className="security-muted stale-banner" role="status">
          Showing the last known schedules. {getNetworkErrorMessage(error)}
          {onRetry && (
            <button type="button" className="security-button secondary" onClick={onRetry}>
              Retry
            </button>
          )}
        </p>
      )}
      <div className="schedule-list-grid">
        {schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            playbookTitle={findPlaybookTitle(playbooks, schedule.playbook_key, schedule.playbook_version)}
            canManage={canManage}
            onView={onView}
            onViewOccurrences={onViewOccurrences}
            onViewRun={onViewRun}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </div>
    </div>
  );
}

export default ScheduleList;
