import React, { useMemo } from "react";
import { useFounderIssues } from "../../hooks/useFounderIssues";
import { FounderNav } from "./FounderNav";
import { FounderIssueCard } from "./FounderIssueCard";
import { SecurityErrorState } from "../security/SecurityErrorState";
import "./FounderWorkspace.css";

const SEVERITY_RANK = { CRITICAL: 0, HIGH: 1, WARNING: 2, INFO: 3 };

export function FounderIssuesPage() {
  const { issues, isLoading, error, refetch } = useFounderIssues();

  const sorted = useMemo(() => {
    return [...issues].sort((a, b) => {
      if (a.needsYou !== b.needsYou) return a.needsYou ? -1 : 1;
      const rankA = SEVERITY_RANK[a.severity] ?? 9;
      const rankB = SEVERITY_RANK[b.severity] ?? 9;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0);
    });
  }, [issues]);

  const forbidden = error?.response?.status === 403;

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell">
        <header className="founder-page-head">
          <h1 className="founder-greeting">Issues</h1>
          <p className="founder-page-sub">Everything Gait has detected, most urgent first.</p>
        </header>

        {forbidden ? (
          <SecurityErrorState error={error} />
        ) : isLoading && sorted.length === 0 ? (
          <p className="founder-empty">Loading…</p>
        ) : error && sorted.length === 0 ? (
          <SecurityErrorState error={error} onRetry={refetch} />
        ) : sorted.length === 0 ? (
          <p className="founder-empty">No issues yet. Gait hasn't detected anything.</p>
        ) : (
          <section className="founder-section">
            {sorted.map((issue) => (
              <FounderIssueCard key={issue.id} issue={issue} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default FounderIssuesPage;
