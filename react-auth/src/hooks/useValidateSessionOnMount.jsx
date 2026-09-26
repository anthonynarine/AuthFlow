import { useEffect } from "react";
import { useUserSessionServices } from "../context/auth/UserSessionContext";

/**
 * Every top-level page in this app validates the session on mount so
 * `user` (and therefore `user.is_staff`) is populated before anything
 * that depends on it renders — FounderNav's PLATFORM/tenant link
 * gating included. A page reached directly (deep link, refresh, or a
 * route not funneled through WorkspaceEntry) still needs this itself;
 * it is never inherited automatically just because some other page in
 * the tree already called it.
 */
export function useValidateSessionOnMount() {
  const { validateSession } = useUserSessionServices();

  useEffect(() => {
    validateSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
