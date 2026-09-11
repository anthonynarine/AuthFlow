import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { isActiveRunStatus } from "../components/security-exercises/securityExerciseLabels";

const POLL_INTERVAL_MS = 4000;

/**
 * Views one existing SecurityExerciseRun by id (from run history), polling
 * only while it is still active and stopping automatically once it reaches
 * a terminal status. A refresh failure keeps the last-known run on screen
 * rather than clearing it.
 */
export function useExerciseRunDetail(runId) {
  const [run, setRun] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const runRef = useRef(null);
  const pollTimerRef = useRef(null);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchRun = useCallback(
    async ({ initial = false } = {}) => {
      if (!runId) {
        return;
      }
      if (initial) {
        setIsLoading(true);
      }
      try {
        const { data } = await authAxios.get(`/security-exercises/runs/${runId}/`);
        runRef.current = data;
        setRun(data);
        setError(null);
        if (!isActiveRunStatus(data.status)) {
          clearPoll();
        }
      } catch (requestError) {
        setError(requestError);
      } finally {
        if (initial) {
          setIsLoading(false);
        }
      }
    },
    [runId, clearPoll]
  );

  useEffect(() => {
    runRef.current = null;
    setRun(null);
    setError(null);
    clearPoll();

    if (!runId) {
      return undefined;
    }

    fetchRun({ initial: true }).then(() => {
      if (runRef.current && isActiveRunStatus(runRef.current.status)) {
        pollTimerRef.current = window.setInterval(() => {
          fetchRun().catch(() => {});
        }, POLL_INTERVAL_MS);
      }
    }).catch(() => {});

    return clearPoll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return { run, isLoading, error, refetch: () => fetchRun({ initial: true }) };
}
