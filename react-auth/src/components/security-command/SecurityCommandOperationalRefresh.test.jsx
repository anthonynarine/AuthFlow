import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SecurityCommandPage from "./SecurityCommandPage";

/**
 * B-UX2: a live end-to-end test showed Security Command kept displaying a
 * stale snapshot/timeline after an operational Copilot request changed
 * backend workflow state, until the operator manually reloaded the page.
 *
 * These tests prove the fix at the page level: an operational Incident
 * Commander action_status (including FAILED -- Gateway can deny execution
 * after task/run/audit rows already exist) triggers an immediate refetch of
 * snapshot, timeline, and active cases, while a read-only response does not,
 * and a refetch failure never clears or fabricates trusted state.
 */

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({
    user: { first_name: "Security", last_name: "Staff", email: "security@example.test" },
  }),
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: jest.fn().mockResolvedValue(undefined),
  }),
}));

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

jest.mock("../../hooks/useSecurityPosture", () => ({
  useSecurityPosture: () => ({
    posture: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const selectedCase = {
  id: "case-1234567890",
  finding_id: "finding-1234567890",
  finding_title: "Refresh Replay Failure",
  status_label: "Investigating",
  updated_at: "2026-09-07T18:10:00Z",
};

const mockActiveCasesRefetch = jest.fn().mockResolvedValue([selectedCase]);
jest.mock("../../hooks/useActiveSecurityCases", () => ({
  useActiveSecurityCases: () => ({
    cases: [selectedCase],
    isLoading: false,
    error: null,
    refetch: mockActiveCasesRefetch,
  }),
}));

const mockSnapshotRefetch = jest.fn().mockResolvedValue({});
jest.mock("../../hooks/useSecurityCaseSnapshot", () => ({
  useSecurityCaseSnapshot: () => ({
    snapshot: {
      current_state_label: "Investigating",
      human_attention_state: "NO_ACTION_REQUIRED",
      human_attention_label: "No action required",
      next_available_action: "INVESTIGATE",
      next_available_action_label: "Ask Blue Team to investigate",
      specialists: {},
    },
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
    refetch: mockSnapshotRefetch,
  }),
}));

const mockTimelineRefetch = jest.fn().mockResolvedValue(undefined);
jest.mock("../../hooks/useSecurityCaseTimeline", () => ({
  useSecurityCaseTimeline: () => ({
    events: [],
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
    refetch: mockTimelineRefetch,
  }),
}));

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

jest.mock("../../hooks/useSecurityFindingRecommendation", () => ({
  useSecurityFindingRecommendation: () => ({
    recommendation: null,
    isLoading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock("../../hooks/useSecurityRecommendationActions", () => ({
  useSecurityRecommendationActions: () => ({
    generateRecommendation: jest.fn(),
    acceptRecommendation: jest.fn(),
    dismissRecommendation: jest.fn(),
    isSubmitting: false,
    submitError: null,
    lastAction: null,
    resetError: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityCaseInvestigationSummary", () => ({
  useSecurityCaseInvestigationSummary: () => ({
    summary: null,
    isLoading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("../../hooks/useSecurityCaseDiagnosis", () => ({
  useSecurityCaseDiagnosis: () => ({
    diagnosis: null,
    isLoading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(null),
  }),
}));

async function askCopilot(text) {
  fireEvent.change(screen.getByLabelText("Ask Security Copilot"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

describe("Security Command immediate trusted-state refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveCasesRefetch.mockResolvedValue([selectedCase]);
    mockSnapshotRefetch.mockResolvedValue({});
    mockTimelineRefetch.mockResolvedValue(undefined);
  });

  test.each(["DISPATCHED", "FAILED", "ALREADY_COMPLETE", "NOT_ELIGIBLE", "DENIED"])(
    "refetches snapshot, timeline, and active cases after action_status=%s",
    async (actionStatus) => {
      mockSend.mockResolvedValue({ action_status: actionStatus, specialist: "investigator" });

      render(
        <MemoryRouter>
          <SecurityCommandPage />
        </MemoryRouter>
      );

      await askCopilot("Ask Blue Team to investigate.");

      await waitFor(() => expect(mockSnapshotRefetch).toHaveBeenCalledWith({ silent: true }));
      expect(mockTimelineRefetch).toHaveBeenCalledTimes(1);
      expect(mockActiveCasesRefetch).toHaveBeenCalledTimes(1);
    }
  );

  test("does not refetch trusted state for a read-only Q&A response", async () => {
    mockSend.mockResolvedValue({ action_status: "NO_ACTION", answer: "Here is the current posture." });

    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    await askCopilot("What's happening?");

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
    expect(mockSnapshotRefetch).not.toHaveBeenCalled();
    expect(mockTimelineRefetch).not.toHaveBeenCalled();
    expect(mockActiveCasesRefetch).not.toHaveBeenCalled();
  });

  test("does not refetch trusted state for a merely-suggested next step", async () => {
    mockSend.mockResolvedValue({ action_status: "SUGGESTED", specialist: "red_team" });

    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    await askCopilot("What's next?");

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
    expect(mockSnapshotRefetch).not.toHaveBeenCalled();
  });

  test("a failed immediate refresh does not clear the visible case or crash the page", async () => {
    mockSend.mockResolvedValue({ action_status: "DISPATCHED", specialist: "investigator" });
    mockSnapshotRefetch.mockRejectedValue({ response: { status: 500 } });
    mockTimelineRefetch.mockRejectedValue({ response: { status: 500 } });
    mockActiveCasesRefetch.mockRejectedValue({ response: { status: 500 } });

    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    await askCopilot("Ask Blue Team to investigate.");

    await waitFor(() => expect(mockSnapshotRefetch).toHaveBeenCalledWith({ silent: true }));

    // The case and its last-known state both remain visible -- a refetch
    // failure is not reported as a workflow failure and never fabricates or
    // clears trusted state.
    expect(screen.getAllByText("Refresh Replay Failure").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Investigating").length).toBeGreaterThan(0);
  });
});
