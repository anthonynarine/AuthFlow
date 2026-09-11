import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlaybookDetailModal } from "./PlaybookDetailModal";

const READY_PLAYBOOK = {
  key: "auth.refresh_token_replay",
  version: 1,
  title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  description: "Attempts to reuse a previously rotated refresh token.",
  target_controls: [{ control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION", title: "Refresh Replay Protection" }],
  threat_class: "Token replay",
  threat_summary: "Verifies a rotated refresh token cannot be reused to mint new sessions.",
  allowed_environments: ["test"],
  required_capability: "exercise.auth.refresh_replay",
  required_authority: { level: 2, label: "L2 Bounded Probe" },
  expected_secure_behavior: "The replayed refresh token is rejected and the session family is revoked.",
  failure_condition: "The replayed refresh token is accepted.",
  evidence_type: "AUTOMATED_TEST",
  evidence_summary: "Captures the HTTP response to the replay attempt.",
  timeout_seconds: 30,
  resource_budget: { max_requests: 5, concurrency_limit: 1, max_runtime_seconds: 30 },
  risk_level: "LOW",
  tags: ["auth", "replay"],
  applicability: ["Any environment issuing refresh tokens."],
  prerequisites: ["A valid, already-rotated refresh token."],
  implementation_status: "IMPLEMENTED",
  executable: true,
};

const PLANNED_PLAYBOOK_SPARSE = {
  ...READY_PLAYBOOK,
  key: "deployment.approval_replay",
  title: "Deployment Approval Replay",
  category: "DEPLOYMENT_SECURITY",
  target_controls: [],
  evidence_summary: "",
  tags: [],
  applicability: [],
  prerequisites: [],
  implementation_status: "PLANNED",
  executable: false,
};

describe("PlaybookDetailModal", () => {
  test("renders nothing when no playbook is selected", () => {
    const { container } = render(<PlaybookDetailModal playbook={null} onClose={jest.fn()} onRunExercise={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders backend-provided playbook content", () => {
    render(<PlaybookDetailModal playbook={READY_PLAYBOOK} onClose={jest.fn()} onRunExercise={jest.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Refresh Token Replay")).toBeInTheDocument();
    expect(screen.getByText(/Verifies a rotated refresh token/)).toBeInTheDocument();
    expect(screen.getByText("The replayed refresh token is rejected and the session family is revoked.")).toBeInTheDocument();
    expect(screen.getByText("Refresh Replay Protection")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Exercise" })).toBeInTheDocument();
  });

  test("renders missing optional fields safely instead of crashing", () => {
    render(
      <PlaybookDetailModal playbook={PLANNED_PLAYBOOK_SPARSE} onClose={jest.fn()} onRunExercise={jest.fn()} />
    );

    expect(screen.getByText("No target controls listed.")).toBeInTheDocument();
    expect(screen.getByText("No applicability notes.")).toBeInTheDocument();
    expect(screen.getByText("None.")).toBeInTheDocument();
    expect(screen.getByText("No tags.")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    // A planned, non-executable playbook never exposes Run Exercise.
    expect(screen.queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
  });

  test("hides Run Exercise when the role gate forbids it, even for an executable playbook", () => {
    render(
      <PlaybookDetailModal playbook={READY_PLAYBOOK} onClose={jest.fn()} onRunExercise={jest.fn()} canRun={false} />
    );
    expect(screen.queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
  });

  test("flags and blocks a playbook that somehow advertises production", () => {
    const unsafePlaybook = { ...READY_PLAYBOOK, allowed_environments: ["test", "production"] };
    render(<PlaybookDetailModal playbook={unsafePlaybook} onClose={jest.fn()} onRunExercise={jest.fn()} />);

    expect(screen.getByText("Production exercise blocked")).toBeInTheDocument();
    expect(screen.queryByText(/production/i, { selector: "dd" })).not.toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  test("Escape closes the modal", () => {
    const onClose = jest.fn();
    render(<PlaybookDetailModal playbook={READY_PLAYBOOK} onClose={onClose} onRunExercise={jest.fn()} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
