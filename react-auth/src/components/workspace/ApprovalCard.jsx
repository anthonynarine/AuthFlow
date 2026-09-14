import React, { useState } from "react";
import { useDeploymentApprovalForCase } from "../../hooks/useDeploymentApprovalForCase";
import { useDeploymentApprovalActions } from "../../hooks/useDeploymentApprovalActions";
import { formatDateTime, formatShortId } from "../security/securityLabels";

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

export function ApprovalCard({ caseId, approvalKind, onActionComplete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const approvalState = useDeploymentApprovalForCase(caseId, approvalKind === "deploy");
  const actions = useDeploymentApprovalActions();

  if (approvalKind === "repair") {
    return (
      <div className="founder-approval-card">
        <h2>Waiting for approval</h2>
        <p>Gait is waiting for a decision before it starts preparing a repair for this issue.</p>
      </div>
    );
  }

  if (approvalKind !== "deploy") {
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
