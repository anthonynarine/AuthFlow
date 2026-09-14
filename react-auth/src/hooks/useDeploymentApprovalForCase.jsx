import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI1 Founder Workspace — first frontend caller of the existing
 * B-AGENT5A deployment-approval read API
 * (GET /security-agents/deployment-approvals/). Read-only: finds the
 * most recent approval row for this case, if any, and returns it
 * verbatim (never recomputes status, risk, or eligibility). `enabled`
 * should be gated on the case actually being in a deploy-approval-shaped
 * state (see founderIssueAdapter.deriveApprovalKind: "deploy" or
 * "deploy_stuck") so this call is only made when it's relevant.
 *
 * UI1.1: no longer filters to status === "PENDING" only. A case can be
 * DEPLOY_AUTHORIZED (approvalKind "deploy_stuck") with its approval row
 * sitting at status APPROVED, not PENDING — the caller (ApprovalCard)
 * branches on `approval.status` itself to decide what, if anything, is
 * safe to offer.
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
      const forThisCase = (Array.isArray(data) ? data : [])
        .filter((item) => item.case_id === caseId)
        .sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));
      const match = forThisCase[0] || null;
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
