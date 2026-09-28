import React from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useOrganizationApplications } from "../../hooks/useOrganizationApplications";
import { useValidateSessionOnMount } from "../../hooks/useValidateSessionOnMount";
import { AppSetupFlow } from "./onboarding/AppSetupFlow";
import { LoadFailed } from "./onboarding/LoadFailed";
import { AuthLayout } from "../../ds/AuthLayout";
import { Alert, StatusLine } from "../../ds/components";

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
    <AuthLayout wide backTo={`/workspace/apps?org=${organizationSlug}`} backLabel="Back to Apps">
      {appsState.isLoading && appsState.applications.length === 0 ? (
        <StatusLine>Loading…</StatusLine>
      ) : appsState.error ? (
        <LoadFailed error={appsState.error} onRetry={appsState.refetch} />
      ) : !application ? (
        <Alert kind="danger">That App couldn't be found.</Alert>
      ) : (
        <AppSetupFlow
          organizationSlug={organizationSlug}
          application={application}
          onDone={() => navigate(`/workspace/apps?org=${organizationSlug}`, { replace: true })}
        />
      )}
    </AuthLayout>
  );
}

export default AppSetupPage;
