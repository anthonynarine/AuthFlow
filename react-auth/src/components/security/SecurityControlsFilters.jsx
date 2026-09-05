import React from "react";
import { CONTROL_STATUSES, CONTROL_TYPES, getControlStatusLabel, getControlTypeLabel } from "./securityLabels";

export function SecurityControlsFilters({ filters, domains, onChange, onReset }) {
  return (
    <form className="security-filters" onSubmit={(event) => event.preventDefault()}>
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
        Status
        <select value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
          <option value="">All statuses</option>
          {CONTROL_STATUSES.map((status) => (
            <option value={status} key={status}>
              {getControlStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select value={filters.control_type} onChange={(event) => onChange("control_type", event.target.value)}>
          <option value="">All types</option>
          {CONTROL_TYPES.map((type) => (
            <option value={type} key={type}>
              {getControlTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="security-button secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}
