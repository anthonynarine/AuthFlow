import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecurityEvidenceDetail() {
  const [evidence, setEvidence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvidence = useCallback(async (evidenceId) => {
    if (!evidenceId) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security/evidence/${evidenceId}/`);
      setEvidence(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearEvidence = useCallback(() => {
    setEvidence(null);
    setError(null);
  }, []);

  return { evidence, isLoading, error, fetchEvidence, clearEvidence };
}
