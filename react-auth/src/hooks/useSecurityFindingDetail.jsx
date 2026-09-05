import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecurityFindingDetail() {
  const [finding, setFinding] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFinding = useCallback(async (findingId) => {
    if (!findingId) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security/findings/${findingId}/`);
      setFinding(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFinding = useCallback(() => {
    setFinding(null);
    setError(null);
  }, []);

  return { finding, isLoading, error, fetchFinding, clearFinding };
}
