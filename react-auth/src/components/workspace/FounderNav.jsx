import React from "react";
import { Link, useLocation } from "react-router-dom";
import { RiShieldKeyholeLine, RiToolsLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { AccountMenu } from "../../account/AccountMenu";

const STAFF_LINKS = [
  { key: "home", label: "Home", path: "/workspace" },
  { key: "issues", label: "Issues", path: "/workspace/issues" },
  { key: "team", label: "Security Team", path: "/workspace/team" },
];

const TENANT_LINKS = [{ key: "home", label: "Home", path: "/workspace/apps" }];

/**
 * UI2: the PLATFORM/is_staff boundary applies here too. Issues, Security
 * Team, and the Advanced/operator link are all backed by is_staff-gated
 * PLATFORM endpoints (unchanged, verified read-only against the ONB2
 * backend) — a tenant founder (however senior their org_role) never sees
 * them here. This mirrors backend authority; it does not substitute for
 * it. `is_staff` comes from the authenticated user record, never a
 * tenant OWNER/ADMIN/MEMBER role.
 */
export function FounderNav() {
  const location = useLocation();
  const { user } = useBasicAuthServices();
  const isStaff = Boolean(user?.is_staff);
  const links = isStaff ? STAFF_LINKS : TENANT_LINKS;

  return (
    <nav className="founder-nav" aria-label="Founder workspace">
      <Link to={isStaff ? "/workspace" : "/workspace/apps"} className="founder-nav-brand">
        <RiShieldKeyholeLine />
        <span>Gait</span>
      </Link>
      <div className="founder-nav-links">
        {links.map((link) => {
          const isActive =
            link.path === "/workspace" || link.path === "/workspace/apps"
              ? location.pathname === link.path
              : location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.key}
              to={link.path}
              className={`founder-nav-link${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
        {isStaff && (
          <Link to="/security-command" className="founder-nav-advanced">
            <RiToolsLine /> Advanced
          </Link>
        )}
      </div>
      {/* Account (and the "2FA off" flag) is reachable from every signed-in shell. */}
      <AccountMenu />
    </nav>
  );
}

export default FounderNav;
