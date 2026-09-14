import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI1 Founder Workspace — first frontend caller of the existing
 * B-AGENT5A deployment-approval read API
 * (GET /security-agents/deployment-approvals/). Read-only: finds the
 * approval row for this case, if any, and returns it verbatim (never
 * recomputes status, risk, or eligibility). `enabled` should be gated on
 * the case's own current_state actually being AWAITING_DEPLOY_APPROVAL
 * (see founderIssueAdapter.deriveApprovalKind) so this call is only made
 * when it's relevant.
 */
export function useDeploymentApprovalForCase(caseId, enabled) {
  const [approval, setApproval] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApproval = useCallback(async () => {
    if (!caseId || !enabled) {
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/security-agents/deployment-approvals/");
      const match =
        (Array.isArray(data) ? data : []).find(
          (item) => item.case_id === caseId && item.status === "PENDING"
        ) || null;
      setApproval(match);
      return match;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [caseId, enabled]);

  useEffect(() => {
    setApproval(null);
    setError(null);
    if (!caseId || !enabled) {
      return;
    }
    fetchApproval().catch(() => {});
  }, [caseId, enabled, fetchApproval]);

  return { approval, isLoading, error, refetch: fetchApproval };
}
