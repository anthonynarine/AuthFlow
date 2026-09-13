import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * B-AI2 Phase 4: the Security Observatory's AI Budget Countdown.
 * GET /api/security-agents/ai-budget/ -- pure backend telemetry. This
 * hook never computes or infers allow/deny/urgency itself; it only
 * fetches and returns exactly what the backend already decided
 * (including `requires_attention`, see get_ai_budget_status()).
 */
export function useAiBudgetStatus() {
  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security-agents/ai-budget/");
      setBudget(data);
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
    fetchBudget().catch(() => {});
  }, [fetchBudget]);

  return { budget, isLoading, error, lastUpdated, refetch: fetchBudget };
}
