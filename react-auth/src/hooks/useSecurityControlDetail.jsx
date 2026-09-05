import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

export function useSecurityControlDetail() {
  const [control, setControl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchControl = useCallback(async (controlKey) => {
    if (!controlKey) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security/controls/${encodeURIComponent(controlKey)}/`);
      setControl(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearControl = useCallback(() => {
    setControl(null);
    setError(null);
  }, []);

  return { control, isLoading, error, fetchControl, clearControl };
}
