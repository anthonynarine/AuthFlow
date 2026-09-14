import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI2 Founder Onboarding — the founder's own Companies (Organizations),
 * read fresh from the backend every time, never from a JWT claim.
 *
 * GET  /organizations/  -> [{ id, name, slug, org_role, membership_status }]
 * POST /organizations/  -> { id, name, slug, status, org_role, membership_status }
 *
 * Verified read-only against organizations/{views,serializers}.py on the
 * ONB2 backend branch (feature/onb2-founder-provisioning). The create
 * request accepts only { name, slug } — role/status/is_staff are not
 * fields on that contract and cannot be sent.
 *
 * `enabled` lets a caller (WorkspaceEntry) skip this fetch entirely for a
 * platform staff account that doesn't need it on every /workspace visit.
 */
export function useOrganizations(enabled = true) {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/organizations/");
      const list = Array.isArray(data) ? data : [];
      setOrganizations(list);
      return list;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    fetchOrganizations().catch(() => {});
  }, [enabled, fetchOrganizations]);

  const createOrganization = useCallback(async ({ name, slug }) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const { data } = await authAxios.post("/organizations/", { name, slug });
      setOrganizations((previous) => [
        ...previous,
        { id: data.id, name: data.name, slug: data.slug, org_role: data.org_role, membership_status: data.membership_status },
      ]);
      return data;
    } catch (requestError) {
      setCreateError(requestError);
      throw requestError;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
    createOrganization,
    isCreating,
    createError,
  };
}
