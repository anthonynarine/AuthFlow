import React from "react";
import { SecurityLoadingState } from "../security/SecurityLoadingState";
import { normalizeSecurityRoleText } from "./roleTerminology";

/**
 * B-UX4: one reusable specialist presentation component for all six
 * backend specialists (Identity/AppSec/Tenant-AuthZ/Abuse/Infrastructure/
 * General). Specialization comes entirely from `specialistDisplayName` --
 * there is no per-specialist component, and this file contains no mapping
 * from a control/threat/domain to a specialist identity (that routing
 * decision is security_agents.specialist_routing-only).
 *
 * Renders only fields the backend currently exposes. Authority level,
 * intelligence provider, and per-specialist confidence are not part of
 * today's investigation-summary contract, so they are omitted rather than
 * hardcoded -- see the DiagnosisPanel for confidence, which is reported
 * per-diagnosis, not per-specialist.
 */
export function SpecialistCard({ specialistDisplayName, statusLabel, environment, isPreview, isLoading }) {
  if (isLoading && !specialistDisplayName) {
    return <SecurityLoadingState label="Loading assigned specialist" />;
  }

  if (!specialistDisplayName) {
    return null;
  }

  return (
    <div className="specialist-card">
      <p className="specialist-card-name">{specialistDisplayName}</p>
      <dl className="specialist-card-facts">
        {statusLabel && (
          <div>
            <dt>Status</dt>
            <dd>{normalizeSecurityRoleText(statusLabel)}</dd>
          </div>
        )}
        {environment && (
          <div>
            <dt>Environment</dt>
            <dd>{environment.toUpperCase()}</dd>
          </div>
        )}
        <div>
          <dt>Assignment</dt>
          <dd>{isPreview ? "Preview — not yet dispatched" : "Confirmed"}</dd>
        </div>
      </dl>
    </div>
  );
}

export default SpecialistCard;
