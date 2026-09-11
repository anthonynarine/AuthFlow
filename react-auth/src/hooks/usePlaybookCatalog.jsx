import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

const DEFAULT_FILTERS = { category: "", control_key: "", environment: "", executable: false };

function buildParams(filters) {
  const params = {};
  if (filters.category) {
    params.category = filters.category;
  }
  if (filters.control_key) {
    params.control_key = filters.control_key;
  }
  if (filters.environment) {
    params.environment = filters.environment;
  }
  if (filters.executable) {
    params.executable = "true";
  }
  return params;
}

/**
 * GET /security-exercises/playbooks/ -- the read-only playbook catalog.
 *
 * A failed refresh keeps the last-known catalog on screen (flagged stale)
 * instead of blanking it, so catalog browsing survives a transient
 * network error and stays independent of any other Security Command
 * widget (B-RED1C section 29).
 */
export function usePlaybookCatalog(initialFilters = {}) {
  const [playbooks, setPlaybooks] = useState([]);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const playbooksRef = useRef([]);

  const params = useMemo(() => buildParams(filters), [filters]);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authAxios.get("/security-exercises/playbooks/", { params });
      const list = Array.isArray(data) ? data : [];
      playbooksRef.current = list;
      setPlaybooks(list);
      setError(null);
      setIsStale(false);
      setLastUpdated(new Date());
      return list;
    } catch (requestError) {
      setError(requestError);
      setIsStale(playbooksRef.current.length > 0);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCatalog().catch(() => {});
  }, [fetchCatalog]);

  const updateFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    playbooks,
    filters,
    isLoading,
    error,
    isStale,
    lastUpdated,
    updateFilter,
    resetFilters,
    refetch: fetchCatalog,
  };
}
