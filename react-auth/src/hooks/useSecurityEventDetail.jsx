import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecurityEventDetail() {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async (eventId) => {
    if (!eventId) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security/events/${eventId}/`);
      setEvent(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearEvent = useCallback(() => {
    setEvent(null);
    setError(null);
  }, []);

  return { event, isLoading, error, fetchEvent, clearEvent };
}
