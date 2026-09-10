import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

const TIMELINE_POLL_INTERVAL_MS = 6000;
const TIMELINE_PAGE_SIZE = 50;
const MAX_CATCHUP_PAGES = 5;

/**
 * Cursor-based incremental retrieval of
 * GET /security/cases/<id>/workflow/timeline/.
 *
 * Never re-fetches the whole timeline: the first load pages forward with
 * after_event_id until has_more is false, then every subsequent poll only
 * asks for events after the last known event id. New events are appended
 * and de-duplicated by their backend-assigned id. A polling failure keeps
 * the events already on screen and flags them as stale instead of clearing
 * trusted state.
 */
export function useSecurityCaseTimeline(caseId) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const cursorRef = useRef("");
  const seenIdsRef = useRef(new Set());
  const eventsRef = useRef([]);

  const fetchPage = useCallback(
    async (after) => {
      const params = { limit: TIMELINE_PAGE_SIZE };
      if (after) {
        params.after_event_id = after;
      }
      const { data } = await authAxios.get(`/security/cases/${caseId}/workflow/timeline/`, { params });
      return data;
    },
    [caseId]
  );

  const mergeEvents = useCallback((incoming) => {
    const fresh = incoming.filter((event) => !seenIdsRef.current.has(event.id));
    if (fresh.length === 0) {
      return false;
    }
    fresh.forEach((event) => seenIdsRef.current.add(event.id));
    eventsRef.current = [...eventsRef.current, ...fresh];
    return true;
  }, []);

  const poll = useCallback(
    async ({ initial = false } = {}) => {
      if (!caseId) {
        return;
      }
      if (initial) {
        setIsLoading(true);
      }
      try {
        let page = await fetchPage(cursorRef.current);
        let changed = mergeEvents(page.events || []);
        if (page.next_after_event_id) {
          cursorRef.current = page.next_after_event_id;
        }

        let catchupPages = 0;
        while (initial && page.has_more && catchupPages < MAX_CATCHUP_PAGES) {
          page = await fetchPage(cursorRef.current);
          changed = mergeEvents(page.events || []) || changed;
          if (page.next_after_event_id) {
            cursorRef.current = page.next_after_event_id;
          }
          catchupPages += 1;
        }

        if (changed) {
          setEvents(eventsRef.current);
        }
        setError(null);
        setIsStale(false);
        setLastUpdated(new Date());
      } catch (requestError) {
        setError(requestError);
        setIsStale(eventsRef.current.length > 0);
        throw requestError;
      } finally {
        if (initial) {
          setIsLoading(false);
        }
      }
    },
    [caseId, fetchPage, mergeEvents]
  );

  useEffect(() => {
    cursorRef.current = "";
    seenIdsRef.current = new Set();
    eventsRef.current = [];
    setEvents([]);
    setError(null);
    setIsStale(false);
    setLastUpdated(null);

    if (!caseId) {
      return undefined;
    }

    let cancelled = false;
    poll({ initial: true }).catch(() => {});

    const interval = setInterval(() => {
      if (cancelled) {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      poll().catch(() => {});
    }, TIMELINE_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  return {
    events,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refetch: () => poll({ initial: true }),
  };
}
