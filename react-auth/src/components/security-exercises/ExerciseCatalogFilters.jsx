import React from "react";
import { getCategoryLabel, getSafeEnvironments, environmentLabel } from "./securityExerciseLabels";

const CATEGORIES = [
  "AUTHENTICATION",
  "AUTHORIZATION",
  "TENANCY",
  "ABUSE_RESISTANCE",
  "AGENT_SECURITY",
  "DEPLOYMENT_SECURITY",
  "APPLICATION_SECURITY",
];

const ALL_ENVIRONMENTS = getSafeEnvironments(["local", "test", "ci", "staging", "production"]);

export function ExerciseCatalogFilters({ filters, onChange, onReset }) {
  return (
    <form className="security-filters" onSubmit={(event) => event.preventDefault()}>
      <label>
        Category
        <select value={filters.category} onChange={(event) => onChange("category", event.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option value={category} key={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Environment
        <select value={filters.environment} onChange={(event) => onChange("environment", event.target.value)}>
          <option value="">All environments</option>
          {ALL_ENVIRONMENTS.map((env) => (
            <option value={env} key={env}>
              {environmentLabel(env)}
            </option>
          ))}
        </select>
      </label>
      <label className="security-checkbox-field">
        <input
          type="checkbox"
          checked={Boolean(filters.executable)}
          onChange={(event) => onChange("executable", event.target.checked)}
        />
        Executable only
      </label>
      <button type="button" className="security-button secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}

export default ExerciseCatalogFilters;
