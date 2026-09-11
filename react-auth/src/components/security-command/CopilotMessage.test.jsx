import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { CopilotMessage } from "./CopilotMessage";

describe("CopilotMessage", () => {
  test("renders an operator message as-is", () => {
    render(<CopilotMessage message={{ id: "1", role: "operator", text: "What's happening?" }} />);
    expect(screen.getByText("What's happening?")).toBeInTheDocument();
  });

  test("renders a failed request safely", () => {
    render(<CopilotMessage message={{ id: "1", role: "gait", failed: true }} />);
    expect(screen.getByText("Gait could not complete that request. Try again.")).toBeInTheDocument();
  });

  test("a plain CURRENT_TRUTH-style response (no information_need) renders the existing plain-answer path unchanged", () => {
    render(
      <CopilotMessage
        message={{ id: "1", role: "gait", response: { answer: "Two findings need attention.", facts: ["2 open findings."] } }}
      />
    );
    expect(screen.getByText("Two findings need attention.")).toBeInTheDocument();
    // Never runs the structured facts through Sage's Current Truth card for a non-Sage response.
    expect(screen.queryByLabelText("Current Truth")).not.toBeInTheDocument();
  });

  test("an ACTION response still renders through CommanderDecision, unaffected by Sage rendering", () => {
    render(
      <CopilotMessage
        message={{
          id: "1",
          role: "gait",
          response: { answer: "Incident Commander dispatched Blue Team.", action_status: "DISPATCHED", specialist: "blue_team" },
        }}
      />
    );
    expect(screen.getByText("Incident Commander")).toBeInTheDocument();
    expect(screen.getByText("Dispatched")).toBeInTheDocument();
    expect(screen.queryByText("Knowledge")).not.toBeInTheDocument();
  });

  test("a Sage-handled response (information_need present) renders SecuritySageResponse, not the raw combined answer text", () => {
    const response = {
      answer: "CURRENT STATE\nfoo\n\nHOW IT WORKS\nbar",
      information_need: "KNOWLEDGE",
      basis: "KNOWLEDGE",
      learning_mode: "EXPLAIN",
      facts: ["Canonical knowledge grounded this answer with 0 citation(s)."],
      citations: [],
      limitations: [],
      next_reading: [],
      context: { sage: { answer: "The Gateway is the chokepoint.", knowledge_excerpts: [], fallback_used: false } },
    };
    render(<CopilotMessage message={{ id: "1", role: "gait", response }} originalMessage="Explain the Gateway" onAsk={jest.fn()} />);

    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.getByText("The Gateway is the chokepoint.")).toBeInTheDocument();
    expect(screen.queryByText(/CURRENT STATE/)).not.toBeInTheDocument();
  });
});
