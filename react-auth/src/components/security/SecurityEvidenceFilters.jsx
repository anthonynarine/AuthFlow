import React from "react";
import { EVIDENCE_RESULTS, EVIDENCE_TYPES, getEvidenceResultLabel, getEvidenceTypeLabel } from "./securityLabels";

export function SecurityEvidenceFilters({ filters, onChange, onReset }) {
  return (
    <form className="security-filters" onSubmit={(event) => event.preventDefault()}>
      <label>
        Control
        <input
          value={filters.control}
          onChange={(event) => onChange("control", event.target.value)}
          placeholder="Control key"
        />
      </label>
      <label>
        Evidence type
        <select value={filters.evidence_type} onChange={(event) => onChange("evidence_type", event.target.value)}>
          <option value="">All types</option>
          {EVIDENCE_TYPES.map((type) => (
            <option value={type} key={type}>
              {getEvidenceTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Result
        <select value={filters.result} onChange={(event) => onChange("result", event.target.value)}>
          <option value="">All results</option>
          {EVIDENCE_RESULTS.map((result) => (
            <option value={result} key={result}>
              {getEvidenceResultLabel(result)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Source
        <input
          value={filters.source}
          onChange={(event) => onChange("source", event.target.value)}
          placeholder="Source type or name"
        />
      </label>
      <label>
        Observed from
        <input
          type="datetime-local"
          value={filters.observed_from}
          onChange={(event) => onChange("observed_from", event.target.value)}
        />
      </label>
      <label>
        Observed to
        <input
          type="datetime-local"
          value={filters.observed_to}
          onChange={(event) => onChange("observed_to", event.target.value)}
        />
      </label>
      <button type="button" className="security-button secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}
