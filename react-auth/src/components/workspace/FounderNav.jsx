import React from "react";
import { Link, useLocation } from "react-router-dom";
import { RiShieldKeyholeLine, RiToolsLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { AccountMenu } from "../../account/AccountMenu";
import { isGaitOperator } from "../../auth/operator";

const OPERATOR_LINKS = [
  { key: "home", label: "Home", path: "/workspace" },
  { key: "issues", label: "Issues", path: "/workspace/issues" },
  { key: "team", label: "Security Team", path: "/workspace/team" },
];

const TENANT_LINKS = [{ key: "home", label: "Home", path: "/workspace/apps" }];

/**
 * UI2/OPS1: the PLATFORM/operator boundary applies here too. Issues,
 * Security Team, and the Advanced/operator link are all backed by
 * operator-only PLATFORM endpoints — a tenant founder (however senior their
 * org_role) never sees them here. This mirrors backend authority; it does
 * not substitute for it. `is_gait_operator` comes from the authenticated
 * user record, never a tenant OWNER/ADMIN/MEMBER role and never is_staff.
 */
export function FounderNav() {
  const location = useLocation();
  const { user } = useBasicAuthServices();
  const isOperator = isGaitOperator(user);
  const links = isOperator ? OPERATOR_LINKS : TENANT_LINKS;

  return (
    <nav className="founder-nav" aria-label="Founder workspace">
      <Link to={isOperator ? "/workspace" : "/workspace/apps"} className="founder-nav-brand">
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
        {isOperator && (
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
