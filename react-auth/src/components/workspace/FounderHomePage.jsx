import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { useSecurityPosture } from "../../hooks/useSecurityPosture";
import { useFounderIssues } from "../../hooks/useFounderIssues";
import { FounderNav } from "./FounderNav";
import { FounderIssueCard } from "./FounderIssueCard";
import { SecurityErrorState } from "../security/SecurityErrorState";
import "./FounderWorkspace.css";

function greetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user) {
  if (!user) return "";
  return user.first_name || user.email?.split("@")[0] || "";
}

// Posture is derived by the backend, not calculated here (same rule
// PostureOverview.jsx already follows). This only translates the
// backend's own overall_status into the plain-language status the
// founder sees; it never invents a health verdict when the backend
// hasn't given one.
function deriveFounderStatus(posture, postureError) {
  if (postureError) {
    return { label: "Gait is still evaluating your security.", tone: "neutral" };
  }
  if (!posture) {
    return { label: "Gait is still evaluating your security.", tone: "neutral" };
  }
  const status = posture.overall_status;
  if (status === "HEALTHY") {
    return { label: "Good", tone: "good" };
  }
  if (status === "UNKNOWN" || status === "NOT_APPLICABLE") {
    return { label: "Still checking", tone: "neutral" };
  }
  if (status === "NEEDS_ATTENTION" || status === "CONTROL_FAILURE") {
    return { label: "Needs attention", tone: "warn" };
  }
  return { label: "Gait is still evaluating your security.", tone: "neutral" };
}

export function FounderHomePage() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const postureState = useSecurityPosture();
  const issuesState = useFounderIssues();

  useEffect(() => {
    validateSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forbidden = [postureState.error, issuesState.error].some(
    (requestError) => requestError?.response?.status === 403
  );

  const { needsYouIssues, inProgressCount, resolvedThisWeekCount, hasFailedDeployment, recentIssues } =
    useMemo(() => {
      const issues = issuesState.issues;
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      return {
        needsYouIssues: issues.filter((issue) => issue.needsYou),
        inProgressCount: issues.filter((issue) => issue.isActiveCase && !issue.needsYou).length,
        resolvedThisWeekCount: issues.filter(
          (issue) => issue.isResolved && issue.resolvedAt && now - new Date(issue.resolvedAt).getTime() <= oneWeekMs
        ).length,
        hasFailedDeployment: issues.some((issue) => issue.hasDeploymentFailed),
        recentIssues: [...issues]
          .sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0))
          .slice(0, 5),
      };
    }, [issuesState.issues]);

  const controlsChecked = useMemo(() => {
    const controls = postureState.posture?.controls;
    if (!controls) return null;
    return (controls.healthy || 0) + (controls.needs_attention || 0) + (controls.control_failure || 0);
  }, [postureState.posture]);

  const status = deriveFounderStatus(postureState.posture, postureState.error);

  if (forbidden) {
    return (
      <div className="founder-workspace">
        <FounderNav />
        <main className="founder-shell">
          <SecurityErrorState error={{ response: { status: 403 } }} />
        </main>
      </div>
    );
  }

  return (
    <div className="founder-workspace">
      <FounderNav />
      <main className="founder-shell">
        <header className="founder-page-head">
          <h1 className="founder-greeting">
            {greetingPrefix()}
            {firstName(user) ? `, ${firstName(user)}` : ""}
          </h1>
          <p className="founder-page-sub">Here's where things stand.</p>
        </header>

        <div className={`founder-status-banner tone-${status.tone}`}>
          <div className="founder-status-dot" aria-hidden="true" />
          <div>
            <p className="founder-status-label">{status.label}</p>
            <p className="founder-status-meta">
              {controlsChecked !== null ? `${controlsChecked} controls checked · ` : ""}
              {inProgressCount} investigation{inProgressCount === 1 ? "" : "s"} in progress ·{" "}
              {needsYouIssues.length} decision{needsYouIssues.length === 1 ? "" : "s"} need
              {needsYouIssues.length === 1 ? "s" : ""} you
            </p>
          </div>
        </div>

        <section className="founder-section" aria-labelledby="needs-you-heading">
          <h2 className="founder-section-title" id="needs-you-heading">Needs you</h2>
          {needsYouIssues.length === 0 ? (
            <p className="founder-empty">Nothing needs your decision right now.</p>
          ) : (
            needsYouIssues.map((issue) => <FounderIssueCard key={issue.id} issue={issue} />)
          )}
        </section>

        <section className="founder-section" aria-labelledby="working-heading">
          <h2 className="founder-section-title" id="working-heading">Gait is working</h2>
          <ul className="founder-deploy-checklist">
            <li className={postureState.posture ? "is-done" : ""}>
              {postureState.posture ? "✓" : "○"} Security checks running
            </li>
            <li className={resolvedThisWeekCount > 0 ? "is-done" : ""}>
              {resolvedThisWeekCount > 0 ? "✓" : "○"} {resolvedThisWeekCount} issue
              {resolvedThisWeekCount === 1 ? "" : "s"} resolved this week
            </li>
            {inProgressCount > 0 && (
              <li className="is-active">● {inProgressCount} investigation{inProgressCount === 1 ? "" : "s"} in progress</li>
            )}
            <li className={hasFailedDeployment ? "" : "is-done"}>
              {hasFailedDeployment ? "○ A deployment needs a fresh look" : "✓ No failed deployments"}
            </li>
          </ul>
        </section>

        <section className="founder-section" aria-labelledby="recent-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="founder-section-title" id="recent-heading">Recent issues</h2>
            <Link to="/workspace/issues" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              View all
            </Link>
          </div>
          {issuesState.isLoading && recentIssues.length === 0 ? (
            <p className="founder-empty">Loading…</p>
          ) : recentIssues.length === 0 ? (
            <p className="founder-empty">No issues yet. Gait hasn't detected anything.</p>
          ) : (
            recentIssues.map((issue) => <FounderIssueCard key={issue.id} issue={issue} />)
          )}
        </section>
      </main>
    </div>
  );
}

export default FounderHomePage;
