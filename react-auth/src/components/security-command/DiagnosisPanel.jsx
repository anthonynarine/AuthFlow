import React from "react";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime } from "../security/securityLabels";

function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined || Number.isNaN(Number(confidence))) {
    return null;
  }
  return `${Math.round(Number(confidence) * 100)}%`;
}

/**
 * B-UX4 sections 15-17: dedicated DiagnosisReport presentation, clearly
 * labeled advisory AI reasoning -- never Security Truth. Only fields that
 * exist on the real DiagnosisReport schema are rendered (confidence,
 * facts, alternative_hypotheses, probable_root_cause,
 * recommended_next_action, dropped_evidence_reference_count); there is no
 * "uncertainty"/"limitations" field on the model today, so none is shown.
 *
 * Facts and hypotheses are rendered in visually distinct lists so a reader
 * cannot mistake a model hypothesis for verified evidence.
 */
export function DiagnosisPanel({ diagnosis, isLoading, isActivelyInvestigating }) {
  if (isLoading && !diagnosis && isActivelyInvestigating) {
    return <SecurityLoadingState label="Loading diagnosis" />;
  }

  if (!diagnosis) {
    return null;
  }

  const confidenceLabel = formatConfidence(diagnosis.confidence);

  return (
    <div className="diagnosis-panel">
      <div className="diagnosis-panel-eyebrow-row">
        <span className="security-badge tone-attention diagnosis-panel-badge">AI Diagnosis — Advisory</span>
        {diagnosis.producer_display_name && (
          <span className="diagnosis-panel-producer">by {diagnosis.producer_display_name}</span>
        )}
      </div>
      <p className="diagnosis-panel-disclaimer">
        This is the AI specialist's advisory reasoning, not verified Security Truth. Only SecurityEvidence and
        SecurityControlState are trusted, deterministic state.
      </p>

      {diagnosis.summary && <p className="diagnosis-panel-summary">{diagnosis.summary}</p>}

      {diagnosis.probable_root_cause && (
        <div className="diagnosis-panel-field">
          <p className="diagnosis-panel-field-label">Probable root cause</p>
          <p>{diagnosis.probable_root_cause}</p>
        </div>
      )}

      {confidenceLabel && (
        <div className="diagnosis-panel-field">
          <p className="diagnosis-panel-field-label">Confidence</p>
          <p>{confidenceLabel}</p>
        </div>
      )}

      {Array.isArray(diagnosis.facts) && diagnosis.facts.length > 0 && (
        <div className="diagnosis-panel-field">
          <p className="diagnosis-panel-field-label">Facts</p>
          <ul className="diagnosis-panel-facts-list">
            {diagnosis.facts.map((fact, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(diagnosis.hypotheses) && diagnosis.hypotheses.length > 0 && (
        <div className="diagnosis-panel-field">
          <p className="diagnosis-panel-field-label">Hypotheses</p>
          <ul className="diagnosis-panel-hypotheses-list">
            {diagnosis.hypotheses.map((hypothesis, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{hypothesis}</li>
            ))}
          </ul>
        </div>
      )}

      {diagnosis.recommended_next_action && (
        <div className="diagnosis-panel-field">
          <p className="diagnosis-panel-field-label">Recommended next step</p>
          <p>{diagnosis.recommended_next_action}</p>
        </div>
      )}

      {Number(diagnosis.dropped_evidence_reference_count) > 0 && (
        <p className="diagnosis-panel-caveat">
          {diagnosis.dropped_evidence_reference_count} evidence reference
          {Number(diagnosis.dropped_evidence_reference_count) === 1 ? "" : "s"} the model cited did not resolve to a
          real record and were dropped, never trusted.
        </p>
      )}

      {diagnosis.created_at && (
        <p className="security-muted diagnosis-panel-timestamp">Diagnosed {formatDateTime(diagnosis.created_at)}</p>
      )}
    </div>
  );
}

export default DiagnosisPanel;
