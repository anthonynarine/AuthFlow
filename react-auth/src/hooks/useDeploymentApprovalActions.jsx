import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

/**
 * UI1 Founder Workspace — the ONLY place the founder-facing "Approve
 * deployment" action calls the real backend. Two existing, unmodified
 * endpoints are involved (security_agents/api_views.py):
 *
 *   POST /security-agents/deployment-approvals/<id>/approve/
 *   POST /security-agents/deployment-approvals/<id>/execute/
 *
 * The backend only ever returns the one-time execution token from the
 * approve response, and never persists or re-derives it — so approving
 * and starting the authorized deployment are chained here as one founder
 * action, exactly mirroring what a human operator would otherwise have to
 * do by hand in two calls. The token is held only in this hook's memory
 * for the duration of the call and is never logged or stored.
 *
 * Nothing here decides whether the approval is valid, what gets deployed,
 * or what environment it targets — the backend independently re-verifies
 * all of that on every call, per its own docstrings. A failed `execute`
 * after a successful `approve` is surfaced as its own distinct outcome
 * (`deploy_failed`) rather than reported as success or silently retried.
 */
export function useDeploymentApprovalActions() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);

  const approveAndDeploy = useCallback(async (approvalId) => {
    setStatus("approving");
    setError(null);
    let approveData;
    try {
      const response = await authAxios.post(`/security-agents/deployment-approvals/${approvalId}/approve/`);
      approveData = response.data;
      setResult(approveData);
    } catch (approveError) {
      setError(approveError);
      setStatus("error");
      throw approveError;
    }

    if (approveData.case_status !== "DEPLOY_AUTHORIZED" || !approveData.token) {
      // Approved, but the backend's own independent re-verification did not
      // advance the case to DEPLOY_AUTHORIZED (e.g. a race). Report exactly
      // what happened; never claim deployment started.
      setStatus("approved_only");
      return { approve: approveData };
    }

    setStatus("deploying");
    setPendingToken(approveData.token);
    try {
      const executeResponse = await authAxios.post(
        `/security-agents/deployment-approvals/${approvalId}/execute/`,
        { token: approveData.token }
      );
      setResult((previous) => ({ ...previous, ...executeResponse.data }));
      setStatus("done");
      setPendingToken(null);
      return { approve: approveData, execute: executeResponse.data };
    } catch (executeError) {
      setError(executeError);
      setStatus("deploy_failed");
      return { approve: approveData, executeError };
    }
  }, []);

  const retryDeploy = useCallback(
    async (approvalId) => {
      if (!pendingToken) {
        return undefined;
      }
      setStatus("deploying");
      setError(null);
      try {
        const executeResponse = await authAxios.post(
          `/security-agents/deployment-approvals/${approvalId}/execute/`,
          { token: pendingToken }
        );
        setResult((previous) => ({ ...previous, ...executeResponse.data }));
        setStatus("done");
        setPendingToken(null);
        return executeResponse.data;
      } catch (executeError) {
        setError(executeError);
        setStatus("deploy_failed");
        throw executeError;
      }
    },
    [pendingToken]
  );

  const reject = useCallback(async (approvalId, reason) => {
    setStatus("rejecting");
    setError(null);
    try {
      const { data } = await authAxios.post(`/security-agents/deployment-approvals/${approvalId}/reject/`, {
        reason: reason || "",
      });
      setResult(data);
      setStatus("rejected");
      return data;
    } catch (rejectError) {
      setError(rejectError);
      setStatus("error");
      throw rejectError;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setPendingToken(null);
  }, []);

  const isSubmitting = status === "approving" || status === "deploying" || status === "rejecting";

  return { status, error, result, isSubmitting, approveAndDeploy, retryDeploy, reject, reset };
}
