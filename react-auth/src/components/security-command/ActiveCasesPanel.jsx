import React from "react";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { normalizeSecurityRoleText } from "./roleTerminology";

export function ActiveCasesPanel({ cases, isLoading, error, onRetry, selectedCaseId, onSelectCase }) {
  if (isLoading && cases.length === 0) {
    return <SecurityLoadingState label="Loading active cases" />;
  }

  if (error && cases.length === 0) {
    return <SecurityErrorState error={error} onRetry={onRetry} compact />;
  }

  if (cases.length === 0) {
    return <p className="security-command-empty">No active security cases.</p>;
  }

  return (
    <ul className="active-cases-list" aria-label="Active security cases">
      {cases.map((item) => {
        const isSelected = item.id === selectedCaseId;
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`active-case-row${isSelected ? " is-selected" : ""}`}
              onClick={() => onSelectCase(item)}
              aria-pressed={isSelected}
            >
              <span className="active-case-title">{item.finding_title}</span>
              <span className="active-case-meta">
                <span className="active-case-status">{normalizeSecurityRoleText(item.status_label)}</span>
                <span className="active-case-id">#{formatShortId(item.finding_id)}</span>
              </span>
              <span className="active-case-updated">Updated {formatDateTime(item.updated_at)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
