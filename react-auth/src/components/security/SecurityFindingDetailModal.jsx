import React, { useEffect } from "react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, formatShortId, getFindingStatusLabel } from "./securityLabels";

function DetailRow({ label, value, children }) {
  const content = children || value || "—";
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function SafeMetadata({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span>—</span>;
  }

  return <pre className="metadata-block">{JSON.stringify(metadata, null, 2)}</pre>;
}

export function SecurityFindingDetailModal({ findingId, finding, isLoading, error, onLoad, onClose }) {
  useEffect(() => {
    if (findingId) {
      onLoad(findingId).catch(() => {});
    }
  }, [findingId, onLoad]);

  if (!findingId) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finding-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Finding Detail</p>
            <h2 id="finding-detail-heading">{finding ? finding.title : "Security finding"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close finding detail">
            ×
          </button>
        </div>
        {isLoading && <SecurityLoadingState label="Loading finding detail" />}
        {error && <SecurityErrorState error={error} compact />}
        {finding && !isLoading && (
          <>
            <dl className="detail-grid">
              <DetailRow label="Finding key" value={finding.finding_key} />
              <DetailRow label="Description" value={finding.description} />
              <DetailRow label="Severity">
                <SeverityBadge severity={finding.severity} />
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge
                  status={finding.status}
                  type="finding-status"
                  label={finding.status_label || getFindingStatusLabel(finding.status)}
                />
              </DetailRow>
              <DetailRow label="Related control" value={`${finding.control_title} (${finding.control_key})`} />
              <DetailRow label="Domain" value={finding.domain_label} />
              <DetailRow label="Affected system" value={finding.affected_system} />
              <DetailRow label="Affected component" value={finding.affected_component} />
              <DetailRow label="Expected behavior" value={finding.expected_behavior} />
              <DetailRow label="Observed behavior" value={finding.observed_behavior} />
              <DetailRow
                label="Source"
                value={[finding.source_type, finding.source_reference].filter(Boolean).join(" · ") || "—"}
              />
              <DetailRow label="First seen" value={formatDateTime(finding.first_seen_at)} />
              <DetailRow label="Last seen" value={formatDateTime(finding.last_seen_at)} />
              <DetailRow
                label="Resolved at"
                value={finding.resolved_at ? formatDateTime(finding.resolved_at) : "Not resolved"}
              />
              <DetailRow label="Resolution summary" value={finding.resolution_summary} />
              <DetailRow label="Created" value={formatDateTime(finding.created_at)} />
              <DetailRow label="Updated" value={formatDateTime(finding.updated_at)} />
            </dl>

            <div className="security-subsection">
              <h3>Related evidence</h3>
              {finding.evidence_ids && finding.evidence_ids.length > 0 ? (
                <ul className="related-id-list">
                  {finding.evidence_ids.map((evidenceId) => (
                    <li key={evidenceId}>{formatShortId(evidenceId)}</li>
                  ))}
                </ul>
              ) : (
                <p className="security-muted">No evidence has been recorded for this finding yet.</p>
              )}
            </div>

            <div className="security-subsection">
              <h3>Related security events</h3>
              {finding.related_event_ids && finding.related_event_ids.length > 0 ? (
                <ul className="related-id-list">
                  {finding.related_event_ids.map((eventId) => (
                    <li key={eventId}>{formatShortId(eventId)}</li>
                  ))}
                </ul>
              ) : (
                <p className="security-muted">No related security events recorded.</p>
              )}
            </div>

            <div className="security-subsection">
              <h3>Metadata</h3>
              <SafeMetadata metadata={finding.metadata} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
