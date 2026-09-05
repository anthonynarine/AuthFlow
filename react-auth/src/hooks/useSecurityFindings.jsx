import { useCallback, useEffect, useMemo, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { normalizeListResponse } from "../components/security/securityLabels";

const DEFAULT_FILTERS = {
  status: "",
  severity: "",
  domain: "",
  control: "",
  affected_system: "",
};

function buildParams(filters, page, pageSize) {
  const params = { page, page_size: pageSize };
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params[key] = value;
    }
  });
  return params;
}

export function useSecurityFindings(initialFilters = {}) {
  const [findings, setFindings] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const params = useMemo(() => buildParams(filters, page, pageSize), [filters, page, pageSize]);

  const fetchFindings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/findings/", { params });
      const normalized = normalizeListResponse(data);
      setFindings(normalized.results);
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
    fetchFindings().catch(() => {});
  }, [fetchFindings]);

  const updateFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
    setPage(1);
  }, [initialFilters]);

  return {
    findings,
    count,
    next,
    previous,
    page,
    pageSize,
    filters,
    isLoading,
    error,
    lastUpdated,
    setPage,
    setPageSize,
    updateFilter,
    resetFilters,
    refetch: fetchFindings,
  };
}
