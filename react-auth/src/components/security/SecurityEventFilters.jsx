import React from "react";
import { EVENT_TYPES, OUTCOMES, SEVERITIES, getEventLabel } from "./securityLabels";

export function SecurityEventFilters({ filters, onChange, onReset }) {
  return (
    <form className="security-filters" onSubmit={(event) => event.preventDefault()}>
      <label>
        Event Type
        <select value={filters.event_type} onChange={(event) => onChange("event_type", event.target.value)}>
          <option value="">All events</option>
          {EVENT_TYPES.map((eventType) => (
            <option value={eventType} key={eventType}>{getEventLabel(eventType)}</option>
          ))}
        </select>
      </label>
      <label>
        Severity
        <select value={filters.severity} onChange={(event) => onChange("severity", event.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((severity) => <option value={severity} key={severity}>{severity}</option>)}
        </select>
      </label>
      <label>
        Outcome
        <select value={filters.outcome} onChange={(event) => onChange("outcome", event.target.value)}>
          <option value="">All outcomes</option>
          {OUTCOMES.map((outcome) => <option value={outcome} key={outcome}>{outcome}</option>)}
        </select>
      </label>
      <label>
        User
        <input
          value={filters.user}
          onChange={(event) => onChange("user", event.target.value)}
          placeholder="Email, username, or ID"
        />
      </label>
      <label>
        Start
        <input
          type="datetime-local"
          value={filters.start}
          onChange={(event) => onChange("start", event.target.value)}
        />
      </label>
      <label>
        End
        <input
          type="datetime-local"
          value={filters.end}
          onChange={(event) => onChange("end", event.target.value)}
        />
      </label>
      <button type="button" className="security-button secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}
