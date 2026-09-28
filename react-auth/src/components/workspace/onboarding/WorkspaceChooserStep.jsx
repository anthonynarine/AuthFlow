import React from "react";
import { AuthHeading } from "../../../ds/AuthLayout";
import { ROLE_LABELS } from "../../../console/pages/members/memberRules";

/**
 * Onboarding (DS-AUTH): someone in more than one workspace picks one. Every
 * row comes straight from GET /organizations/ (their real, ACTIVE memberships).
 * The apps home keeps its own CompanyChooser until it's redesigned.
 */
export function WorkspaceChooserStep({ organizations, onChoose, onCreateNew }) {
  return (
    <>
      <AuthHeading
        eyebrow="Choose a workspace"
        title="Which workspace are you working in?"
        lede="You belong to more than one. Pick one to continue."
      />
      <ul className="ds-invites" aria-label="Your workspaces">
        {organizations.map((org) => (
          <li key={org.id} className="ds-invite">
            <div className="ds-invite-row">
              <p className="ds-invite-text">
                <strong>{org.name}</strong>
                <span className="ds-invite-meta">{ROLE_LABELS[org.org_role] || org.org_role}</span>
              </p>
              <button type="button" className="ds-btn ds-btn--primary ds-btn--small" onClick={() => onChoose(org.slug)} aria-label={`Open ${org.name}`}>
                Open
              </button>
            </div>
          </li>
        ))}
      </ul>
      {onCreateNew ? (
        <button type="button" className="ds-btn ds-btn--secondary" onClick={onCreateNew}>
          Create another workspace
        </button>
      ) : null}
    </>
  );
}

export default WorkspaceChooserStep;
