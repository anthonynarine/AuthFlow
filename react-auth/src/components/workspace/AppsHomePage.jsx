import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrganizations } from "../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../hooks/useOrganizationApplications";
import { useValidateSessionOnMount } from "../../hooks/useValidateSessionOnMount";
import { FounderNav } from "./FounderNav";
import { CompanyChooser } from "./onboarding/CompanyChooser";
import { SecurityErrorState } from "../security/SecurityErrorState";
import "./FounderWorkspace.css";
import "./onboarding/Onboarding.css";

const STATUS_LABELS = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  REVOKED: "Revoked",
};

/**
 * UI2 — /workspace/apps. The honest tenant founder home.
 *
 * BACKEND_UI_CONTRACT_GAP: TENANT_WORKSPACE_READ — there is no tenant-
 * scoped security read contract yet (no findings/posture/evidence
 * endpoint accepts an organization_slug; every security/security_agents
 * endpoint remains is_staff-gated, verified read-only against the ONB2
 * backend branch). This page never falls back to PLATFORM data, never
 * shows fake findings, and never claims the founder's App is protected —
 * it finishes onboarding into an honest empty state instead.
 */
export function AppsHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  useValidateSessionOnMount();
  const orgsState = useOrganizations(true);

  const selectedSlug = searchParams.get("org");
  const currentOrgSlug =
    selectedSlug || (orgsState.organizations.length === 1 ? orgsState.organizations[0].slug : null);
  const currentOrg = orgsState.organizations.find((org) => org.slug === currentOrgSlug) || null;

  const appsState = useOrganizationApplications(currentOrgSlug);

  if (orgsState.isLoading && orgsState.organizations.length === 0) {
    return (
      <div className="founder-workspace">
        <FounderNav />
        <main className="founder-shell">
          <p className="founder-empty">Loading…</p>
        </main>
      </div>
    );
  }

  if (orgsState.error) {
    return (
      <div className="founder-workspace">
        <FounderNav />
        <main className="founder-shell">
          <SecurityErrorState error={orgsState.error} onRetry={orgsState.refetch} />
        </main>
      </div>
    );
  }

  if (orgsState.organizations.length === 0) {
    return (
      <div className="founder-workspace">
        <FounderNav />
        <main className="founder-shell">
          <div className="founder-empty">
            You don't have a Company yet. <Link to="/workspace/onboarding">Create one</Link> to get started.
          </div>
        </main>
      </div>
    );
  }

  if (!currentOrgSlug || !currentOrg) {
    return (
      <div className="founder-workspace">
        <FounderNav />
        <main className="founder-shell onboarding-shell">
          <CompanyChooser
            organizations={orgsState.organizations}
            onChoose={(slug) => setSearchParams({ org: slug })}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell">
        <header className="founder-page-head">
          <h1 className="founder-greeting">{currentOrg.name}</h1>
          <p className="founder-page-sub">Your Company's Apps.</p>
        </header>

        <section className="founder-section" aria-labelledby="apps-heading">
          <h2 className="founder-section-title" id="apps-heading">Apps</h2>
          {appsState.isLoading && appsState.applications.length === 0 ? (
            <p className="founder-empty">Loading…</p>
          ) : appsState.error ? (
            <SecurityErrorState error={appsState.error} onRetry={appsState.refetch} />
          ) : appsState.applications.length === 0 ? (
            <div className="founder-empty">
              No Apps yet.{" "}
              <Link to={`/workspace/onboarding?org=${currentOrgSlug}`}>Add your first App</Link>
            </div>
          ) : (
            appsState.applications.map((application) => (
              <div className="founder-issue-card" key={application.id} style={{ cursor: "default" }}>
                <div className="founder-issue-top">
                  <span className="fw-pill tone-neutral">{application.environment}</span>
                  <span className="fw-pill tone-good">{STATUS_LABELS[application.status] || application.status}</span>
                </div>
                <h3 className="founder-issue-title">{application.name}</h3>
                <p className="founder-issue-note">
                  <Link to={`/workspace/apps/${application.id}/setup?org=${currentOrgSlug}`}>Set up the SDK</Link>
                </p>
              </div>
            ))
          )}
        </section>

        {appsState.applications.length > 0 && (
          <section className="founder-section" aria-labelledby="security-status-heading">
            <h2 className="founder-section-title" id="security-status-heading">Security status</h2>
            <p className="founder-empty" style={{ borderStyle: "solid" }}>
              Your App is set up. Gait has not received enough security activity to show issues yet.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default AppsHomePage;
