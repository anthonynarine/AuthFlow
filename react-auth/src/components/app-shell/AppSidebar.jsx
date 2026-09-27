import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiBookOpenLine,
  RiExternalLinkLine,
  RiGlobalLine,
  RiHome5Line,
  RiListCheck3,
  RiLogoutBoxRLine,
  RiRadarLine,
  RiShieldKeyholeLine,
  RiSwordLine,
  RiTeamLine,
  RiTerminalBoxLine,
} from "react-icons/ri";
import { canRunSecurityExercises } from "../security-exercises/securityExerciseLabels";
import { getSecurityArchitectureDocsUrl } from "../security/securityLabels";

// Items match their path and any sub-path. `exact` keeps Home from lighting
// up on /workspace/*; `alsoMatches` covers exact-path aliases (/security).
export const SIDEBAR_GROUPS = [
  {
    key: "workspace",
    label: "Workspace",
    items: [
      { key: "home", label: "Home", path: "/workspace", icon: RiHome5Line, exact: true },
      { key: "issues", label: "Issues", path: "/workspace/issues", icon: RiListCheck3 },
      { key: "team", label: "Security Team", path: "/workspace/team", icon: RiTeamLine },
    ],
  },
  {
    key: "security",
    label: "Security",
    items: [
      { key: "command", label: "Security Command", path: "/security-command", icon: RiTerminalBoxLine },
      {
        key: "observatory",
        label: "Security Observatory",
        path: "/security-observatory",
        icon: RiRadarLine,
        alsoMatches: ["/security"],
      },
      { key: "exercises", label: "Security Exercises", path: "/security-exercises", icon: RiSwordLine },
      { key: "learn", label: "Learn Gait", path: "/security-learn", icon: RiBookOpenLine },
    ],
  },
];

export function isItemActive(item, pathname) {
  if (pathname === item.path || item.alsoMatches?.includes(pathname)) return true;
  return !item.exact && pathname.startsWith(`${item.path}/`);
}

function displayName(user) {
  if (!user) return "";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return full || user.email || "";
}

/**
 * Single navigation for every signed-in page (Founder Workspace + the
 * security tools). Replaces FounderNav and SecurityPageSwitcher, which were
 * two unrelated top navs that didn't link to each other consistently.
 *
 * The staff-only Architecture Docs link is a UX-only mirror of the same
 * is_staff check used elsewhere; the real boundary is that page's own
 * server-side 403.
 */
export function AppSidebar({ user, onLogout, onNavigate }) {
  const { pathname } = useLocation();
  const canViewArchitectureDocs = canRunSecurityExercises(user);
  const name = displayName(user);

  return (
    <nav className="app-sidebar" aria-label="App">
      <Link to="/workspace" className="app-sidebar-brand" onClick={onNavigate}>
        <RiShieldKeyholeLine aria-hidden="true" />
        <span>Gait</span>
      </Link>

      <div className="app-sidebar-groups">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.key} className="app-sidebar-group">
            <p className="app-sidebar-group-label">{group.label}</p>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item, pathname);
                return (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      className={`app-sidebar-link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {group.key === "security" && canViewArchitectureDocs && (
                <li>
                  <a
                    href={getSecurityArchitectureDocsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-sidebar-link"
                  >
                    <RiExternalLinkLine aria-hidden="true" />
                    <span>Architecture Docs</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="app-sidebar-footer">
        <Link to="/" className="app-sidebar-link app-sidebar-link--quiet" onClick={onNavigate}>
          <RiGlobalLine aria-hidden="true" />
          <span>Gait website</span>
        </Link>
        {user ? (
          <div className="app-sidebar-account">
            <span className="app-sidebar-user" title={user.email}>{name}</span>
            <button type="button" className="app-sidebar-logout" onClick={onLogout}>
              <RiLogoutBoxRLine aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="app-sidebar-link app-sidebar-link--quiet" onClick={onNavigate}>
            <RiLogoutBoxRLine aria-hidden="true" />
            <span>Log in</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default AppSidebar;
