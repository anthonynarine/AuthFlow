import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authAxios } from "../../interceptors/axios";
import { useActiveSecurityCases } from "../../hooks/useActiveSecurityCases";
import { useFounderIssues } from "../../hooks/useFounderIssues";
import { FounderNav } from "./FounderNav";
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
function useActiveInvestigations(cases) {
  const [byCaseId, setByCaseId] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      cases.map((item) =>
        authAxios
          .get(`/security-agents/cases/${item.id}/investigation-summary/`)
          .then((res) => [item.id, res.data])
          .catch(() => [item.id, null])
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
  const activeCases = useActiveSecurityCases();
  const issuesState = useFounderIssues();
  const investigationsByCaseId = useActiveInvestigations(activeCases.cases);

  const recentlyResolved = useMemo(() => {
    return issuesState.issues
      .filter((issue) => issue.isResolved && issue.resolvedAt)
      .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
      .slice(0, 5);
  }, [issuesState.issues]);

  return (
    <div className="founder-workspace">
      <FounderNav />
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
          {activeCases.cases.length === 0 ? (
            <p className="founder-empty">Nothing is being actively worked on right now.</p>
          ) : (
            <div>
              {activeCases.cases.map((item) => {
                const summary = investigationsByCaseId[item.id];
                return (
                  <div className="founder-activity-row" key={item.id}>
                    <span>
                      <Link to={`/workspace/issues/${item.finding_id}`}>{item.finding_title}</Link>
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
