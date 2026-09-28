import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DOC_PAGES, docTitle } from "../docs/manifest";
import { isCompanyConsolePath } from "../console/layout/consoleTitle";

export const DEFAULT_TITLE = "Gait: See the security of every app you ship";

// One place for every page's browser-tab title. Pages not listed here
// (including 404s) fall back to DEFAULT_TITLE, which matches index.html.
const TITLES = [
  [/^\/$/, DEFAULT_TITLE],
  [/^\/architecture\/?$/, "Architecture · Gait"],
  [/^\/developers\/?$/, "gait-sdk for developers · Gait"],
  [/^\/early-access\/?$/, "Early access · Gait"],
  [/^\/verify-email\/?$/, "Confirm your email · Gait"],
  [/^\/account\/?$/, "Account · Gait"],
  [/^\/account\/two-step\/?$/, "Two-step verification · Gait"],
  [/^\/console\/invites\/accept\/?$/, "Join a workspace · Gait"],
  ...DOC_PAGES.map((page) => [new RegExp(`^/docs/${page.slug}/?$`), docTitle(page)]),
  [/^\/docs(\/|$)/, "Gait Docs"],
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
  [/^\/workspace\/onboarding\/?$/, "Set up your workspace · Gait"],
  [/^\/workspace\/apps(\/|$)/, "Apps · Gait"],
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
    if (isCompanyConsolePath(pathname)) return; // the console layout titles these with the company's name
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}
