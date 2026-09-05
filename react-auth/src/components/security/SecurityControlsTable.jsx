import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityEmptyState } from "./SecurityEmptyState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime, getControlStatusLabel } from "./securityLabels";

export function SecurityControlsTable({ controls, isLoading, error, onSelectControl, onRetry }) {
  if (isLoading && controls.length === 0) {
    return <SecurityLoadingState label="Loading security controls" />;
  }

  if (error && controls.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} />;
  }

  if (!controls.length) {
    return <SecurityEmptyState message="No controls match the current filters." />;
  }

  return (
    <div className="security-table-wrap">
      <table className="security-table">
        <thead>
          <tr>
            <th scope="col">Control</th>
            <th scope="col">Domain</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Status reason</th>
            <th scope="col">Last evaluated</th>
            <th scope="col">Last evidence</th>
            <th scope="col">Next review</th>
          </tr>
        </thead>
        <tbody>
          {controls.map((control) => (
            <tr
              key={control.control_key}
              onClick={() => onSelectControl(control)}
              tabIndex={0}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                  keyboardEvent.preventDefault();
                  onSelectControl(control);
                }
              }}
            >
              <td>
                <button type="button" className="table-link">
                  {control.title}
                </button>
                <span className="row-subtext">{control.control_key}</span>
              </td>
              <td>{control.domain_label}</td>
              <td>{control.control_type_label}</td>
              <td>
                <StatusBadge
                  status={control.status}
                  type="control-status"
                  label={control.status_label || getControlStatusLabel(control.status)}
                />
              </td>
              <td>{control.status_reason || "—"}</td>
              <td>{formatDateTime(control.last_evaluated_at)}</td>
              <td>{formatDateTime(control.last_evidence_at)}</td>
              <td>{formatDateTime(control.next_review_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
