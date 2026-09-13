import React from "react";
import { formatUser } from "./securityLabels";

function getInitials(user) {
  const first = user?.first_name?.[0] || "";
  const last = user?.last_name?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();
  if (initials) {
    return initials;
  }
  return (user?.email?.[0] || "?").toUpperCase();
}

/**
 * One cohesive identity + status pill, shared across every security page
 * header -- replaces the old pattern of a bordered "Signed in as" box
 * stacked above a separate "Read only" pill (two disconnected shapes).
 */
export function SecurityOperatorBadge({ user, statusLabel }) {
  if (!user) {
    return null;
  }

  return (
    <div className="security-operator-badge" title={`Signed in as ${formatUser(user)}`}>
      <span className="security-operator-avatar" aria-hidden="true">
        {getInitials(user)}
      </span>
      <span className="security-operator-details">
        <strong>{formatUser(user)}</strong>
        {statusLabel && <span className="security-operator-status">{statusLabel}</span>}
      </span>
    </div>
  );
}

export default SecurityOperatorBadge;
