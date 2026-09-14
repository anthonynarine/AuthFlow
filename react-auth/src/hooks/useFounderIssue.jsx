import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { useActiveSecurityCases } from "./useActiveSecurityCases";
import { useSecurityCaseSnapshot } from "./useSecurityCaseSnapshot";
import { useSecurityCaseTimeline } from "./useSecurityCaseTimeline";
import { useSecurityCaseDiagnosis } from "./useSecurityCaseDiagnosis";
import { useSecurityCaseInvestigationSummary } from "./useSecurityCaseInvestigationSummary";
import { platformFindingAdapter } from "../components/workspace/adapters/founderIssueAdapter";

/**
 * UI1 Founder Workspace — one Issue's full story, composed from existing
 * PLATFORM hooks exactly as SecurityCommandPage.jsx already does for the
 * operator view. This hook adds no new backend surface; it only finds the
 * finding's matching active case (by finding_id, the same join
 * ActiveCasesPanel already relies on) and reuses the same polling hooks.
 */
export function useFounderIssue(findingId) {
  const [finding, setFinding] = useState(null);
  const [findingLoading, setFindingLoading] = useState(true);
  const [findingError, setFindingError] = useState(null);

  const activeCases = useActiveSecurityCases();
  const matchingCase = activeCases.cases.find((item) => item.finding_id === findingId) || null;

  const snapshotState = useSecurityCaseSnapshot(matchingCase?.id);
  const timelineState = useSecurityCaseTimeline(matchingCase?.id);
  const diagnosisState = useSecurityCaseDiagnosis(matchingCase?.id);
  const investigationSummaryState = useSecurityCaseInvestigationSummary(matchingCase?.id);

  const fetchFinding = useCallback(async () => {
    if (!findingId) {
      return undefined;
    }
    setFindingLoading(true);
    setFindingError(null);
    try {
      const { data } = await authAxios.get(`/security/findings/${findingId}/`);
      setFinding(data);
      return data;
    } catch (requestError) {
      setFindingError(requestError);
      throw requestError;
    } finally {
      setFindingLoading(false);
    }
  }, [findingId]);

  useEffect(() => {
    fetchFinding().catch(() => {});
  }, [fetchFinding]);

  const refetchAll = useCallback(() => {
    fetchFinding().catch(() => {});
    activeCases.refetch().catch(() => {});
    snapshotState.refetch({ silent: true }).catch(() => {});
    timelineState.refetch().catch(() => {});
    diagnosisState.refetch().catch(() => {});
    investigationSummaryState.refetch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFinding]);

  const issue = finding
    ? platformFindingAdapter({
        finding,
        matchingCase,
        snapshot: snapshotState.snapshot,
        diagnosis: diagnosisState.diagnosis,
        investigationSummary: investigationSummaryState.summary,
      })
    : null;

  const isForbidden = [findingError, activeCases.error].some(
    (requestError) => requestError?.response?.status === 403
  );

  return {
    issue,
    isLoading: findingLoading || activeCases.isLoading,
    error: findingError || activeCases.error,
    isForbidden,
    caseId: matchingCase?.id || null,
    timeline: timelineState,
    snapshot: snapshotState,
    diagnosis: diagnosisState,
    investigationSummary: investigationSummaryState,
    refetchAll,
  };
}
