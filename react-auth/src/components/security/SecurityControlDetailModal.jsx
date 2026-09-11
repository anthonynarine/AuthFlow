import React, { useEffect } from "react";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { SecurityInfoButton } from "./SecurityInfoButton";
import {
  formatDateTime,
  getControlStatusLabel,
  getControlTypeDescription,
  getEvidenceResultLabel,
  getFindingStatusLabel,
  isEvidenceExpired,
} from "./securityLabels";

function DetailRow({ label, value, children }) {
  const content = children || value || "—";
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

export function SecurityControlDetailModal({ controlKey, control, isLoading, error, onLoad, onClose }) {
  useEffect(() => {
    if (controlKey) {
      onLoad(controlKey).catch(() => {});
    }
  }, [controlKey, onLoad]);

  if (!controlKey) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="control-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div className="control-detail-heading-row">
            <div>
              <p className="security-eyebrow">Control Detail</p>
              <h2 id="control-detail-heading">{control ? control.title : controlKey}</h2>
            </div>
            {control?.help && <SecurityInfoButton title={control.help.title || control.title} content={control.help} />}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close control detail">
            ×
          </button>
        </div>
        {isLoading && <SecurityLoadingState label="Loading control detail" />}
        {error && <SecurityErrorState error={error} compact />}
        {control && !isLoading && (
          <>
            <dl className="detail-grid">
              <DetailRow label="Control key" value={control.control_key} />
              <DetailRow label="Description" value={control.description} />
              <DetailRow label="Domain" value={control.domain_label} />
              <DetailRow label="Type">
                <div>
                  {control.control_type_label}
                  <span className="row-subtext">{getControlTypeDescription(control.control_type)}</span>
                </div>
              </DetailRow>
              <DetailRow label="Current status">
                <StatusBadge
                  status={control.status}
                  type="control-status"
                  label={control.status_label || getControlStatusLabel(control.status)}
                />
              </DetailRow>
              <DetailRow label="Status reason" value={control.status_reason} />
              <DetailRow label="Severity if failed" value={control.severity_if_failed_label} />
              <DetailRow label="Lifecycle" value={control.lifecycle_label} />
              <DetailRow label="Last evaluated" value={formatDateTime(control.last_evaluated_at)} />
              <DetailRow label="Last evidence" value={formatDateTime(control.last_evidence_at)} />
              <DetailRow label="Next review" value={formatDateTime(control.next_review_at)} />
            </dl>

            <div className="security-subsection">
              <h3>Related evidence</h3>
              {control.recent_evidence && control.recent_evidence.length > 0 ? (
                <ul className="related-list">
                  {control.recent_evidence.map((evidence) => (
                    <li key={evidence.id}>
                      <div>
                        <strong>{evidence.title}</strong>
                        <span className="row-subtext">
                          {evidence.evidence_type_label} · {formatDateTime(evidence.observed_at)}
                        </span>
                      </div>
                      <div className="related-list-status">
                        <StatusBadge
                          status={evidence.result}
                          type="evidence-result"
                          label={evidence.result_label || getEvidenceResultLabel(evidence.result)}
                        />
                        {isEvidenceExpired(evidence) && <span className="expired-flag">Expired</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="security-muted">No evidence has been recorded for this control yet.</p>
              )}
            </div>

            <div className="security-subsection">
              <h3>Related findings</h3>
              {control.open_findings && control.open_findings.length > 0 ? (
                <ul className="related-list">
                  {control.open_findings.map((finding) => (
                    <li key={finding.id}>
                      <div>
                        <strong>{finding.title}</strong>
                        <span className="row-subtext">
                          First seen {formatDateTime(finding.first_seen_at)} · Last seen{" "}
                          {formatDateTime(finding.last_seen_at)}
                        </span>
                      </div>
                      <div className="related-list-status">
                        <SeverityBadge severity={finding.severity} />
                        <StatusBadge
                          status={finding.status}
                          type="finding-status"
                          label={finding.status_label || getFindingStatusLabel(finding.status)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="security-muted">No findings match the current filters.</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
