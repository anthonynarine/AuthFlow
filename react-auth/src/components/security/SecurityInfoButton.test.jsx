import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityInfoButton } from "./SecurityInfoButton";
import { __resetSecurityLearningCacheForTests } from "../../hooks/useSecurityLearning";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

describe("SecurityInfoButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityLearningCacheForTests();
  });

  test("shows Learn more when help carries a learning_topic_key", () => {
    render(
      <SecurityInfoButton
        content={{
          title: "Refresh Token Replay Protection",
          short_description: "x",
          learning_topic_key: "refresh_replay_detection",
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain Refresh Token Replay Protection" }));
    expect(screen.getByRole("button", { name: "Learn more →" })).toBeInTheDocument();
  });

  test("does not show Learn more when help has no learning_topic_key", () => {
    render(<SecurityInfoButton content={{ title: "Findings", short_description: "x" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Findings" }));
    expect(screen.queryByRole("button", { name: "Learn more →" })).not.toBeInTheDocument();
  });

  test("clicking Learn more closes the quick popup and opens the correct learning topic", async () => {
    authAxios.get.mockResolvedValue({
      data: {
        key: "refresh_replay_detection",
        title: "Refresh Replay Detection",
        category: "Authentication & Sessions",
        short_summary: "Reusing a consumed refresh credential is rejected.",
        why_it_exists: "x",
        how_it_works: "x",
        how_gait_uses_it: "x",
        example: "x",
        failure_scenario: "x",
        security_invariant: "A previously consumed refresh credential is always rejected.",
        key_takeaways: ["Detected purely from consumed_at"],
        related_topics: [],
        implementation_references: [],
        classification: "INTERNAL",
      },
    });

    render(
      <SecurityInfoButton
        content={{
          title: "Refresh Token Replay Protection",
          short_description: "x",
          learning_topic_key: "refresh_replay_detection",
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain Refresh Token Replay Protection" }));
    fireEvent.click(screen.getByRole("button", { name: "Learn more →" }));

    expect(screen.queryByRole("dialog", { name: "Refresh Token Replay Protection" })).not.toBeInTheDocument();
    await waitFor(() => expect(authAxios.get).toHaveBeenCalledWith("/security/learning/refresh_replay_detection/"));
    expect(await screen.findByRole("heading", { name: "Refresh Replay Detection" })).toBeInTheDocument();
    expect(screen.getByText("A previously consumed refresh credential is always rejected.")).toBeInTheDocument();
  });

  test("has a meaningful accessible label derived from the title, not a generic one", () => {
    render(<SecurityInfoButton title="Security Posture">content</SecurityInfoButton>);
    expect(screen.getByRole("button", { name: "Explain Security Posture" })).toBeInTheDocument();
  });

  test("an explicit label overrides the default", () => {
    render(
      <SecurityInfoButton title="Security Posture" label="Custom label">
        content
      </SecurityInfoButton>
    );
    expect(screen.getByRole("button", { name: "Custom label" })).toBeInTheDocument();
  });

  test("renders raw children when no structured content is given", () => {
    render(
      <SecurityInfoButton title="Legacy">
        <p>Legacy hardcoded copy.</p>
      </SecurityInfoButton>
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain Legacy" }));
    expect(screen.getByText("Legacy hardcoded copy.")).toBeInTheDocument();
  });

  test("renders only the sections present on backend help content, in order", () => {
    const help = {
      key: "controls",
      title: "Controls",
      short_description: "The protections Gait expects the system to maintain.",
      why_it_matters: "Controls are the durable unit Gait uses.",
      related_view: "evidence",
      // what_it_is, how_it_is_determined, data_source intentionally absent.
    };

    render(<SecurityInfoButton content={help} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Controls" }));

    expect(screen.getByRole("dialog", { name: "Controls" })).toBeInTheDocument();
    expect(screen.getByText("The protections Gait expects the system to maintain.")).toBeInTheDocument();
    expect(screen.getByText("Why does it matter?")).toBeInTheDocument();
    expect(screen.getByText("Controls are the durable unit Gait uses.")).toBeInTheDocument();
    expect(screen.getByText("Related: Evidence")).toBeInTheDocument();

    // No fabricated headings for fields the backend didn't provide.
    expect(screen.queryByText("What is this?")).not.toBeInTheDocument();
    expect(screen.queryByText("How is it determined?")).not.toBeInTheDocument();
    expect(screen.queryByText("Data source")).not.toBeInTheDocument();
  });

  test("renders backend status_explanations verbatim under one Status meanings section", () => {
    const help = {
      key: "sessions",
      title: "Sessions",
      short_description: "Server-authoritative sessions.",
      status_explanations: {
        ACTIVE: "This session is currently active.",
        REVOKED: "This session has been revoked.",
      },
    };

    render(<SecurityInfoButton content={help} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Sessions" }));

    expect(screen.getByText("Status meanings")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("This session is currently active.")).toBeInTheDocument();
    expect(screen.getByText("REVOKED")).toBeInTheDocument();
    expect(screen.getByText("This session has been revoked.")).toBeInTheDocument();
  });

  test("renders only the exact current status explanation when currentStatus is provided", () => {
    const help = {
      key: "security_posture",
      title: "Security Posture",
      short_description: "Current posture.",
      status_explanations: {
        HEALTHY: "All controls are currently healthy.",
        CONTROL_FAILURE: "The latest authoritative evidence indicates failure.",
      },
    };

    render(<SecurityInfoButton content={help} currentStatus="CONTROL_FAILURE" />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Security Posture" }));

    expect(screen.getByText("Current status meaning")).toBeInTheDocument();
    expect(screen.getByText("CONTROL FAILURE")).toBeInTheDocument();
    expect(screen.getByText("The latest authoritative evidence indicates failure.")).toBeInTheDocument();
    expect(screen.queryByText("All controls are currently healthy.")).not.toBeInTheDocument();
    expect(screen.queryByText("Status meanings")).not.toBeInTheDocument();
  });

  test("does not fabricate a current status explanation when the exact key is absent", () => {
    const help = {
      title: "Security Posture",
      short_description: "Current posture.",
      status_explanations: {
        HEALTHY: "All controls are currently healthy.",
      },
    };

    render(<SecurityInfoButton content={help} currentStatus="UNKNOWN" />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Security Posture" }));

    expect(screen.getByText("Current posture.")).toBeInTheDocument();
    expect(screen.queryByText("Current status meaning")).not.toBeInTheDocument();
    expect(screen.queryByText("Status meanings")).not.toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });

  test("renders a control's singular status_explanation as its own section", () => {
    const controlHelp = {
      title: "Refresh Token Replay Protection",
      short_description: "Prevents reuse of a consumed refresh credential.",
      status_explanation: "Trusted evidence shows consumed refresh credentials are rejected.",
    };

    render(<SecurityInfoButton content={controlHelp} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Refresh Token Replay Protection" }));

    expect(screen.getByText("What does the current status mean?")).toBeInTheDocument();
    expect(
      screen.getByText("Trusted evidence shows consumed refresh credentials are rejected.")
    ).toBeInTheDocument();
  });

  test("closes on Escape and on backdrop click", async () => {
    render(<SecurityInfoButton content={{ title: "Findings", short_description: "x" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Findings" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
