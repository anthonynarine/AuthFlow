import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI2 Founder Onboarding — issuing a Connection Key (ApplicationCredential).
 *
 * POST /organizations/<organization_slug>/applications/<application_id>/credentials/
 *   -> { credential_id, raw_secret, created_at }
 *
 * Verified read-only against applications/{views,serializers}.py on the
 * ONB2 backend branch: the response contains the raw secret exactly once,
 * server-side only the hash is ever kept. There is deliberately no GET/
 * list endpoint for credentials (BACKEND_UI_CONTRACT_GAP: CREDENTIAL_LIST)
 * -- this hook never tries to retrieve a previously-issued key.
 *
 * SECRET SAFETY: `raw_secret` lives only in this hook's React state, for
 * as long as the component tree holding it stays mounted. Nothing here
 * ever writes it to localStorage, sessionStorage, a cookie, a URL, or any
 * logging/error-reporting call. Once the founder navigates away (or
 * refreshes), this state is gone and there is no way to get it back --
 * that mirrors the backend's own one-time-secret guarantee exactly, it
 * doesn't work around it.
 */
export function useApplicationCredential(organizationSlug, applicationId) {
  const [credential, setCredential] = useState(null); // { credentialId, rawSecret, createdAt } | null
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState(null);

  const issueCredential = useCallback(async () => {
    if (!organizationSlug || !applicationId) {
      return null;
    }
    setIsIssuing(true);
    setError(null);
    try {
      const { data } = await authAxios.post(
        `/organizations/${organizationSlug}/applications/${applicationId}/credentials/`
      );
      const issued = { credentialId: data.credential_id, rawSecret: data.raw_secret, createdAt: data.created_at };
      setCredential(issued);
      return issued;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsIssuing(false);
    }
  }, [organizationSlug, applicationId]);

  // Explicit, deliberate discard -- e.g. once the founder has acknowledged
  // saving the key. Never called automatically/silently.
  const forgetCredential = useCallback(() => {
    setCredential(null);
  }, []);

  return { credential, isIssuing, error, issueCredential, forgetCredential };
}
