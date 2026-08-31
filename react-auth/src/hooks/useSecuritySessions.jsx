import { useCallback, useEffect, useMemo, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { normalizeListResponse } from "../components/security/securityLabels";

export function useSecuritySessions() {
  const [sessions, setSessions] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const params = useMemo(() => ({ page, page_size: pageSize }), [page, pageSize]);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/sessions/", { params });
      const normalized = normalizeListResponse(data);
      setSessions(normalized.results);
      setCount(normalized.count);
      setNext(normalized.next);
      setPrevious(normalized.previous);
      setLastUpdated(new Date());
      return normalized;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSessions().catch(() => {});
  }, [fetchSessions]);

  return {
    sessions,
    count,
    next,
    previous,
    page,
    pageSize,
    isLoading,
    error,
    lastUpdated,
    setPage,
    setPageSize,
    refetch: fetchSessions,
  };
}
