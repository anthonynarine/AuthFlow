import React from "react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { SecurityEmptyState } from "./SecurityEmptyState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, getFindingStatusLabel } from "./securityLabels";

export function SecurityFindingsTable({
  findings,
  count,
  page,
  pageSize,
  next,
  previous,
  isLoading,
  error,
  onPageChange,
  onSelectFinding,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  if (isLoading && findings.length === 0) {
    return <SecurityLoadingState label="Loading security findings" />;
  }

  if (error && findings.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!findings.length) {
    return <SecurityEmptyState message="No findings match the current filters." />;
  }

  return (
    <>
      <div className="security-table-wrap">
        <table className="security-table">
          <thead>
            <tr>
              <th scope="col">Finding</th>
              <th scope="col">Control</th>
              <th scope="col">Severity</th>
              <th scope="col">Status</th>
              <th scope="col">Affected system</th>
              <th scope="col">First seen</th>
              <th scope="col">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => (
              <tr
                key={finding.id}
                onClick={() => onSelectFinding(finding)}
                tabIndex={0}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                    keyboardEvent.preventDefault();
                    onSelectFinding(finding);
                  }
                }}
              >
                <td>
                  <button type="button" className="table-link">
                    {finding.title}
                  </button>
                  <span className="row-subtext">{finding.finding_key}</span>
                </td>
                <td>
                  {finding.control_title}
                  <span className="row-subtext">{finding.control_key}</span>
                </td>
                <td>
                  <SeverityBadge severity={finding.severity} />
                </td>
                <td>
                  <StatusBadge
                    status={finding.status}
                    type="finding-status"
                    label={finding.status_label || getFindingStatusLabel(finding.status)}
                  />
                </td>
                <td>{[finding.affected_system, finding.affected_component].filter(Boolean).join(" / ") || "—"}</td>
                <td>{formatDateTime(finding.first_seen_at)}</td>
                <td>{formatDateTime(finding.last_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="security-pagination">
        <span>{count} findings</span>
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
