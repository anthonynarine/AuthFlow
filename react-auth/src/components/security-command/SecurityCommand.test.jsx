import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityInfoButton } from "../security/SecurityInfoButton";
import { ActiveCasesPanel } from "./ActiveCasesPanel";
import { CaseHeader } from "./CaseHeader";
import { CaseTimeline } from "./CaseTimeline";
import { CopilotMessage } from "./CopilotMessage";
import { HumanAttentionBanner } from "./HumanAttentionBanner";
import { WorkflowProgress } from "./WorkflowProgress";
import { normalizeSecurityRoleText } from "./roleTerminology";

jest.mock("../../hooks/useSecurityHelp", () => ({
  useSecurityHelp: () => ({
    isLoading: false,
    error: null,
    getTopic: () => null,
    retry: jest.fn(),
  }),
}));

// SecurityInfoButton's "Learn more" affordance lazily imports the real
// authAxios client via this hook; stub it so rendering SecurityInfoButton
// in these tests never touches the network (or the real, unmockable axios
// package Jest can't parse here).
jest.mock("../../hooks/useSecurityLearning", () => ({
  fetchLearningTopic: jest.fn(() => Promise.reject(new Error("not mocked in this test"))),
  useSecurityLearningIndex: () => ({ topics: [], isLoading: false, error: null, retry: jest.fn() }),
  __resetSecurityLearningCacheForTests: jest.fn(),
}));

const events = [
  {
    id: "event-1",
    timestamp: "2026-09-07T18:03:00Z",
    actor_display_name: "Security Observatory",
    event_type: "FINDING_OPENED",
    status: "OPEN",
    summary: "Finding opened.",
    category: "SECURITY",
    source_type: "SecurityFinding",
    source_id: "finding-1234567890",
    source: { type: "SecurityFinding", id: "finding-1234567890" },
  },
  {
    id: "event-2",
    timestamp: "2026-09-07T18:04:00Z",
    actor_display_name: "Commander",
    event_type: "CASE_TRANSITION_ALLOW",
    status: "INVESTIGATING",
    summary: "Investigation dispatched.",
    category: "COMMANDER",
    source_type: "CaseTransitionLog",
    source_id: "transition-1",
    source: { type: "CaseTransitionLog", id: "transition-1" },
  },
  {
    id: "event-3",
    timestamp: "2026-09-07T18:31:00Z",
    actor_display_name: "security_validator_v1",
    event_type: "VALIDATION_REPORT_CREATED",
    status: "VALID",
    summary: "ValidationReport created.",
    category: "VALIDATION",
    source_type: "ValidationReport",
    source_id: "27",
    source: { type: "ValidationReport", id: "27" },
  },
  {
    id: "event-4",
    timestamp: "2026-09-07T18:48:00Z",
    actor_display_name: "Security Observatory",
    event_type: "POST_DEPLOY_VERIFICATION_SUCCEEDED",
    status: "HEALTHY",
    summary: "Post-deploy evidence evaluated.",
    category: "VERIFICATION",
    source_type: "SecurityEvidence",
    source_id: "evidence-1",
    source: { type: "SecurityEvidence", id: "evidence-1" },
  },
  {
    id: "event-5",
    timestamp: "2026-09-07T18:49:00Z",
    actor_display_name: "Security Observatory",
    event_type: "SECURITY_CONTROL_EVALUATED",
    status: "HEALTHY",
    summary: "Control evaluated.",
    category: "VERIFICATION",
    source_type: "SecurityControl",
    source_id: "control-1",
    source: { type: "SecurityControl", id: "control-1" },
  },
];

describe("Security Command timeline", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  test("renders actor-first rows with canonical role labels and concise outcomes", () => {
    render(
      <CaseTimeline
        events={events}
        isLoading={false}
        error={null}
        isStale={false}
        lastUpdated={null}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Incident Commander")).toBeInTheDocument();
    expect(screen.getByText("Security Validator")).toBeInTheDocument();
    expect(screen.getAllByText("Security Truth").length).toBeGreaterThan(0);
    expect(screen.getByText("Finding opened")).toBeInTheDocument();
    expect(screen.getByText("Validation completed - VALID")).toBeInTheDocument();
    expect(screen.getByText("Post-deploy evidence evaluated")).toBeInTheDocument();
    expect(screen.getByText("Control - HEALTHY")).toBeInTheDocument();
    expect(screen.queryByText("security_validator_v1")).not.toBeInTheDocument();
  });

  test("keeps technical provenance expandable without cluttering the main label", () => {
    render(
      <CaseTimeline
        events={[events[2]]}
        isLoading={false}
        error={null}
        isStale={false}
        lastUpdated={null}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Artifact: ValidationReport #27")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Technical details"));
    expect(screen.getByText("Event type")).toBeInTheDocument();
    expect(screen.getByText("VALIDATION_REPORT_CREATED")).toBeInTheDocument();
    expect(screen.getByText("Source ID")).toBeInTheDocument();
  });

  test("copies a clean operator timeline without raw provenance", async () => {
    render(
      <CaseTimeline
        events={events.slice(0, 3)}
        isLoading={false}
        error={null}
        isStale={false}
        lastUpdated={null}
        onRetry={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy timeline" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
    const copied = navigator.clipboard.writeText.mock.calls[0][0];
    expect(copied).toContain("System - Finding opened");
    expect(copied).toContain("Incident Commander - Blue Team dispatched");
    expect(copied).toContain("Security Validator - Validation completed - VALID");
    expect(copied).not.toContain("security_validator_v1");
    expect(copied).not.toContain("ValidationReport");
  });
});

describe("Security Command workflow progress", () => {
  test("uses the same canonical role names as the timeline", () => {
    render(
      <WorkflowProgress
        specialists={{
          investigator: { status: "COMPLETE", label: "Complete" },
          red_team: { status: "COMPLETE", label: "Reproduced" },
          repair: { status: "RUNNING", label: "Running" },
          validator: { status: "WAITING", label: "Waiting" },
          deployer: { status: "LOCKED", label: "Locked" },
        }}
        humanAttentionState="HUMAN_APPROVAL_REQUIRED"
        isLoading={false}
      />
    );

    expect(screen.getByText("Blue Team")).toBeInTheDocument();
    expect(screen.getByText("Red Team")).toBeInTheDocument();
    expect(screen.getByText("Green Team")).toBeInTheDocument();
    expect(screen.getByText("Security Validator")).toBeInTheDocument();
    expect(screen.getByText("Human Approver")).toBeInTheDocument();
    expect(screen.getByText("Release Engineer")).toBeInTheDocument();
    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
  });

  test("normalizes backend-provided specialist status labels without changing state keys", () => {
    render(
      <WorkflowProgress
        specialists={{
          investigator: { status: "COMPLETE", label: "Investigator complete" },
          red_team: { status: "WAITING", label: "security_red_team_v1 waiting" },
          repair: { status: "RUNNING", label: "security_repair_v1 running" },
          validator: { status: "WAITING", label: "Validator waiting" },
          deployer: { status: "LOCKED", label: "Deployer locked" },
        }}
        humanAttentionState="NO_ACTION_REQUIRED"
        isLoading={false}
      />
    );

    expect(screen.getByText("Blue Team complete")).toBeInTheDocument();
    expect(screen.getByText("Red Team waiting")).toBeInTheDocument();
    expect(screen.getByText("Green Team running")).toBeInTheDocument();
    expect(screen.getByText("Security Validator waiting")).toBeInTheDocument();
    expect(screen.getByText("Release Engineer locked")).toBeInTheDocument();
    expect(screen.queryByText(/security_repair_v1|security_validator_v1|B-AGENT/i)).not.toBeInTheDocument();
  });
});

describe("Security Command case and Human Review terminology", () => {
  test("normalizes Active Cases and Selected Case backend labels", () => {
    const selectedCase = {
      id: "case-1234567890",
      finding_id: "finding-1234567890",
      finding_title: "Refresh Replay Failure",
      status_label: "Validator waiting",
      updated_at: "2026-09-07T18:10:00Z",
    };
    const snapshot = {
      current_state_label: "Awaiting Human Approval",
      human_attention_label: "Human approval required",
      next_available_action_label: "Deployer release",
    };

    render(
      <MemoryRouter>
        <ActiveCasesPanel
          cases={[selectedCase]}
          isLoading={false}
          error={null}
          onRetry={jest.fn()}
          selectedCaseId={selectedCase.id}
          onSelectCase={jest.fn()}
        />
        <CaseHeader selectedCase={selectedCase} snapshot={snapshot} isSnapshotLoading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText("Security Validator waiting")).toBeInTheDocument();
    expect(screen.getByText("Awaiting Human Approver")).toBeInTheDocument();
    expect(screen.getByText("Human Approver required")).toBeInTheDocument();
    expect(screen.getByText("Release Engineer release")).toBeInTheDocument();
    // No recommendation was supplied, so the Strategy Recommendation card
    // renders its empty state rather than the old disabled approval stub.
    expect(
      screen.getByText("No strategy recommendation has been generated for this security concern.")
    ).toBeInTheDocument();
  });

  test("normalizes Human Attention approval states and reasons", () => {
    render(
      <HumanAttentionBanner
        snapshot={{
          human_attention_state: "HUMAN_APPROVAL_REQUIRED",
          human_attention_label: "Human approval required",
          human_attention_reason: "Validator approved; Human must approve exact artifact.",
          next_available_action_label: "Human Approval",
        }}
        isLoading={false}
        isStale={false}
        lastUpdated={null}
      />
    );

    expect(screen.getByText("Human Approver required")).toBeInTheDocument();
    expect(screen.getByText("Next: Human Approver")).toBeInTheDocument();
    expect(screen.getByText("Security Validator approved; Human Approver must approve exact artifact.")).toBeInTheDocument();
    expect(screen.getByText("Human Review / Approval UI coming in the next milestone.")).toBeInTheDocument();
  });
});

describe("Security Command Copilot terminology", () => {
  test("normalizes backend response text and Commander decisions for operator display", () => {
    render(
      <CopilotMessage
        message={{
          role: "gait",
          response: {
            answer: "Investigator completed diagnosis. Validator has not started.",
            action_status: "DENIED",
            specialist: "security_repair_v1",
            decision_reason: "VALIDATOR_REQUIRED",
            sources: [],
          },
        }}
      />
    );

    expect(screen.getByText("Blue Team completed diagnosis. Security Validator has not started.")).toBeInTheDocument();
    expect(screen.getByText("Incident Commander")).toBeInTheDocument();
    expect(screen.getByText("Green Team")).toBeInTheDocument();
    expect(screen.getByText("Incident Commander denied the request because Security Validator required.")).toBeInTheDocument();
    expect(screen.getByText("Reason: Security Validator required")).toBeInTheDocument();
    expect(screen.queryByText(/security_repair_v1/)).not.toBeInTheDocument();
  });

  test("renders dispatched Commander decisions as canonical operator prose", () => {
    render(
      <CopilotMessage
        message={{
          role: "gait",
          response: {
            answer: "Red Team can act next.",
            action_status: "DISPATCHED",
            specialist: "security_red_team_v1",
            sources: [],
          },
        }}
      />
    );

    expect(screen.getByText("Incident Commander dispatched Red Team.")).toBeInTheDocument();
    expect(screen.queryByText(/security_red_team_v1|B-AGENT/i)).not.toBeInTheDocument();
  });

  test("does not double-normalize canonical backend display names", () => {
    expect(normalizeSecurityRoleText("Security Validator verified it for Human Approver.")).toBe(
      "Security Validator verified it for Human Approver."
    );
  });

  test("maps fallback technical principals to canonical display names", () => {
    expect(normalizeSecurityRoleText("security_commander_v1")).toBe("Incident Commander");
    expect(normalizeSecurityRoleText("security_investigator_v1")).toBe("Blue Team");
    expect(normalizeSecurityRoleText("security_red_team_v1")).toBe("Red Team");
    expect(normalizeSecurityRoleText("security_repair_v1")).toBe("Green Team");
    expect(normalizeSecurityRoleText("security_validator_v1")).toBe("Security Validator");
    expect(normalizeSecurityRoleText("security_deployer_v1")).toBe("Release Engineer");
    expect(normalizeSecurityRoleText("security_staging_deployer_v1")).toBe("Release Engineer");
    expect(normalizeSecurityRoleText("Commander")).toBe("Incident Commander");
    expect(normalizeSecurityRoleText("Human")).toBe("Human Approver");
  });
});

describe("Security Command section info", () => {
  test("opens and closes a responsibility popup", async () => {
    render(
      <SecurityInfoButton title="Active Cases">
        <p>Lists active security cases from the Command query service.</p>
      </SecurityInfoButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain Active Cases" }));
    expect(screen.getByRole("dialog", { name: "Active Cases" })).toBeInTheDocument();
    expect(screen.getByText("Lists active security cases from the Command query service.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
