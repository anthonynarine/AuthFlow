import React from "react";
import { PendingInvites } from "../../../console/invites/PendingInvites";
import { AuthHeading } from "../../../ds/AuthLayout";

/**
 * INV-UX: someone with no workspace yet who has been invited. Joining is the
 * main choice; creating their own workspace is still one click away.
 */
export function InvitesFirstStep({ invites, onCreateInstead }) {
  const one = invites.length === 1;
  return (
    <>
      <AuthHeading
        eyebrow={one ? "You have an invitation" : `You have ${invites.length} invitations`}
        title="Join your team's workspace"
        lede={`${one ? "A workspace on Gait invited" : "Workspaces on Gait invited"} your confirmed email address. Join to see its applications and findings.`}
      />
      <PendingInvites invites={invites} label="Your invitations" variant="ds" />
      <div className="ds-divider">Setting up something new?</div>
      <button type="button" className="ds-btn ds-btn--secondary" onClick={onCreateInstead}>
        Create your own workspace
      </button>
    </>
  );
}

export default InvitesFirstStep;
