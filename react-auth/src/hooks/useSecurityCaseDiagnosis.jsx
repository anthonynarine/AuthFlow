import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * B-UX4: the DiagnosisReport for a case, read via the existing
 * GET /security/cases/<id>/human-review/ packet (security.copilot
 * .SecurityCommandQueryService.get_human_review) rather than a new
 * endpoint -- that packet already carries a `diagnosis` section built
 * from the real DiagnosisReport row, so this hook only extracts it. No
 * new backend surface, no recomputation: `diagnosis` is `null` until a
 * DiagnosisReport exists for this case, never a fabricated placeholder.
 */
export function useSecurityCaseDiagnosis(caseId) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiagnosis = useCallback(async () => {
    if (!caseId) {
      return undefined;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get(`/security/cases/${caseId}/human-review/`);
      const nextDiagnosis = data?.review?.diagnosis || null;
      setDiagnosis(nextDiagnosis);
      return nextDiagnosis;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    setDiagnosis(null);
    setError(null);
    if (!caseId) {
      return;
    }
    fetchDiagnosis().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  return { diagnosis, isLoading, error, refetch: fetchDiagnosis };
}
