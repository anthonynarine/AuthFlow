import React from "react";

/**
 * UI2 — a minimal Company chooser. Used when a founder belongs to more
 * than one Company: onboarding's own "which Company" step, and
 * AppsHomePage when navigated to without a company already selected.
 * Every entry comes straight from GET /organizations/ (the caller's real,
 * ACTIVE memberships) — nothing here is inferred or cached across visits.
 */
export function CompanyChooser({ organizations, onChoose, onCreateNew }) {
  return (
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">Choose a workspace</p>
      <h1 className="onboarding-title">Which workspace are you working in?</h1>
      <p className="onboarding-sub">You belong to more than one — pick one to continue.</p>

      <div className="onboarding-company-list">
        {organizations.map((org) => (
          <button
            key={org.id}
            type="button"
            className="onboarding-company-row"
            onClick={() => onChoose(org.slug)}
          >
            <span className="onboarding-company-name">{org.name}</span>
            <span className="onboarding-company-role">{org.org_role}</span>
          </button>
        ))}
      </div>

      {onCreateNew && (
        <button type="button" className="fw-btn" onClick={onCreateNew}>
          Create another workspace
        </button>
      )}
    </div>
  );
}

export default CompanyChooser;
