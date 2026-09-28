import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrganizations } from "../../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../../hooks/useOrganizationApplications";
import { useValidateSessionOnMount } from "../../../hooks/useValidateSessionOnMount";
import { useBasicAuthServices } from "../../../context/auth/BasicAuthContext";
import { useMyInvites } from "../../../console/invites/useMyInvites";
import { FounderNav } from "../FounderNav";
import { SecurityErrorState } from "../../security/SecurityErrorState";
import { CreateCompanyStep } from "./CreateCompanyStep";
import { InvitesFirstStep } from "./InvitesFirstStep";
import { WorkspaceChooserStep } from "./WorkspaceChooserStep";
import { AuthLayout } from "../../../ds/AuthLayout";
import { Alert, StatusLine } from "../../../ds/components";
import { ResendVerificationButton } from "../../../account/ResendVerificationButton";
import { AddAppStep } from "./AddAppStep";
import { AppSetupFlow } from "./AppSetupFlow";
import "../FounderWorkspace.css";
import { EmailVerificationBanner } from "../../../account/EmailVerificationBanner";
import "./Onboarding.css";

/**
 * UI2 — /workspace/onboarding. The single orchestration route. Every step
 * is derived from real backend state (GET /organizations/, GET
 * /organizations/<slug>/applications/), never a locally-invented
 * "onboarding complete" flag that could drift from reality:
 *
 *   0 Companies, invited      -> InvitesFirstStep (INV-UX), with
 *                               CreateCompanyStep one click away
 *   0 Companies              -> CreateCompanyStep
 *   >1 Companies, none chosen -> CompanyChooser
 *   Company chosen, 0 Apps   -> AddAppStep
 *   Company + App exist      -> AppSetupFlow (framework -> SDK -> key)
 *
 * Ephemeral choices (framework, which of possibly-several Apps is being
 * set up) live in this component/its children, never persisted or sent
 * to the backend as onboarding-completion state.
 */
export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useValidateSessionOnMount();
  const { user } = useBasicAuthServices();
  const orgsState = useOrganizations(true);
  const noWorkspaceYet = !orgsState.isLoading && !orgsState.error && orgsState.organizations.length === 0;
  // Invites follow the confirmed email, so they're here whichever tab the
  // confirmation link opened in.
  const myInvites = useMyInvites({ enabled: Boolean(user) && noWorkspaceYet });
  const [creatingInstead, setCreatingInstead] = useState(false);

  const selectedSlug = searchParams.get("org");
  const currentOrgSlug = useMemo(() => {
    if (selectedSlug) return selectedSlug;
    if (orgsState.organizations.length === 1) return orgsState.organizations[0].slug;
    return null;
  }, [selectedSlug, orgsState.organizations]);

  const currentOrg = orgsState.organizations.find((org) => org.slug === currentOrgSlug) || null;

  const appsState = useOrganizationApplications(currentOrgSlug);

  const chooseCompany = (slug) => {
    setSearchParams({ org: slug });
  };

  const handleCreateCompany = async (payload) => {
    const created = await orgsState.createOrganization(payload);
    setSearchParams({ org: created.slug });
    return created;
  };

  const handleCreateApp = (payload) => appsState.createApplication(payload);

  const handleSetupDone = () => {
    navigate(`/workspace/apps?org=${currentOrgSlug}`, { replace: true });
  };

  // The workspace steps use the DS-AUTH card; the app steps keep today's shell
  // until they're redesigned.
  let workspaceStep = null;
  let content;

  if (orgsState.isLoading && orgsState.organizations.length === 0) {
    workspaceStep = <StatusLine>Loading…</StatusLine>;
  } else if (orgsState.error) {
    content = <SecurityErrorState error={orgsState.error} onRetry={orgsState.refetch} />;
  } else if (orgsState.organizations.length === 0 && myInvites.waiting) {
    workspaceStep = <StatusLine>Loading…</StatusLine>;
  } else if (orgsState.organizations.length === 0 && myInvites.invites.length > 0 && !creatingInstead) {
    workspaceStep = <InvitesFirstStep invites={myInvites.invites} onCreateInstead={() => setCreatingInstead(true)} />;
  } else if (orgsState.organizations.length === 0 || searchParams.get("new") === "1") {
    // Either a brand-new founder with no workspace yet, or one who
    // explicitly asked to create another one.
    const invited = orgsState.organizations.length === 0 && myInvites.invites.length > 0;
    workspaceStep = (
      <>
        {invited ? (
          <button type="button" className="ds-link ds-link--quiet" style={{ alignSelf: "flex-start" }} onClick={() => setCreatingInstead(false)}>
            ← Back to your invitations ({myInvites.invites.length})
          </button>
        ) : null}
        <CreateCompanyStep
          onCreate={handleCreateCompany}
          isCreating={orgsState.isCreating}
          createError={orgsState.createError}
        />
      </>
    );
  } else if (!currentOrgSlug || !currentOrg) {
    // No workspace chosen yet, or the ?org= value doesn't match any real
    // membership — never invent a workspace GET /organizations/ didn't
    // actually return.
    workspaceStep = (
      <WorkspaceChooserStep
        organizations={orgsState.organizations}
        onChoose={chooseCompany}
        onCreateNew={() => setSearchParams({ new: "1" })}
      />
    );
  } else if (appsState.isLoading && appsState.applications.length === 0) {
    content = <p className="founder-empty">Loading…</p>;
  } else if (appsState.error) {
    content = <SecurityErrorState error={appsState.error} onRetry={appsState.refetch} />;
  } else if (appsState.applications.length === 0) {
    content = (
      <AddAppStep
        companyName={currentOrg.name}
        onCreate={handleCreateApp}
        isCreating={appsState.isCreating}
        createError={appsState.createError}
      />
    );
  } else {
    content = (
      <AppSetupFlow
        organizationSlug={currentOrgSlug}
        application={appsState.applications[0]}
        onDone={handleSetupDone}
        stepLabel="Step 3 of 4"
      />
    );
  }

  if (workspaceStep) {
    return (
      <AuthLayout wide backTo="/workspace" backLabel="Back">
        {user && user.email_verified === false ? (
          <>
            <Alert kind="warning">
              <strong>Confirm {user.email}.</strong> You'll need it to create a workspace or join one. Use the link we
              emailed you, or send a new one.
            </Alert>
            <ResendVerificationButton className="ds-btn ds-btn--secondary ds-btn--small" />
          </>
        ) : null}
        {workspaceStep}
      </AuthLayout>
    );
  }

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell onboarding-shell">
        <EmailVerificationBanner />
        {content}
      </main>
    </div>
  );
}

export default OnboardingWizardPage;
