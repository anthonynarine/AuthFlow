import React, { useMemo, useState } from "react";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime, formatShortId, formatTime, humanizeEnum } from "../security/securityLabels";
import { resolveActorIdentity } from "./actorIdentity";
import { getConciseEventLabel, getEventOutcome, getEventStage } from "./timelineEventPresentation";
import { normalizeSecurityRoleText } from "./roleTerminology";

function buildCopyableTimeline(events) {
  return events
    .map((event) => {
      const actor = resolveActorIdentity(event).label;
      const label = getConciseEventLabel(event);
      const outcome = getEventOutcome(event);
      const action = outcome && outcome !== label ? `${label} - ${outcome}` : label;
      return `${formatTime(event.timestamp)} ${actor} - ${action}`;
    })
    .join("\n");
}

function sourceLabel(event) {
  const sourceDisplayLabel = event?.source_display_label || event?.source?.display_label || event?.source?.label;
  if (sourceDisplayLabel) {
    return normalizeSecurityRoleText(sourceDisplayLabel);
  }
  const sourceType = event?.source_type || event?.source?.type;
  const sourceId = event?.source_id || event?.source?.id;
  if (!sourceType && !sourceId) {
    return null;
  }
  return `${sourceType || "Artifact"}${sourceId ? ` #${formatShortId(sourceId)}` : ""}`;
}

function technicalRows(event, conciseLabel) {
  return [
    ["Event type", event?.event_type],
    ["Backend summary", event?.summary && event.summary !== conciseLabel ? normalizeSecurityRoleText(event.summary) : null],
    ["Status", event?.status],
    ["Source", sourceLabel(event)],
    ["Source type", event?.source_type],
    ["Source ID", event?.source_id],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");
}

export function CaseTimeline({ events, isLoading, error, isStale, lastUpdated, onRetry }) {
  const [copyState, setCopyState] = useState("idle");
  const copyText = useMemo(() => buildCopyableTimeline(events), [events]);

  const copyTimeline = async () => {
    if (!copyText || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(copyText);
    setCopyState("copied");
  };

  if (isLoading && events.length === 0) {
    return <SecurityLoadingState label="Loading case timeline" />;
  }

  if (error && events.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} compact />;
  }

  return (
    <div className="case-timeline">
      {events.length > 0 && (
        <div className="case-timeline-toolbar">
          <span className="case-timeline-count">{events.length} workflow events</span>
          <button type="button" className="security-button secondary case-timeline-copy" onClick={copyTimeline}>
            {copyState === "copied" ? "Copied" : "Copy timeline"}
          </button>
        </div>
      )}
      {isStale && (
        <p className="case-timeline-stale">
          Live updates temporarily unavailable. Showing the last known state
          {lastUpdated ? ` from ${formatDateTime(lastUpdated)}` : ""}.
        </p>
      )}
      {events.length === 0 ? (
        <p className="security-command-empty">No workflow events yet.</p>
      ) : (
        <ol className="case-timeline-list" aria-label="Case workflow timeline">
          {events.map((event, index) => {
            const actor = resolveActorIdentity(event);
            const Icon = actor.icon;
            const stage = getEventStage(event);
            const previousStage = getEventStage(events[index - 1]);
            const conciseLabel = getConciseEventLabel(event);
            const outcome = getEventOutcome(event);
            const rows = technicalRows(event, conciseLabel);

            return (
              <React.Fragment key={event.id || `${event.timestamp}-${event.event_type}-${index}`}>
                {stage && stage !== previousStage && <li className="case-timeline-stage">{stage}</li>}
                <li className={`case-timeline-row case-timeline-row--${actor.variant}`}>
                  <div className="case-timeline-marker" aria-hidden="true">
                    <span className="case-timeline-dot"><Icon /></span>
                  </div>
                  <time className="case-timeline-time" dateTime={event.timestamp}>
                    {formatTime(event.timestamp)}
                  </time>
                  <div className="case-timeline-actor-block">
                    <span className={`case-timeline-actor case-timeline-actor--${actor.variant}`}>
                      <Icon aria-hidden="true" />
                      {actor.label}
                    </span>
                  </div>
                  <div className="case-timeline-main">
                    <p className="case-timeline-summary">
                      {outcome && outcome !== conciseLabel ? `${conciseLabel} - ` : ""}
                      {outcome || conciseLabel}
                    </p>
                    {sourceLabel(event) && <p className="case-timeline-artifact">Artifact: {sourceLabel(event)}</p>}
                    {rows.length > 0 && (
                      <details className="case-timeline-details">
                        <summary>Technical details</summary>
                        <dl>
                          {rows.map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{label === "Status" ? humanizeEnum(value) : String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                  </div>
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      )}
    </div>
  );
}
