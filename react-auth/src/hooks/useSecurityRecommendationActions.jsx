import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * Owns the two B-CMD1 recommendation mutations. Accept sends an exactly
 * empty body -- the backend rejects any extra field with
 * UNKNOWN_FIELDS_NOT_ACCEPTED, since the accepted recommendation always
 * executes precisely what was already validated, never an operator-edited
 * variant (no campaign/adapter/target/environment overrides).
 */
export function useSecurityRecommendationActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const generateRecommendation = useCallback(async (findingId) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setLastAction("generate");
    try {
      const { data } = await authAxios.post("/security/strategy/recommendations/", {
        scope: "FINDING",
        finding_id: findingId,
      });
      return data;
    } catch (requestError) {
      setSubmitError(requestError);
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const acceptRecommendation = useCallback(async (recommendationId) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setLastAction("accept");
    try {
      const { data } = await authAxios.post(`/security/strategy/recommendations/${recommendationId}/accept/`, {});
      return data;
    } catch (requestError) {
      setSubmitError(requestError);
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const dismissRecommendation = useCallback(async (recommendationId, reason) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setLastAction("dismiss");
    try {
      const { data } = await authAxios.post(
        `/security/strategy/recommendations/${recommendationId}/dismiss/`,
        reason ? { reason } : {}
      );
      return data;
    } catch (requestError) {
      setSubmitError(requestError);
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setSubmitError(null);
    setLastAction(null);
  }, []);

  return {
    generateRecommendation,
    acceptRecommendation,
    dismissRecommendation,
    isSubmitting,
    submitError,
    lastAction,
    resetError,
  };
}

export default useSecurityRecommendationActions;
