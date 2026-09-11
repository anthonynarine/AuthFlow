import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityCopilotPanel } from "./SecurityCopilotPanel";
import { SUGGESTED_MASTERY_PROMPTS } from "./sageResponse";

const mockSend = jest.fn();

jest.mock("../../hooks/useSecurityCopilot", () => ({
  useSecurityCopilot: () => ({
    messages: [],
    send: mockSend,
    clear: jest.fn(),
    isSending: false,
    error: null,
  }),
}));

/**
 * B-UX2: an operational Incident Commander request must trigger an
 * immediate trusted-state refresh in the parent (SecurityCommandPage),
 * driven only by the backend's action_status -- never by parsing the
 * prose `answer`. These tests cover the panel's half of that contract:
 * which action_status values call onOperationalResponse.
 */
describe("SecurityCopilotPanel operational refresh trigger", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  test.each(["DISPATCHED", "FAILED", "ALREADY_COMPLETE", "NOT_ELIGIBLE", "DENIED"])(
    "calls onOperationalResponse when Incident Commander returns action_status=%s",
    async (actionStatus) => {
      mockSend.mockResolvedValue({ action_status: actionStatus, answer: "Gait replied." });
      const onOperationalResponse = jest.fn();

      render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" onOperationalResponse={onOperationalResponse} />);

      fireEvent.change(screen.getByLabelText("Ask Security Copilot"), { target: { value: "Ask Blue Team to investigate" } });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => expect(onOperationalResponse).toHaveBeenCalledTimes(1));
    }
  );

  test.each([
    ["a read-only answer with no action_status", { answer: "Here is the current posture." }],
    ["NO_ACTION", { action_status: "NO_ACTION", answer: "Nothing to do." }],
    ["SUGGESTED", { action_status: "SUGGESTED", answer: "You could ask Red Team next." }],
  ])("does not call onOperationalResponse for %s", async (_label, response) => {
    mockSend.mockResolvedValue(response);
    const onOperationalResponse = jest.fn();

    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" onOperationalResponse={onOperationalResponse} />);

    fireEvent.change(screen.getByLabelText("Ask Security Copilot"), { target: { value: "What's happening?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
    expect(onOperationalResponse).not.toHaveBeenCalled();
  });

  test("does not call onOperationalResponse when the copilot request itself fails", async () => {
    mockSend.mockRejectedValue({ response: { status: 500 } });
    const onOperationalResponse = jest.fn();

    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" onOperationalResponse={onOperationalResponse} />);

    fireEvent.click(screen.getByRole("button", { name: "Explain finding" }));

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
    expect(onOperationalResponse).not.toHaveBeenCalled();
  });

  test("works when onOperationalResponse is not provided", async () => {
    mockSend.mockResolvedValue({ action_status: "DISPATCHED", answer: "Dispatched." });

    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Explain finding" }));

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  });
});

describe("SecurityCopilotPanel mastery mode controls (B-UX3)", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ answer: "ok" });
  });

  test("clicking a mode button with an empty draft fills the lead-in phrase instead of sending", () => {
    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Deep Dive" }));

    expect(screen.getByLabelText("Ask Security Copilot")).toHaveValue("Give me a deep dive on ");
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("clicking a mode button with a topic already typed sends the built prompt and clears the draft", async () => {
    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" />);

    fireEvent.change(screen.getByLabelText("Ask Security Copilot"), { target: { value: "the Gateway" } });
    fireEvent.click(screen.getByRole("button", { name: "Code Walk" }));

    await waitFor(() => expect(mockSend).toHaveBeenCalledWith("Which files should I read to understand the Gateway?"));
    expect(screen.getByLabelText("Ask Security Copilot")).toHaveValue("");
  });

  test("every learning mode is exposed as its own control, never a typed syntax", () => {
    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" />);

    ["Explain", "Deep Dive", "Code Walk", "Quiz Me", "Practice", "Compare"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  test("shows curated suggested mastery prompts when the conversation is empty, and sends the exact prompt text", async () => {
    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" />);

    const prompt = SUGGESTED_MASTERY_PROMPTS[0];
    const button = screen.getByRole("button", { name: prompt });
    fireEvent.click(button);

    await waitFor(() => expect(mockSend).toHaveBeenCalledWith(prompt));
  });
});

describe("SecurityCopilotPanel initialPrompt hand-off (B-UX3 Ask Gait / Teach this)", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ answer: "ok" });
  });

  test("auto-sends an initialPrompt exactly once and reports consumption", async () => {
    const onInitialPromptConsumed = jest.fn();
    render(
      <SecurityCopilotPanel
        caseId="case-1"
        findingId="finding-1"
        initialPrompt="Explain the Gateway"
        onInitialPromptConsumed={onInitialPromptConsumed}
      />
    );

    await waitFor(() => expect(mockSend).toHaveBeenCalledWith("Explain the Gateway"));
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(onInitialPromptConsumed).toHaveBeenCalledTimes(1);
  });

  test("a falsy initialPrompt never triggers a send", () => {
    render(<SecurityCopilotPanel caseId="case-1" findingId="finding-1" initialPrompt={undefined} />);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
