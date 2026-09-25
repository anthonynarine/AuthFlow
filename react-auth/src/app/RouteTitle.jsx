import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const DEFAULT_TITLE = "Gait: Your AI security team";

// One place for every page's browser-tab title. Pages not listed here
// (including 404s) fall back to DEFAULT_TITLE, which matches index.html.
const TITLES = [
  [/^\/$/, DEFAULT_TITLE],
  [/^\/architecture\/?$/, "Architecture · Gait"],
  [/^\/developers\/?$/, "gait-sdk for developers · Gait"],
  [/^\/early-access\/?$/, "Early access · Gait"],
  [/^\/login\/?$/, "Log in · Gait"],
  [/^\/register\/?$/, "Create account · Gait"],
  [/^\/forgot-password\/?$/, "Forgot password · Gait"],
  [/^\/reset-password\//, "Reset password · Gait"],
  [/^\/setup-2fa\/?$/, "Set up 2FA · Gait"],
  [/^\/send-email\/?$/, "Contact · Gait"],
  [/^\/security-command\/?$/, "Security Command · Gait"],
  [/^\/security(-observatory)?\/?$/, "Security Observatory · Gait"],
  [/^\/security-exercises\/?$/, "Security exercises · Gait"],
  [/^\/security-learn\/?$/, "Learn security · Gait"],
  [/^\/workspace\/issues\/[^/]+\/?$/, "Issue · Gait"],
  [/^\/workspace\/issues\/?$/, "Issues · Gait"],
  [/^\/workspace\/team\/?$/, "Security team · Gait"],
  [/^\/workspace\/?$/, "Workspace · Gait"],
];

export function titleForPath(pathname) {
  const match = TITLES.find(([pattern]) => pattern.test(pathname));
  return match ? match[1] : DEFAULT_TITLE;
}

/** Keeps document.title in sync with the current route. Renders nothing. */
export function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}
