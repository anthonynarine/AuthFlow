import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * GET /security-exercises/schedules/ -- B-RED1D (Itachi) standing schedule
 * definitions.
 *
 * Isolated from the playbook catalog and run history the same way those
 * two are isolated from each other: a schedules failure must never blank
 * the catalog or run history tabs, and vice versa.
 */
export function useScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const schedulesRef = useRef([]);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authAxios.get("/security-exercises/schedules/");
      const list = Array.isArray(data) ? data : [];
      schedulesRef.current = list;
      setSchedules(list);
      setError(null);
      setIsStale(false);
      setLastUpdated(new Date());
      return list;
    } catch (requestError) {
      setError(requestError);
      setIsStale(schedulesRef.current.length > 0);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules().catch(() => {});
  }, [fetchSchedules]);

  return {
    schedules,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refetch: fetchSchedules,
  };
}

export default useScheduleList;
