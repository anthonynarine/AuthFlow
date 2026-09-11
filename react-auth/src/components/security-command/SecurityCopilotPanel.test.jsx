import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityCopilotPanel } from "./SecurityCopilotPanel";

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
