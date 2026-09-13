import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * B-UX4: GET /security-agents/cases/<id>/investigation-summary/ --
 * read-only B-SPEC1/B-AI2 specialist-routing + investigation-block
 * provenance for one case. Every field here is already-decided backend
 * state (security_agents.auto_investigation.get_case_auto_investigation_summary);
 * this hook computes nothing about which specialist was assigned, why,
 * or whether an investigation is allowed.
 */
export function useSecurityCaseInvestigationSummary(caseId) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!caseId) {
      return undefined;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security-agents/cases/${caseId}/investigation-summary/`);
      setSummary(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    setSummary(null);
    setError(null);
    if (!caseId) {
      return;
    }
    fetchSummary().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
