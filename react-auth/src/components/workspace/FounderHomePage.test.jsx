import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FounderHomePage } from "./FounderHomePage";
import { useSecurityPosture } from "../../hooks/useSecurityPosture";
import { useFounderIssues } from "../../hooks/useFounderIssues";

jest.mock("../../hooks/useSecurityPosture", () => ({ useSecurityPosture: jest.fn() }));
jest.mock("../../hooks/useFounderIssues", () => ({ useFounderIssues: jest.fn() }));

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: { first_name: "Anthony" } }),
}));
jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));

function issue(overrides = {}) {
  return {
    id: "f-1",
    title: "Refresh-token replay protection",
    severityLabel: "High",
    severityTone: "danger",
    statusLabel: "Open",
    needsYou: false,
    needsYouReason: null,
    isResolved: false,
    resolvedAt: null,
    hasDeploymentFailed: false,
    isActiveCase: false,
    lastSeenAt: "2026-09-13T12:00:00Z",
    whatGaitFound: null,
    hasCase: false,
    ...overrides,
  };
}

function renderHome() {
  return render(
    <MemoryRouter>
      <FounderHomePage />
    </MemoryRouter>
  );
}

describe("FounderHomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFounderIssues.mockReturnValue({ issues: [], isLoading: false, error: null, refetch: jest.fn() });
  });

  test("renders backend-derived security status: HEALTHY becomes Good", () => {
    useSecurityPosture.mockReturnValue({
      posture: { overall_status: "HEALTHY", controls: { healthy: 24 } },
      isLoading: false,
      error: null,
    });

    renderHome();

    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText(/24 controls checked/)).toBeInTheDocument();
  });

  test("never claims health when the backend hasn't said so — shows the honest fallback instead", () => {
    useSecurityPosture.mockReturnValue({ posture: null, isLoading: false, error: new Error("network") });

    renderHome();

    expect(screen.getAllByText("Gait is still evaluating your security.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Good")).not.toBeInTheDocument();
  });

  test("Needs You only lists issues the backend actually flagged as needing a decision", () => {
    useSecurityPosture.mockReturnValue({ posture: { overall_status: "HEALTHY" }, isLoading: false, error: null });
    useFounderIssues.mockReturnValue({
      issues: [
        issue({ id: "f-1", title: "Needs approval", needsYou: true, needsYouReason: "Deployment requires approval." }),
        issue({ id: "f-2", title: "Just investigating", needsYou: false }),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHome();

    const needsYouHeading = screen.getByRole("heading", { name: "Needs you" });
    const needsYouSection = needsYouHeading.closest("section");
    expect(within(needsYouSection).getByText("Needs approval")).toBeInTheDocument();
    // The non-actionable issue must not appear under Needs You.
    expect(needsYouSection).not.toHaveTextContent("Just investigating");
  });

  test("shows the empty state when nothing needs the founder", () => {
    useSecurityPosture.mockReturnValue({ posture: { overall_status: "HEALTHY" }, isLoading: false, error: null });
    useFounderIssues.mockReturnValue({
      issues: [issue({ needsYou: false })],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHome();

    expect(screen.getByText("Nothing needs your decision right now.")).toBeInTheDocument();
  });
});
