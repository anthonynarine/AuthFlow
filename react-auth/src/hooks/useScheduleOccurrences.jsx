import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * GET /security-exercises/schedules/<id>/occurrences/ -- one schedule's
 * durable occurrence history. Fetches only when `scheduleId` is set (the
 * occurrence history view is opened on demand, not preloaded for every
 * schedule in the list).
 */
export function useScheduleOccurrences(scheduleId) {
  const [occurrences, setOccurrences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const occurrencesRef = useRef([]);

  const fetchOccurrences = useCallback(async () => {
    if (!scheduleId) {
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await authAxios.get(`/security-exercises/schedules/${scheduleId}/occurrences/`);
      const list = Array.isArray(data) ? data : [];
      occurrencesRef.current = list;
      setOccurrences(list);
      setError(null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    occurrencesRef.current = [];
    setOccurrences([]);
    setError(null);
    if (!scheduleId) {
      return;
    }
    fetchOccurrences().catch(() => {});
  }, [scheduleId, fetchOccurrences]);

  return { occurrences, isLoading, error, refetch: fetchOccurrences };
}

export default useScheduleOccurrences;
