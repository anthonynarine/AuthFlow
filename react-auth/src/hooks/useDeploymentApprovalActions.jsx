import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { invalidateCached } from "./requestCache";

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
 * for the duration of the call and is never logged, never written to
 * localStorage/sessionStorage, and never reused after a successful or
 * failed execute.
 *
 * Nothing here decides whether the approval is valid, what gets deployed,
 * or what environment it targets — the backend independently re-verifies
 * all of that on every call, per its own docstrings. A failed `execute`
 * after a successful `approve` is surfaced as its own distinct outcome
 * (`deploy_failed`) rather than reported as success or silently retried.
 *
 * UI1.1 — DEPLOYMENT_APPROVAL_RECOVERY: if the token is lost entirely
 * (browser closed/reloaded between approve and execute), this hook has
 * nothing to retry with — by design, per the backend's one-time-token
 * discipline, which this hook does not weaken. Read-only re-inspection of
 * deployment_approval.py / orchestration.py found a real, safe recovery
 * the backend already supports: revoking a stuck APPROVED (not yet
 * consumed) approval rolls the case back to AWAITING_DEPLOY_APPROVAL
 * (orchestration.reconcile_case_after_revocation), after which a brand
 * new approval can be requested and approved normally, with a fresh
 * token. `restartApproval` wires exactly that two-call sequence — never
 * a replacement token for the old approval, always a genuinely new
 * approval lifecycle, matching the backend's own "no automatic
 * reapproval" discipline.
 */
export function useDeploymentApprovalActions() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);

  // Any action that changes backend workflow state invalidates the short
  // list caches (Home/Issues/Security Team) so the next visit shows real,
  // fresh state instead of what was cached up to SNAPSHOT_TTL_MS ago.
  const invalidateListCaches = () => {
    invalidateCached("/security/cases/");
    invalidateCached("/security/findings/");
    invalidateCached("/security-agents/cases/");
  };

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
      invalidateListCaches();
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
      invalidateListCaches();
      return { approve: approveData, execute: executeResponse.data };
    } catch (executeError) {
      setError(executeError);
      setStatus("deploy_failed");
      invalidateListCaches();
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
        invalidateListCaches();
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
      invalidateListCaches();
      return data;
    } catch (rejectError) {
      setError(rejectError);
      setStatus("error");
      throw rejectError;
    }
  }, []);

  // DEPLOYMENT_APPROVAL_RECOVERY: revoke the stuck APPROVED approval, then
  // request a brand new one for the same case/environment. Never reuses
  // or extends the old (now-invalid) token — the founder approves the new
  // approval through the normal flow afterward.
  const restartApproval = useCallback(async (approval) => {
    setStatus("restarting");
    setError(null);
    try {
      await authAxios.post(`/security-agents/deployment-approvals/${approval.id}/revoke/`, {
        reason: "Restarted from the founder workspace after the deployment did not start.",
      });
      const { data } = await authAxios.post("/security-agents/deployment-approvals/request/", {
        case_id: approval.case_id,
        target_environment: approval.target_environment,
      });
      setResult(data);
      setStatus("restarted");
      invalidateListCaches();
      return data;
    } catch (restartError) {
      setError(restartError);
      setStatus("error");
      throw restartError;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setPendingToken(null);
  }, []);

  const isSubmitting =
    status === "approving" || status === "deploying" || status === "rejecting" || status === "restarting";

  return {
    status,
    error,
    result,
    isSubmitting,
    approveAndDeploy,
    retryDeploy,
    reject,
    restartApproval,
    reset,
  };
}
