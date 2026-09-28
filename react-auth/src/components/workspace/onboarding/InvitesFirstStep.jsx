import React from "react";
import { PendingInvites } from "../../../console/invites/PendingInvites";

/**
 * INV-UX: someone with no workspace yet who has been invited. Joining is the
 * main choice; creating their own workspace is still one click away.
 */
export function InvitesFirstStep({ invites, onCreateInstead }) {
  const one = invites.length === 1;
  return (
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">{one ? "You have an invitation" : `You have ${invites.length} invitations`}</p>
      <h1 className="onboarding-title">Join your team's workspace</h1>
      <p className="onboarding-sub">
        {one ? "A workspace on Gait invited" : "Workspaces on Gait invited"} your confirmed email address. Join to see
        its applications and findings.
      </p>
      <PendingInvites invites={invites} label="Your invitations" />
      <div className="onboarding-secondary">
        <p>Setting up something new instead?</p>
        <button type="button" className="onboarding-link-button" onClick={onCreateInstead}>
          Create your own workspace
        </button>
      </div>
    </div>
  );
}

export default InvitesFirstStep;
