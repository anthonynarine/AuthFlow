import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { getSecurityTruthEnvironment } from "../components/security/securityLabels";

export function useSecurityDomains() {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security/domains/", {
        params: { environment: getSecurityTruthEnvironment() },
      });
      const list = Array.isArray(data) ? data : [];
      setDomains(list);
      return list;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains().catch(() => {});
  }, [fetchDomains]);

  return { domains, isLoading, error, refetch: fetchDomains };
}
