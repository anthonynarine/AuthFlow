import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * GET /security-exercises/runs/ -- recent Security Exercise run history.
 *
 * Intentionally isolated from usePlaybookCatalog: a run-history failure
 * must never break catalog browsing, and a catalog failure must never
 * hide run history (B-RED1C section 29).
 */
export function useExerciseRunHistory() {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const runsRef = useRef([]);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authAxios.get("/security-exercises/runs/");
      const list = Array.isArray(data) ? data : [];
      runsRef.current = list;
      setRuns(list);
      setError(null);
      setIsStale(false);
      setLastUpdated(new Date());
      return list;
    } catch (requestError) {
      setError(requestError);
      setIsStale(runsRef.current.length > 0);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns().catch(() => {});
  }, [fetchRuns]);

  return {
    runs,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refetch: fetchRuns,
  };
}
