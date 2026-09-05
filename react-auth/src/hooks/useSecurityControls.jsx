import { useCallback, useEffect, useMemo, useState } from "react";
import { authAxios } from "../interceptors/axios";

const DEFAULT_FILTERS = { domain: "", status: "", control_type: "" };

function buildParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params[key] = value;
    }
  });
  return params;
}

export function useSecurityControls(initialFilters = {}) {
  const [controls, setControls] = useState([]);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const params = useMemo(() => buildParams(filters), [filters]);

  const fetchControls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/controls/", { params });
      const list = Array.isArray(data) ? data : data?.results || [];
      setControls(list);
      setLastUpdated(new Date());
      return list;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchControls().catch(() => {});
  }, [fetchControls]);

  const updateFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
  }, [initialFilters]);

  return {
    controls,
    filters,
    isLoading,
    error,
    lastUpdated,
    updateFilter,
    resetFilters,
    refetch: fetchControls,
  };
}
