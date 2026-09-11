import React from "react";
import {
  environmentLabel,
  getCategoryLabel,
  getPlaybookStatusLabel,
  getPlaybookStatusTone,
  getSafeEnvironments,
  isSafelyExecutable,
} from "./securityExerciseLabels";

export function PlaybookCard({ playbook, onViewDetails, onRunExercise, canRun = true }) {
  const statusTone = getPlaybookStatusTone(playbook.implementation_status);
  const runnable = isSafelyExecutable(playbook) && canRun;
  const safeEnvironments = getSafeEnvironments(playbook.allowed_environments);
  const cardHeadingId = `playbook-card-${playbook.key}-${playbook.version}`;

  return (
    <article className="playbook-card" aria-labelledby={cardHeadingId}>
      <div className="playbook-card-head">
        <span className={`security-badge playbook-status-${statusTone}`}>
          {getPlaybookStatusLabel(playbook.implementation_status)}
        </span>
        <span className="playbook-card-category">{getCategoryLabel(playbook.category)}</span>
      </div>
      <h3 id={cardHeadingId} className="playbook-card-title">
        {playbook.title}
      </h3>
      <p className="playbook-card-description">{playbook.description}</p>

      {Array.isArray(playbook.target_controls) && playbook.target_controls.length > 0 && (
        <ul className="related-id-list playbook-card-controls">
          {playbook.target_controls.map((control) => (
            <li key={control.control_key}>{control.title}</li>
          ))}
        </ul>
      )}

      <dl className="playbook-card-meta">
        <div>
          <dt>Allowed environments</dt>
          <dd>
            {safeEnvironments.length > 0
              ? safeEnvironments.map(environmentLabel).join(", ")
              : "None available"}
          </dd>
        </div>
        <div>
          <dt>Risk level</dt>
          <dd>{playbook.risk_level || "—"}</dd>
        </div>
      </dl>

      <div className="playbook-card-actions">
        <button type="button" className="security-button secondary" onClick={() => onViewDetails(playbook)}>
          View Details
        </button>
        {runnable && (
          <button
            type="button"
            className="security-button primary"
            onClick={() => onRunExercise(playbook)}
          >
            Run Exercise
          </button>
        )}
      </div>
    </article>
  );
}

export default PlaybookCard;
