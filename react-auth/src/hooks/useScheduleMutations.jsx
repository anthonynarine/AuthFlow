import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * Owns the two Itachi schedule-definition mutations:
 *
 *   POST  /security-exercises/schedules/          (create)
 *   PATCH /security-exercises/schedules/<id>/      (update / enable / disable)
 *
 * Both are plain, synchronous REST mutations -- unlike a manual exercise
 * run, a schedule mutation has no execution lifecycle, no polling, and no
 * Idempotency-Key: it only ever creates or edits a standing definition.
 * Itachi's own occurrence claiming derives its own deterministic
 * idempotency later, entirely server-side.
 */
export function useScheduleMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const createSchedule = useCallback(async (payload) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await authAxios.post("/security-exercises/schedules/", payload);
      return data;
    } catch (requestError) {
      setSubmitError(requestError);
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateSchedule = useCallback(async (scheduleId, payload) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await authAxios.patch(`/security-exercises/schedules/${scheduleId}/`, payload);
      return data;
    } catch (requestError) {
      setSubmitError(requestError);
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetError = useCallback(() => setSubmitError(null), []);

  return { createSchedule, updateSchedule, isSubmitting, submitError, resetError };
}

export default useScheduleMutations;
