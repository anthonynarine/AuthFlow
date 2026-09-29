import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { useOrganizations } from "../../hooks/useOrganizations";
import { FounderHomePage } from "./FounderHomePage";
import { isGaitOperator } from "../../auth/operator";
import "./FounderWorkspace.css";

/**
 * UI2 — the /workspace entry gate.
 *
 * PLATFORM/operator boundary (backend-enforced regardless of this
 * component): `is_gait_operator` (OPS1; never is_staff, never a tenant
 * org_role) decides between two entirely different experiences here.
 *
 *   operator       -> FounderHomePage, exactly as UI1 built it, completely
 *                     unmodified. This is Gait operating on Gait; nothing
 *                     about tenant Companies changes it.
 *   not operator   -> resolve the founder's own Companies from
 *                     GET /organizations/ (never a JWT claim) and route:
 *                       0 Companies  -> /workspace/onboarding
 *                       1 Company    -> /workspace/apps
 *                       >1 Companies -> /workspace/apps (its own chooser)
 *
 * A non-operator account is never shown FounderHomePage, which calls
 * PLATFORM-only, operator-gated endpoints (useSecurityPosture/
 * useFounderIssues) — this gate exists so that account never even
 * attempts that call and sees a raw "Permission denied" screen instead
 * of a sensible destination.
 */
export function WorkspaceEntry() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const isOperator = isGaitOperator(user);
  const orgsState = useOrganizations(Boolean(user) && !isOperator);

  useEffect(() => {
    validateSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="founder-workspace">
        <main className="founder-shell">
          <p className="founder-empty">Loading…</p>
        </main>
      </div>
    );
  }

  if (isOperator) {
    return <FounderHomePage />;
  }

  if (orgsState.isLoading) {
    return (
      <div className="founder-workspace">
        <main className="founder-shell">
          <p className="founder-empty">Loading…</p>
        </main>
      </div>
    );
  }

  if (orgsState.organizations.length === 0) {
    return <Navigate to="/workspace/onboarding" replace />;
  }

  return <Navigate to="/console" replace />;
}

export default WorkspaceEntry;
