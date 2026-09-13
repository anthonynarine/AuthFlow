import React from "react";
import { Link } from "react-router-dom";
import { RiBookOpenLine, RiExternalLinkLine, RiRadarLine, RiSwordLine, RiTerminalBoxLine } from "react-icons/ri";
import { canRunSecurityExercises } from "../security-exercises/securityExerciseLabels";
import { getSecurityArchitectureDocsUrl } from "./securityLabels";

const PAGES = [
  { key: "command", label: "Security Command", path: "/security-command", icon: RiTerminalBoxLine },
  { key: "observatory", label: "Security Observatory", path: "/security-observatory", icon: RiRadarLine },
  { key: "exercises", label: "Security Exercises", path: "/security-exercises", icon: RiSwordLine },
  { key: "learn", label: "Learn Gait", path: "/security-learn", icon: RiBookOpenLine },
];

/**
 * Top-level switcher between the security pages, shared across all of
 * them. Each page previously repeated the other three as separate stacked
 * buttons in its header actions; this replaces that with a single
 * consistent nav row, one level above each page's own section tabs.
 *
 * Staff-only entries (like the architecture docs external link) are
 * appended here too, gated on the same is_staff check used everywhere
 * else in Gait -- this is a UX-only mirror. The real boundary is the
 * target page's own server-side 403 (a separate django_auth-served page,
 * not a client-side route).
 */
export function SecurityPageSwitcher({ current, user }) {
  const canViewArchitectureDocs = canRunSecurityExercises(user);

  return (
    <nav className="security-page-switcher" aria-label="Security pages">
      {PAGES.map((page) => {
        const isActive = page.key === current;
        const Icon = page.icon;
        return isActive ? (
          <span key={page.key} className="security-tab active" aria-current="page">
            <Icon aria-hidden="true" />
            {page.label}
          </span>
        ) : (
          <Link key={page.key} to={page.path} className="security-tab">
            <Icon aria-hidden="true" />
            {page.label}
          </Link>
        );
      })}
      {canViewArchitectureDocs && (
        <a
          href={getSecurityArchitectureDocsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="security-tab"
        >
          <RiExternalLinkLine aria-hidden="true" />
          Architecture Docs
        </a>
      )}
    </nav>
  );
}

export default SecurityPageSwitcher;
