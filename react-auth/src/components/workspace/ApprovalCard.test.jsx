import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApprovalCard } from "./ApprovalCard";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: { get: jest.fn(), post: jest.fn() },
}));

const APPROVAL = {
  id: "approval-1",
  case_id: "case-1",
  status: "PENDING",
  target_environment: "production",
  base_commit_sha: "aaaaaaaaaaaaaaaaaaaaaaaa",
  repair_commit_sha: "bbbbbbbbbbbbbbbbbbbbbbbb",
  requested_at: "2026-09-13T10:00:00Z",
  expires_at: "2026-09-14T10:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ApprovalCard — repair-approval gap (BACKEND_UI_CONTRACT_GAP: REPAIR_APPROVAL_ACTION)", () => {
  test("shows a non-interactive waiting state when the gate is a repair approval (no backend endpoint exists)", () => {
    render(<ApprovalCard caseId="case-1" approvalKind="repair" />);
    expect(screen.getByText("Waiting for approval")).toBeInTheDocument();
    expect(
      screen.getByText(/an approval action that is not yet available in this workspace/)
    ).toBeInTheDocument();
  });

  test("offers no button of any kind for the repair-approval gate — never a deployment action standing in for it", () => {
    render(<ApprovalCard caseId="case-1" approvalKind="repair" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("never calls any backend endpoint for the repair-approval gate", () => {
    render(<ApprovalCard caseId="case-1" approvalKind="repair" />);
    expect(authAxios.get).not.toHaveBeenCalled();
    expect(authAxios.post).not.toHaveBeenCalled();
  });
});

describe("ApprovalCard — deploy approval", () => {
  test("fetches and displays the real approval facts, not fabricated ones", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);

    expect(await screen.findByText("production")).toBeInTheDocument();
    expect(authAxios.get).toHaveBeenCalledWith("/security-agents/deployment-approvals/");
  });

  test("shows a waiting fallback, not a crash, when no matching pending approval is found", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [] });
    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    expect(await screen.findByText("Waiting for approval")).toBeInTheDocument();
  });

  test("clicking Approve opens a confirmation dialog with the real change details before anything is sent", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);

    fireEvent.click(await screen.findByRole("button", { name: "Approve deployment" }));

    expect(screen.getByRole("dialog", { name: "Approve production deployment?" })).toBeInTheDocument();
    expect(authAxios.post).not.toHaveBeenCalled();
  });

  test("confirming approval chains approve then execute, and reflects the real deployed state", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    authAxios.post.mockImplementation((url) => {
      if (url.endsWith("/approve/")) {
        return Promise.resolve({ data: { ...APPROVAL, status: "CONSUMED", case_status: "DEPLOY_AUTHORIZED", token: "one-time-token" } });
      }
      if (url.endsWith("/execute/")) {
        return Promise.resolve({ data: { run_id: "run-1", run_status: "COMPLETED", case_status: "DEPLOYING" } });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve deployment" }));
    fireEvent.click(screen.getByRole("dialog").querySelector("button.primary"));

    await waitFor(() =>
      expect(authAxios.post).toHaveBeenCalledWith(
        "/security-agents/deployment-approvals/approval-1/execute/",
        { token: "one-time-token" }
      )
    );
    expect(authAxios.post).toHaveBeenCalledWith("/security-agents/deployment-approvals/approval-1/approve/");
  });

  test("rejecting calls the real reject endpoint and disables further action", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    authAxios.post.mockResolvedValueOnce({ data: { ...APPROVAL, status: "REJECTED" } });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));

    await waitFor(() =>
      expect(authAxios.post).toHaveBeenCalledWith(
        "/security-agents/deployment-approvals/approval-1/reject/",
        { reason: "" }
      )
    );
    expect(await screen.findByText("You rejected this deployment. No changes were made.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  test("an execute failure after a successful approve is shown honestly, not reported as success", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    authAxios.post.mockImplementation((url) => {
      if (url.endsWith("/approve/")) {
        return Promise.resolve({ data: { ...APPROVAL, case_status: "DEPLOY_AUTHORIZED", token: "tok" } });
      }
      return Promise.reject({ response: { data: { error: "PROVIDER_UNAVAILABLE" } } });
    });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve deployment" }));
    fireEvent.click(screen.getByRole("dialog").querySelector("button.primary"));

    expect(await screen.findByText(/didn't start: PROVIDER_UNAVAILABLE/)).toBeInTheDocument();
    expect(screen.queryByText("Resolved ✓")).not.toBeInTheDocument();
  });

  test("a 403 permission failure is shown clearly rather than silently failing", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    authAxios.post.mockRejectedValueOnce({ response: { status: 403 } });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve deployment" }));
    fireEvent.click(screen.getByRole("dialog").querySelector("button.primary"));

    expect(await screen.findByText("You don't have permission to decide this approval.")).toBeInTheDocument();
  });

  test("the approve button cannot be double-submitted while a request is in flight", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [APPROVAL] });
    let resolveApprove;
    authAxios.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveApprove = resolve;
        })
    );

    render(<ApprovalCard caseId="case-1" approvalKind="deploy" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve deployment" }));
    const confirmButton = screen.getByRole("dialog").querySelector("button.primary");
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(authAxios.post).toHaveBeenCalledTimes(1);
    resolveApprove({ data: { ...APPROVAL, case_status: "AWAITING_DEPLOY_APPROVAL" } });
  });
});

describe("ApprovalCard — DEPLOYMENT_APPROVAL_RECOVERY (stuck deploy)", () => {
  const STUCK_APPROVAL = { ...APPROVAL, status: "APPROVED", approved_at: "2026-09-13T10:05:00Z" };

  test("an APPROVED-but-not-consumed approval shows the recovery explanation, never the approve/reject flow", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [STUCK_APPROVAL] });
    render(<ApprovalCard caseId="case-1" approvalKind="deploy_stuck" />);

    expect(await screen.findByText(/hasn't started it yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve deployment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  test("never offers to reuse the old token — no execute call is ever made from this branch", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [STUCK_APPROVAL] });
    render(<ApprovalCard caseId="case-1" approvalKind="deploy_stuck" />);
    await screen.findByText(/hasn't started it yet/);
    expect(authAxios.post).not.toHaveBeenCalled();
  });

  test("Restart approval revokes the stuck approval and requests a brand new one — never reusing the old token", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [STUCK_APPROVAL] });
    authAxios.post.mockImplementation((url, body) => {
      if (url.endsWith("/revoke/")) {
        return Promise.resolve({ data: { ...STUCK_APPROVAL, status: "REVOKED" } });
      }
      if (url.endsWith("/request/")) {
        expect(body).toEqual({ case_id: "case-1", target_environment: "production" });
        return Promise.resolve({ data: { ...APPROVAL, id: "approval-2", status: "PENDING" } });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy_stuck" />);
    fireEvent.click(await screen.findByRole("button", { name: "Restart approval" }));

    await waitFor(() =>
      expect(authAxios.post).toHaveBeenCalledWith(
        "/security-agents/deployment-approvals/approval-1/revoke/",
        expect.objectContaining({ reason: expect.any(String) })
      )
    );
    expect(authAxios.post).toHaveBeenCalledWith(
      "/security-agents/deployment-approvals/request/",
      { case_id: "case-1", target_environment: "production" }
    );
    // Never calls execute/ with the old (now-invalid) approval id.
    expect(authAxios.post).not.toHaveBeenCalledWith(
      expect.stringContaining("approval-1/execute/"),
      expect.anything()
    );
  });

  test("a restart failure is shown honestly, not silently retried or reported as success", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [STUCK_APPROVAL] });
    authAxios.post.mockRejectedValueOnce({ response: { data: { error: "NOT_APPROVED" } } });

    render(<ApprovalCard caseId="case-1" approvalKind="deploy_stuck" />);
    fireEvent.click(await screen.findByRole("button", { name: "Restart approval" }));

    expect(await screen.findByText("NOT_APPROVED")).toBeInTheDocument();
  });

  test("restart cannot be double-submitted while in flight", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [STUCK_APPROVAL] });
    let resolveRevoke;
    authAxios.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRevoke = resolve;
        })
    );

    render(<ApprovalCard caseId="case-1" approvalKind="deploy_stuck" />);
    const restartButton = await screen.findByRole("button", { name: "Restart approval" });
    fireEvent.click(restartButton);
    fireEvent.click(restartButton);
    fireEvent.click(restartButton);

    expect(authAxios.post).toHaveBeenCalledTimes(1);
    resolveRevoke({ data: { ...STUCK_APPROVAL, status: "REVOKED" } });
  });
});
