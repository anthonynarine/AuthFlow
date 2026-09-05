import React, { useEffect } from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, getEvidenceResultLabel, isEvidenceExpired } from "./securityLabels";

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

export function SecurityEvidenceDetailModal({ evidenceId, evidence, isLoading, error, onLoad, onClose }) {
  useEffect(() => {
    if (evidenceId) {
      onLoad(evidenceId).catch(() => {});
    }
  }, [evidenceId, onLoad]);

  if (!evidenceId) {
    return null;
  }

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-detail-heading"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Evidence Detail</p>
            <h2 id="evidence-detail-heading">{evidence ? evidence.title : "Security evidence"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close evidence detail">
            ×
          </button>
        </div>
        {isLoading && <SecurityLoadingState label="Loading evidence detail" />}
        {error && <SecurityErrorState error={error} compact />}
        {evidence && !isLoading && (
          <dl className="detail-grid">
            <DetailRow label="Control" value={`${evidence.control_title} (${evidence.control_key})`} />
            <DetailRow label="Domain" value={evidence.domain_label} />
            <DetailRow label="Evidence type" value={evidence.evidence_type_label} />
            <DetailRow label="Result">
              <StatusBadge
                status={evidence.result}
                type="evidence-result"
                label={evidence.result_label || getEvidenceResultLabel(evidence.result)}
              />
              {isEvidenceExpired(evidence) && <span className="expired-flag">Evidence no longer current</span>}
            </DetailRow>
            <DetailRow
              label="Source"
              value={[evidence.source_type, evidence.source_name].filter(Boolean).join(" · ") || "—"}
            />
            <DetailRow label="Source reference" value={evidence.source_reference} />
            <DetailRow label="Summary" value={evidence.summary} />
            <DetailRow label="Observed" value={formatDateTime(evidence.observed_at)} />
            <DetailRow
              label="Valid until"
              value={evidence.valid_until ? formatDateTime(evidence.valid_until) : "No expiration"}
            />
            <DetailRow label="Recorded" value={formatDateTime(evidence.created_at)} />
            <DetailRow label="Metadata">
              <SafeMetadata metadata={evidence.metadata} />
            </DetailRow>
          </dl>
        )}
      </section>
    </div>
  );
}
