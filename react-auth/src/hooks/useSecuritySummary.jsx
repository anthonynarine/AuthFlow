import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecuritySummary() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/summary/");
      setSummary(data);
      setLastUpdated(new Date());
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary().catch(() => {});
  }, [fetchSummary]);

  return { summary, isLoading, error, lastUpdated, refetch: fetchSummary };
}
