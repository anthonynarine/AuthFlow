import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI2 Founder Onboarding — Apps belonging to one Company (Organization).
 *
 * GET  /organizations/<organization_slug>/applications/  -> [{ id, slug, name, environment, status }]
 * POST /organizations/<organization_slug>/applications/  -> { id, slug, name, environment, status }
 *
 * Verified read-only against applications/{views,serializers}.py on the
 * ONB2 backend branch. The create request accepts only
 * { name, slug, environment } -- organization/created_by/role/status are
 * never fields on this contract; `environment` must be one of the
 * backend's real Application.Environment choices (local/test/ci/staging/
 * production), never guessed by the frontend.
 */
export function useOrganizationApplications(organizationSlug) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(organizationSlug));
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!organizationSlug) {
      return [];
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/organizations/${organizationSlug}/applications/`);
      const list = Array.isArray(data) ? data : [];
      setApplications(list);
      return list;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    setApplications([]);
    setError(null);
    if (!organizationSlug) {
      setIsLoading(false);
      return;
    }
    fetchApplications().catch(() => {});
  }, [organizationSlug, fetchApplications]);

  const createApplication = useCallback(
    async ({ name, slug, environment }) => {
      setIsCreating(true);
      setCreateError(null);
      try {
        const { data } = await authAxios.post(`/organizations/${organizationSlug}/applications/`, {
          name,
          slug,
          environment,
        });
        setApplications((previous) => [...previous, data]);
        return data;
      } catch (requestError) {
        setCreateError(requestError);
        throw requestError;
      } finally {
        setIsCreating(false);
      }
    },
    [organizationSlug]
  );

  return {
    applications,
    isLoading,
    error,
    refetch: fetchApplications,
    createApplication,
    isCreating,
    createError,
  };
}
