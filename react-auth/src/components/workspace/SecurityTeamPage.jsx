import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cachedGet } from "../../hooks/requestCache";
import { useFounderIssues } from "../../hooks/useFounderIssues";
import { formatDateTime } from "../security/securityLabels";
import "./FounderWorkspace.css";

const ROSTER = [
  { key: "commander", name: "Commander", mission: "Coordinates security work and decides what happens next." },
  { key: "identity", name: "Identity & Session", mission: "Authentication and session security." },
  { key: "appsec", name: "Application Security", mission: "Application vulnerabilities and unsafe patterns." },
  { key: "authz", name: "Authorization", mission: "Tenant and permission boundaries." },
  { key: "abuse_infra", name: "Abuse & Infrastructure", mission: "Abuse patterns and infrastructure security." },
  { key: "red_team", name: "Red Team", mission: "Safely reproduces weaknesses when authorized." },
  { key: "repair", name: "Repair", mission: "Prepares fixes." },
  { key: "validator", name: "Validator", mission: "Independently checks repairs before anyone relies on them." },
  { key: "release", name: "Release", mission: "Deploys only what's been validated and approved — nothing else." },
];

// A small, bounded (one call per active case) real-data lookup — reuses the
// existing investigation-summary endpoint, the same one CaseHeader already
// calls for a single selected case. No new backend surface.
//
// UI1.1: routed through `cachedGet` so this de-dupes against any other
// concurrent caller of the same case's investigation-summary, and reuses
// a short-lived cached value instead of re-fetching on quick repeat visits.
function useActiveInvestigations(cases) {
  const [byCaseId, setByCaseId] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      cases.map((item) =>
        cachedGet(`/security-agents/cases/${item.caseId}/investigation-summary/`)
          .then((res) => [item.caseId, res.data])
          .catch(() => [item.caseId, null])
      )
    ).then((entries) => {
      if (!cancelled) {
        setByCaseId(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cases]);

  return byCaseId;
}

export function SecurityTeamPage() {
  // UI1.1: no separate useActiveSecurityCases() call here — that would be
  // a second, independent GET /security/cases/active/ on top of the one
  // useFounderIssues() already makes. Active cases are derived from the
  // same founder issues this page already needs for "Recently resolved."
  const issuesState = useFounderIssues();

  const activeIssues = useMemo(() => issuesState.issues.filter((issue) => issue.isActiveCase), [issuesState.issues]);
  const investigationsByCaseId = useActiveInvestigations(activeIssues);

  const recentlyResolved = useMemo(() => {
    return issuesState.issues
      .filter((issue) => issue.isResolved && issue.resolvedAt)
      .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
      .slice(0, 5);
  }, [issuesState.issues]);

  return (
    <div className="founder-workspace">
      <main className="founder-shell">
        <header className="founder-page-head">
          <h1 className="founder-greeting">Your Gait Security Team</h1>
          <p className="founder-page-sub">
            You don't route work between them — Gait's Commander does that. Here's who's on the team and what
            they're doing.
          </p>
        </header>

        <section className="founder-section" aria-labelledby="roster-heading">
          <h2 className="founder-section-title" id="roster-heading">The team</h2>
          <div className="founder-team-grid">
            {ROSTER.map((role) => (
              <div className="founder-team-card" key={role.key}>
                <h3>{role.name}</h3>
                <p>{role.mission}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="founder-section" aria-labelledby="active-heading">
          <h2 className="founder-section-title" id="active-heading">Active investigations right now</h2>
          {issuesState.isLoading && activeIssues.length === 0 ? (
            <p className="founder-empty">Loading…</p>
          ) : activeIssues.length === 0 ? (
            <p className="founder-empty">Nothing is being actively worked on right now.</p>
          ) : (
            <div>
              {activeIssues.map((issue) => {
                const summary = investigationsByCaseId[issue.caseId];
                return (
                  <div className="founder-activity-row" key={issue.caseId}>
                    <span>
                      <Link to={`/workspace/issues/${issue.id}`}>{issue.title}</Link>
                    </span>
                    <span>{summary?.specialist_display_name || "Assessing…"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="founder-section" aria-labelledby="resolved-heading">
          <h2 className="founder-section-title" id="resolved-heading">Recently resolved</h2>
          {recentlyResolved.length === 0 ? (
            <p className="founder-empty">Nothing resolved yet.</p>
          ) : (
            <div>
              {recentlyResolved.map((issue) => (
                <div className="founder-activity-row" key={issue.id}>
                  <span>
                    <Link to={`/workspace/issues/${issue.id}`}>{issue.title}</Link>
                  </span>
                  <span>{formatDateTime(issue.resolvedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SecurityTeamPage;
