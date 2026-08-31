import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { normalizeListResponse } from "../components/security/securityLabels";

export function useSecuritySessionDetail() {
  const [session, setSession] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async (sessionId) => {
    if (!sessionId) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [sessionResponse, eventsResponse] = await Promise.all([
        authAxios.get(`/security/sessions/${sessionId}/`),
        authAxios.get("/security/events/", {
          params: { session: sessionId, page: 1, page_size: 20 },
        }),
      ]);
      const events = normalizeListResponse(eventsResponse.data).results;
      setSession(sessionResponse.data);
      setTimelineEvents(events);
      return { session: sessionResponse.data, timelineEvents: events };
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setTimelineEvents([]);
    setError(null);
  }, []);

  return { session, timelineEvents, isLoading, error, fetchSession, clearSession };
}
