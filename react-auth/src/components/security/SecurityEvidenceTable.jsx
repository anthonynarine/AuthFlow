import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityEmptyState } from "./SecurityEmptyState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, getEvidenceResultLabel, isEvidenceExpired } from "./securityLabels";

export function SecurityEvidenceTable({
  evidence,
  count,
  page,
  pageSize,
  next,
  previous,
  isLoading,
  error,
  onPageChange,
  onSelectEvidence,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  if (isLoading && evidence.length === 0) {
    return <SecurityLoadingState label="Loading security evidence" />;
  }

  if (error && evidence.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!evidence.length) {
    return <SecurityEmptyState message="No evidence has been recorded yet." />;
  }

  return (
    <>
      <div className="security-table-wrap">
        <table className="security-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Control</th>
              <th scope="col">Type</th>
              <th scope="col">Result</th>
              <th scope="col">Source</th>
              <th scope="col">Observed</th>
              <th scope="col">Valid until</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item) => {
              const expired = isEvidenceExpired(item);
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectEvidence(item)}
                  tabIndex={0}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault();
                      onSelectEvidence(item);
                    }
                  }}
                >
                  <td>
                    <button type="button" className="table-link">
                      {item.title}
                    </button>
                  </td>
                  <td>
                    {item.control_title}
                    <span className="row-subtext">{item.control_key}</span>
                  </td>
                  <td>{item.evidence_type_label}</td>
                  <td>
                    <StatusBadge
                      status={item.result}
                      type="evidence-result"
                      label={item.result_label || getEvidenceResultLabel(item.result)}
                    />
                    {expired && <span className="expired-flag">Expired</span>}
                  </td>
                  <td>{item.source_name || item.source_type || "—"}</td>
                  <td>{formatDateTime(item.observed_at)}</td>
                  <td>{item.valid_until ? formatDateTime(item.valid_until) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="security-pagination">
        <span>{count} evidence records</span>
        <div>
          <button
            type="button"
            className="security-button secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={!previous || page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="security-button secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={!next && page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
