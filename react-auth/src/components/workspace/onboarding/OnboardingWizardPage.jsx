import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrganizations } from "../../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../../hooks/useOrganizationApplications";
import { useValidateSessionOnMount } from "../../../hooks/useValidateSessionOnMount";
import { FounderNav } from "../FounderNav";
import { SecurityErrorState } from "../../security/SecurityErrorState";
import { CreateCompanyStep } from "./CreateCompanyStep";
import { CompanyChooser } from "./CompanyChooser";
import { AddAppStep } from "./AddAppStep";
import { AppSetupFlow } from "./AppSetupFlow";
import "../FounderWorkspace.css";
import "./Onboarding.css";

/**
 * UI2 — /workspace/onboarding. The single orchestration route. Every step
 * is derived from real backend state (GET /organizations/, GET
 * /organizations/<slug>/applications/), never a locally-invented
 * "onboarding complete" flag that could drift from reality:
 *
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
  const orgsState = useOrganizations(true);

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

  let content;

  if (orgsState.isLoading && orgsState.organizations.length === 0) {
    content = <p className="founder-empty">Loading…</p>;
  } else if (orgsState.error) {
    content = <SecurityErrorState error={orgsState.error} onRetry={orgsState.refetch} />;
  } else if (orgsState.organizations.length === 0 || searchParams.get("new") === "1") {
    // Either a brand-new founder with no Company yet, or one who
    // explicitly asked to create another one.
    content = (
      <CreateCompanyStep
        onCreate={handleCreateCompany}
        isCreating={orgsState.isCreating}
        createError={orgsState.createError}
      />
    );
  } else if (!currentOrgSlug || !currentOrg) {
    // No Company chosen yet, or the ?org= value doesn't match any real
    // membership — never invent a Company GET /organizations/ didn't
    // actually return.
    content = (
      <CompanyChooser
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

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell onboarding-shell">{content}</main>
    </div>
  );
}

export default OnboardingWizardPage;
