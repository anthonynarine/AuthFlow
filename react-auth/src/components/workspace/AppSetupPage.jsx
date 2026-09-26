import React from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useOrganizationApplications } from "../../hooks/useOrganizationApplications";
import { useValidateSessionOnMount } from "../../hooks/useValidateSessionOnMount";
import { FounderNav } from "./FounderNav";
import { AppSetupFlow } from "./onboarding/AppSetupFlow";
import { SecurityErrorState } from "../security/SecurityErrorState";
import "./FounderWorkspace.css";
import "./onboarding/Onboarding.css";

/**
 * UI2 — /workspace/apps/:id/setup. Standalone SDK setup for an App that
 * already exists (revisiting instructions, or setting up a second App).
 * Shares AppSetupFlow with the onboarding wizard rather than forking it.
 */
export function AppSetupPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useValidateSessionOnMount();
  const organizationSlug = searchParams.get("org");

  const appsState = useOrganizationApplications(organizationSlug);

  if (!organizationSlug) {
    return <Navigate to="/workspace/apps" replace />;
  }

  const application = appsState.applications.find((app) => app.id === id) || null;

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell onboarding-shell">
        {appsState.isLoading && appsState.applications.length === 0 ? (
          <p className="founder-empty">Loading…</p>
        ) : appsState.error ? (
          <SecurityErrorState error={appsState.error} onRetry={appsState.refetch} />
        ) : !application ? (
          <p className="founder-empty">That App couldn't be found.</p>
        ) : (
          <AppSetupFlow
            organizationSlug={organizationSlug}
            application={application}
            onDone={() => navigate(`/workspace/apps?org=${organizationSlug}`, { replace: true })}
          />
        )}
      </main>
    </div>
  );
}

export default AppSetupPage;
