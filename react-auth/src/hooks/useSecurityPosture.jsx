import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecurityPosture() {
  const [posture, setPosture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPosture = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/posture/");
      setPosture(data);
      setLastUpdated(new Date());
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosture().catch(() => {});
  }, [fetchPosture]);

  return { posture, isLoading, error, lastUpdated, refetch: fetchPosture };
}
