import React, { useEffect, useRef } from "react";
import {
  environmentLabel,
  getCategoryLabel,
  getPlaybookStatusLabel,
  getPlaybookStatusTone,
  getSafeEnvironments,
  hasUnsafeProductionEnvironment,
  isSafelyExecutable,
} from "./securityExerciseLabels";

function DetailRow({ label, value, children }) {
  const content = children ?? (value || "—");
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function ListValue({ items, emptyLabel }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <span>{emptyLabel}</span>;
  }
  return (
    <ul className="related-id-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function PlaybookDetailModal({ playbook, onClose, onRunExercise, canRun = true }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!playbook) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playbook, onClose]);

  if (!playbook) {
    return null;
  }

  const runnable = isSafelyExecutable(playbook) && canRun;
  const unsafeProduction = hasUnsafeProductionEnvironment(playbook.allowed_environments);
  const safeEnvironments = getSafeEnvironments(playbook.allowed_environments);

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="playbook-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">
              {getCategoryLabel(playbook.category)} ·{" "}
              <span className={`security-badge playbook-status-${getPlaybookStatusTone(playbook.implementation_status)}`}>
                {getPlaybookStatusLabel(playbook.implementation_status)}
              </span>
            </p>
            <h2 id="playbook-detail-heading">{playbook.title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close playbook detail"
          >
            ×
          </button>
        </div>

        {unsafeProduction && (
          <p className="security-error compact" role="alert">
            <strong>Production exercise blocked</strong>
            <span>
              This playbook advertised a production environment. B-RED1 adversarial testing is TEST/STAGING only, so
              production has been removed from the runnable environments below.
            </span>
          </p>
        )}

        <p className="playbook-detail-description">{playbook.description}</p>

        <dl className="detail-grid">
          <DetailRow label="What this tests" value={playbook.threat_summary} />
          <DetailRow label="Threat class" value={playbook.threat_class} />
          <DetailRow label="Expected secure behavior" value={playbook.expected_secure_behavior} />
          <DetailRow label="Failure condition" value={playbook.failure_condition} />
          <DetailRow label="Evidence type" value={playbook.evidence_type} />
          <DetailRow label="Evidence summary" value={playbook.evidence_summary} />
          <DetailRow label="Risk level" value={playbook.risk_level} />
          <DetailRow label="Required authority" value={playbook.required_authority?.label} />
          <DetailRow label="Required capability" value={playbook.required_capability} />
          <DetailRow label="Timeout" value={playbook.timeout_seconds ? `${playbook.timeout_seconds}s` : "—"} />
          <DetailRow label="Allowed environments (safe)">
            {safeEnvironments.length > 0 ? safeEnvironments.map(environmentLabel).join(", ") : "None available"}
          </DetailRow>
          <DetailRow label="Resource budget">
            {playbook.resource_budget
              ? `${playbook.resource_budget.max_requests} requests · concurrency ${playbook.resource_budget.concurrency_limit} · max ${playbook.resource_budget.max_runtime_seconds}s`
              : "—"}
          </DetailRow>
          <DetailRow label="Target controls">
            <ListValue
              items={(playbook.target_controls || []).map((control) => control.title)}
              emptyLabel="No target controls listed."
            />
          </DetailRow>
          <DetailRow label="Applicability">
            <ListValue items={playbook.applicability} emptyLabel="No applicability notes." />
          </DetailRow>
          <DetailRow label="Prerequisites">
            <ListValue items={playbook.prerequisites} emptyLabel="None." />
          </DetailRow>
          <DetailRow label="Tags">
            <ListValue items={playbook.tags} emptyLabel="No tags." />
          </DetailRow>
        </dl>

        <div className="security-modal-footer">
          <button type="button" className="security-button secondary" onClick={onClose}>
            Close
          </button>
          {runnable && (
            <button type="button" className="security-button primary" onClick={() => onRunExercise(playbook)}>
              Run Exercise
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default PlaybookDetailModal;
