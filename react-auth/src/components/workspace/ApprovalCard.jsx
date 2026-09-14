import React, { useState } from "react";
import { useDeploymentApprovalForCase } from "../../hooks/useDeploymentApprovalForCase";
import { useDeploymentApprovalActions } from "../../hooks/useDeploymentApprovalActions";
import { formatDateTime, formatShortId } from "../security/securityLabels";
import { STUCK_DEPLOY_REASON } from "./adapters/founderIssueAdapter";

function ConfirmDeployDialog({ approval, onCancel, onConfirm, isSubmitting, error }) {
  return (
    <div className="founder-confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="founder-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-deploy-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-deploy-heading">Approve production deployment?</h2>
        <dl>
          <div className="founder-confirm-fact">
            <dt>Environment</dt>
            <dd>{approval.target_environment}</dd>
          </div>
          <div className="founder-confirm-fact">
            <dt>Replacing commit</dt>
            <dd>{formatShortId(approval.base_commit_sha)}</dd>
          </div>
          <div className="founder-confirm-fact">
            <dt>With</dt>
            <dd>{formatShortId(approval.repair_commit_sha)}</dd>
          </div>
          <div className="founder-confirm-fact">
            <dt>Requested</dt>
            <dd>{formatDateTime(approval.requested_at)}</dd>
          </div>
        </dl>
        <p className="founder-confirm-note">
          Gait will deploy only the validated repair associated with this approval — it cannot choose a different
          branch, commit, or environment. This action cannot be undone from here; rolling back means reverting
          commit {formatShortId(approval.repair_commit_sha)}.
        </p>
        {error && <p className="founder-inline-error">{error}</p>}
        <div className="founder-confirm-actions">
          <button type="button" className="fw-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="fw-btn primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Approving…" : "Approve deployment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function describeActionError(error) {
  if (error?.response?.status === 403) {
    return "You don't have permission to decide this approval.";
  }
  if (error?.response?.data?.error) {
    return String(error.response.data.error);
  }
  return "Something went wrong. Please try again.";
}

/**
 * UI1.1 — DEPLOYMENT_APPROVAL_RECOVERY. The approval this case's already-
 * consumed decision points at is sitting at APPROVED, not PENDING: the
 * founder (or someone) approved it, but the one-time execution token
 * never reached execute/ (tab closed, network drop, or the deployment
 * simply failed and nobody retried before leaving the page). The token
 * itself cannot be recovered by design — Gait never persists it — so the
 * only safe path forward is a genuinely new approval, not a workaround.
 */
function StuckDeployCard({ approval, actions, onRestart }) {
  const restarted = actions.status === "restarted";

  return (
    <div className="founder-approval-card">
      <h2>Needs you</h2>
      <p className="founder-needs-you-reason" style={{ marginBottom: "1rem" }}>
        {STUCK_DEPLOY_REASON}
      </p>
      <dl className="founder-approval-fact-grid">
        <div className="founder-approval-fact">
          <dt>Environment</dt>
          <dd>{approval.target_environment}</dd>
        </div>
        <div className="founder-approval-fact">
          <dt>Approved change</dt>
          <dd>{formatShortId(approval.repair_commit_sha)}</dd>
        </div>
        <div className="founder-approval-fact">
          <dt>Approved</dt>
          <dd>{formatDateTime(approval.approved_at)}</dd>
        </div>
      </dl>

      {restarted ? (
        <p>A fresh approval has been requested — review and approve it below when it's ready.</p>
      ) : (
        <>
          {actions.status === "error" && (
            <p className="founder-inline-error">{describeActionError(actions.error)}</p>
          )}
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            The original one-time authorization can't be reused or recovered — that's deliberate, the same way a
            single-use payment link can't be replayed. Restarting asks Gait for a brand new approval to review.
          </p>
          <div className="founder-approval-actions">
            <button type="button" className="fw-btn primary" onClick={onRestart} disabled={actions.isSubmitting}>
              {actions.isSubmitting ? "Restarting…" : "Restart approval"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ApprovalCard({ caseId, approvalKind, onActionComplete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const relevant = approvalKind === "deploy" || approvalKind === "deploy_stuck";
  const approvalState = useDeploymentApprovalForCase(caseId, relevant);
  const actions = useDeploymentApprovalActions();

  if (approvalKind === "repair") {
    return (
      <div className="founder-approval-card">
        <h2>Waiting for approval</h2>
        <p>
          Gait is waiting for a decision before it starts preparing a repair for this issue. Gait is waiting for an
          approval action that is not yet available in this workspace — there's nothing to click here yet, and
          nothing has been skipped.
        </p>
      </div>
    );
  }

  if (!relevant) {
    return null;
  }

  if (approvalState.isLoading && !approvalState.approval) {
    return (
      <div className="founder-approval-card">
        <h2>Checking what needs your approval…</h2>
      </div>
    );
  }

  if (!approvalState.approval) {
    return (
      <div className="founder-approval-card">
        <h2>Waiting for approval</h2>
        <p>Gait is ready for a production deployment decision, but the approval details aren't available yet.</p>
      </div>
    );
  }

  const approval = approvalState.approval;

  const handleRestart = async () => {
    try {
      await actions.restartApproval(approval);
      await approvalState.refetch();
      onActionComplete?.();
    } catch {
      // Error state already surfaced via actions.error / status.
    }
  };

  // The approval this case actually points at right now is APPROVED, not
  // PENDING — the stuck-deployment / recovery case, regardless of which
  // approvalKind the parent's last snapshot poll reported.
  if (approval.status === "APPROVED") {
    return <StuckDeployCard approval={approval} actions={actions} onRestart={handleRestart} />;
  }

  if (approval.status !== "PENDING") {
    // REJECTED/REVOKED/CONSUMED/expired and the parent hasn't caught up to
    // a new state yet — never show stale action buttons for a decided
    // approval.
    return (
      <div className="founder-approval-card">
        <h2>Waiting for approval</h2>
        <p>Gait is preparing the next step for this issue.</p>
      </div>
    );
  }

  const handleConfirm = async () => {
    try {
      await actions.approveAndDeploy(approval.id);
      setConfirmOpen(false);
      onActionComplete?.();
    } catch {
      // Error state already surfaced via actions.error / status.
    }
  };

  const handleReject = async () => {
    try {
      await actions.reject(approval.id);
      onActionComplete?.();
    } catch {
      // handled below
    }
  };

  const alreadyDecided = actions.status === "done" || actions.status === "rejected" || actions.status === "approved_only";

  return (
    <div className="founder-approval-card">
      <h2>Production deployment requires your approval.</h2>
      <dl className="founder-approval-fact-grid">
        <div className="founder-approval-fact">
          <dt>Environment</dt>
          <dd>{approval.target_environment}</dd>
        </div>
        <div className="founder-approval-fact">
          <dt>Change</dt>
          <dd>{formatShortId(approval.repair_commit_sha)}</dd>
        </div>
        <div className="founder-approval-fact">
          <dt>Requested</dt>
          <dd>{formatDateTime(approval.requested_at)}</dd>
        </div>
        {approval.expires_at && (
          <div className="founder-approval-fact">
            <dt>Expires</dt>
            <dd>{formatDateTime(approval.expires_at)}</dd>
          </div>
        )}
      </dl>

      {actions.status === "deploying" && <p>Approved. Starting the authorized deployment…</p>}
      {actions.status === "deploy_failed" && (
        <>
          <p className="founder-inline-error">
            Approved, but the deployment didn't start: {describeActionError(actions.error)}
          </p>
          <button type="button" className="fw-btn" onClick={() => actions.retryDeploy(approval.id)}>
            Try deploying again
          </button>
        </>
      )}
      {actions.status === "approved_only" && (
        <p>Approved. Gait hasn't started the deployment yet — check back shortly.</p>
      )}
      {actions.status === "rejected" && <p>You rejected this deployment. No changes were made.</p>}
      {actions.status === "error" && !confirmOpen && (
        <p className="founder-inline-error">{describeActionError(actions.error)}</p>
      )}

      {!alreadyDecided && (
        <div className="founder-approval-actions">
          <button type="button" className="fw-btn danger" onClick={handleReject} disabled={actions.isSubmitting}>
            Reject
          </button>
          <button
            type="button"
            className="fw-btn primary"
            onClick={() => setConfirmOpen(true)}
            disabled={actions.isSubmitting}
          >
            Approve deployment
          </button>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDeployDialog
          approval={approval}
          isSubmitting={actions.isSubmitting}
          error={actions.status === "error" ? describeActionError(actions.error) : null}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

export default ApprovalCard;
