import React from "react";
import { Link, useLocation } from "react-router-dom";
import { RiShieldKeyholeLine, RiToolsLine } from "react-icons/ri";

const LINKS = [
  { key: "home", label: "Home", path: "/workspace" },
  { key: "issues", label: "Issues", path: "/workspace/issues" },
  { key: "team", label: "Security Team", path: "/workspace/team" },
];

export function FounderNav() {
  const location = useLocation();

  return (
    <nav className="founder-nav" aria-label="Founder workspace">
      <Link to="/workspace" className="founder-nav-brand">
        <RiShieldKeyholeLine />
        <span>Gait</span>
      </Link>
      <div className="founder-nav-links">
        {LINKS.map((link) => {
          const isActive =
            link.path === "/workspace"
              ? location.pathname === "/workspace"
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
        <Link to="/security-command" className="founder-nav-advanced">
          <RiToolsLine /> Advanced
        </Link>
      </div>
    </nav>
  );
}

export default FounderNav;
