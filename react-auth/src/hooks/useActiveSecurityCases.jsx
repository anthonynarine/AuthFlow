import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * GET /security/cases/active/ — the existing SecurityCommandQueryService
 * DTO list, most-recently-updated first. Read only.
 */
export function useActiveSecurityCases() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/cases/active/");
      const list = Array.isArray(data) ? data : [];
      setCases(list);
      setLastUpdated(new Date());
      return list;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases().catch(() => {});
  }, [fetchCases]);

  return { cases, isLoading, error, lastUpdated, refetch: fetchCases };
}
