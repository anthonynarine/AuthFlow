import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

const SNAPSHOT_POLL_INTERVAL_MS = 8000;

/**
 * GET /security/cases/<id>/workflow/snapshot/ on an interval.
 *
 * A polling failure never clears previously known trusted state: the last
 * good snapshot stays on screen with an `isStale` flag and the timestamp it
 * was last confirmed, rather than surfacing a fake failure.
 */
export function useSecurityCaseSnapshot(caseId) {
  const [snapshot, setSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const snapshotRef = useRef(null);

  const fetchSnapshot = useCallback(
    async ({ silent = false } = {}) => {
      if (!caseId) {
        return undefined;
      }
      if (!silent) {
        setIsLoading(true);
      }
      try {
        const { data } = await authAxios.get(`/security/cases/${caseId}/workflow/snapshot/`);
        snapshotRef.current = data.snapshot;
        setSnapshot(data.snapshot);
        setError(null);
        setIsStale(false);
        setLastUpdated(new Date());
        return data.snapshot;
      } catch (requestError) {
        setError(requestError);
        setIsStale(Boolean(snapshotRef.current));
        throw requestError;
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [caseId]
  );

  useEffect(() => {
    snapshotRef.current = null;
    setSnapshot(null);
    setError(null);
    setIsStale(false);
    setLastUpdated(null);

    if (!caseId) {
      return undefined;
    }

    let cancelled = false;
    fetchSnapshot().catch(() => {});

    const interval = setInterval(() => {
      if (cancelled) {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      fetchSnapshot({ silent: true }).catch(() => {});
    }, SNAPSHOT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  return { snapshot, isLoading, error, isStale, lastUpdated, refetch: fetchSnapshot };
}
