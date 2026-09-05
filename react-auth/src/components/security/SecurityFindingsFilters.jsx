import React from "react";
import { FINDING_STATUSES, SEVERITIES, getFindingStatusLabel } from "./securityLabels";

export function SecurityFindingsFilters({ filters, domains, onChange, onReset }) {
  return (
    <form className="security-filters" onSubmit={(event) => event.preventDefault()}>
      <label>
        Status
        <select value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
          <option value="">All statuses</option>
          {FINDING_STATUSES.map((status) => (
            <option value={status} key={status}>
              {getFindingStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Severity
        <select value={filters.severity} onChange={(event) => onChange("severity", event.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((severity) => (
            <option value={severity} key={severity}>
              {severity}
            </option>
          ))}
        </select>
      </label>
      <label>
        Domain
        <select value={filters.domain} onChange={(event) => onChange("domain", event.target.value)}>
          <option value="">All domains</option>
          {domains.map((domain) => (
            <option value={domain.key} key={domain.key}>
              {domain.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Control
        <input
          value={filters.control}
          onChange={(event) => onChange("control", event.target.value)}
          placeholder="Control key"
        />
      </label>
      <label>
        Affected system
        <input
          value={filters.affected_system}
          onChange={(event) => onChange("affected_system", event.target.value)}
          placeholder="System name"
        />
      </label>
      <button type="button" className="security-button secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}
