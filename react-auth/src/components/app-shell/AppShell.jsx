import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { RiCloseLine, RiMenuLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { AppSidebar } from "./AppSidebar";
import "./AppShell.css";

/**
 * Layout route for the signed-in app. Desktop: fixed sidebar + page.
 * Narrow screens: a slim top bar whose menu button opens the same sidebar
 * as a drawer.
 */
export function AppShell() {
  const { user, logout } = useBasicAuthServices();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer whenever the route changes (including browser back).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={`app-shell${menuOpen ? " is-menu-open" : ""}`}>
      <header className="app-topbar">
        <button
          type="button"
          className="app-topbar-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <RiCloseLine /> : <RiMenuLine />}
        </button>
        <span className="app-topbar-brand">
          <RiShieldKeyholeLine aria-hidden="true" /> Gait
        </span>
      </header>

      <aside className="app-shell-sidebar">
        <AppSidebar user={user} onLogout={handleLogout} onNavigate={() => setMenuOpen(false)} />
      </aside>
      {menuOpen && <div className="app-shell-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="app-shell-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AppShell;
