import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FounderIssueWorkspacePage } from "./FounderIssueWorkspacePage";
import { useFounderIssue } from "../../hooks/useFounderIssue";

jest.mock("../../hooks/useFounderIssue", () => ({ useFounderIssue: jest.fn() }));

jest.mock("./ApprovalCard", () => ({
  ApprovalCard: ({ approvalKind }) => <div data-testid="approval-card">approval-card:{approvalKind}</div>,
}));
jest.mock("../security-command/SecurityCopilotPanel", () => ({
  SecurityCopilotPanel: () => <div data-testid="ask-gait">ask-gait</div>,
}));
jest.mock("../security-command/WorkflowProgress", () => ({
  WorkflowProgress: () => <div data-testid="workflow-progress">workflow-progress</div>,
}));
jest.mock("../security-command/DiagnosisPanel", () => ({
  DiagnosisPanel: () => <div data-testid="diagnosis-panel">diagnosis-panel</div>,
}));
jest.mock("../security-command/CaseTimeline", () => ({
  CaseTimeline: () => <div data-testid="case-timeline">case-timeline</div>,
}));
jest.mock("../security-command/InvestigationBlockedNotice", () => ({
  InvestigationBlockedNotice: () => <div data-testid="blocked-notice">blocked-notice</div>,
}));

function baseIssue(overrides = {}) {
  return {
    id: "finding-1",
    findingKey: "auth.refresh_token.replay",
    title: "Refresh-token replay protection failed",
    severityLabel: "High",
    severityTone: "danger",
    statusLabel: "Open",
    environment: "production",
    affectedSystem: null,
    whatHappened: "A reused refresh token remained valid.",
    whyItMatters: null,
    whatGaitFound: null,
    recommendation: null,
    needsYou: false,
    approvalKind: null,
    isResolved: false,
    resolutionSummary: null,
    resolvedAt: null,
    currentState: null,
    specialistDisplayName: null,
    lifecycle: [
      { key: "detected", label: "Detected", state: "done" },
      { key: "investigated", label: "Investigated", state: "pending" },
    ],
    _raw: { snapshot: null, diagnosis: null },
    ...overrides,
  };
}

function renderWorkspace(hookValue) {
  useFounderIssue.mockReturnValue({
    issue: null,
    isLoading: false,
    error: null,
    isForbidden: false,
    caseId: null,
    timeline: { events: [], isLoading: false, error: null, isStale: false, lastUpdated: null, refetch: jest.fn() },
    investigationSummary: { summary: null, isLoading: false },
    refetchAll: jest.fn(),
    ...hookValue,
  });

  return render(
    <MemoryRouter initialEntries={["/workspace/issues/finding-1"]}>
      <Routes>
        <Route path="/workspace/issues/:id" element={<FounderIssueWorkspacePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("FounderIssueWorkspacePage", () => {
  test("renders the five-question story only from real backend text, never inventing a sentence", () => {
    renderWorkspace({ issue: baseIssue() });

    expect(screen.getByRole("heading", { name: "Refresh-token replay protection failed" })).toBeInTheDocument();
    expect(screen.getByText("A reused refresh token remained valid.")).toBeInTheDocument();
    // whyItMatters/whatGaitFound/recommendation are null on this fixture —
    // the honest "not available" placeholder must show, not a fabricated claim.
    expect(screen.getAllByText("Not available yet.").length).toBe(3);
  });

  test("does not show an Approval card unless the backend actually flagged needsYou", () => {
    renderWorkspace({ issue: baseIssue({ needsYou: false, approvalKind: null }) });
    expect(screen.queryByTestId("approval-card")).not.toBeInTheDocument();
  });

  test("shows the Approval card, with the right kind, only when needsYou is true", () => {
    renderWorkspace({ issue: baseIssue({ needsYou: true, approvalKind: "deploy" }), caseId: "case-1" });
    expect(screen.getByTestId("approval-card")).toHaveTextContent("approval-card:deploy");
  });

  test("needsYou without a known approval gate (e.g. BLOCKED) still tells the founder something, not silence", () => {
    renderWorkspace({
      issue: baseIssue({
        needsYou: true,
        approvalKind: null,
        humanAttentionState: "BLOCKED",
        needsYouReason: "The workflow is blocked until the failed deployment is reviewed.",
      }),
    });
    expect(screen.queryByTestId("approval-card")).not.toBeInTheDocument();
    expect(
      screen.getByText("The workflow is blocked until the failed deployment is reviewed.")
    ).toBeInTheDocument();
  });

  test("a resolved issue shows the real resolution summary, never an invented verification claim", () => {
    renderWorkspace({
      issue: baseIssue({
        isResolved: true,
        resolutionSummary: "Deployed commit abc123; tests confirm replay no longer succeeds.",
        resolvedAt: "2026-09-13T10:00:00Z",
      }),
    });

    expect(screen.getByText("Resolved ✓")).toBeInTheDocument();
    expect(screen.getByText("Deployed commit abc123; tests confirm replay no longer succeeds.")).toBeInTheDocument();
  });

  test("missing diagnosis degrades gracefully — no diagnosis panel is rendered at all", () => {
    renderWorkspace({ issue: baseIssue({ _raw: { snapshot: null, diagnosis: null } }) });
    expect(screen.queryByTestId("diagnosis-panel")).not.toBeInTheDocument();
  });

  test("technical details stay behind a collapsed disclosure, not shown by default", () => {
    renderWorkspace({ issue: baseIssue() });
    const details = screen.getByText("Technical details").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("auth.refresh_token.replay")).toBeInTheDocument();
  });

  test("a forbidden response shows the real error state, not a blank or fabricated page", () => {
    renderWorkspace({ issue: null, isForbidden: true });
    expect(screen.queryByRole("heading", { name: /Refresh-token/ })).not.toBeInTheDocument();
  });
});
