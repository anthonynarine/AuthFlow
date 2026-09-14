import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FounderIssuesPage } from "./FounderIssuesPage";
import { useFounderIssues } from "../../hooks/useFounderIssues";

jest.mock("../../hooks/useFounderIssues", () => ({ useFounderIssues: jest.fn() }));
// UI2: FounderNav now reads is_staff to decide PLATFORM vs tenant links.
jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: { is_staff: true } }),
}));

function issue(overrides) {
  return {
    id: "f-1",
    title: "Issue",
    severity: "INFO",
    severityLabel: "Low",
    severityTone: "info",
    statusLabel: "Open",
    needsYou: false,
    needsYouReason: null,
    isResolved: false,
    resolutionSummary: null,
    whatGaitFound: null,
    hasCase: false,
    lastSeenAt: "2026-09-13T00:00:00Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <FounderIssuesPage />
    </MemoryRouter>
  );
}

describe("FounderIssuesPage", () => {
  test("renders plain severity/status text, never a raw enum or finding_key", () => {
    useFounderIssues.mockReturnValue({
      issues: [
        issue({
          id: "f-1",
          title: "Refresh-token replay protection",
          severity: "HIGH",
          severityLabel: "High",
          severityTone: "danger",
          statusLabel: "Open",
        }),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderPage();

    expect(screen.getByText("Refresh-token replay protection")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.queryByText(/finding_key|auth\.refresh_token/)).not.toBeInTheDocument();
  });

  test("puts issues that need the founder's decision first, regardless of severity", () => {
    useFounderIssues.mockReturnValue({
      issues: [
        issue({ id: "f-critical", title: "Critical but no action needed", severity: "CRITICAL", needsYou: false }),
        issue({ id: "f-low-needs-you", title: "Low severity but needs you", severity: "INFO", needsYou: true }),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderPage();

    const titles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles[0]).toBe("Low severity but needs you");
  });

  test("shows an honest empty state rather than a spinner forever", () => {
    useFounderIssues.mockReturnValue({ issues: [], isLoading: false, error: null, refetch: jest.fn() });
    renderPage();
    expect(screen.getByText("No issues yet. Gait hasn't detected anything.")).toBeInTheDocument();
  });

  test("a 403 from the backend shows the real forbidden state, not an empty list", () => {
    useFounderIssues.mockReturnValue({
      issues: [],
      isLoading: false,
      error: { response: { status: 403 } },
      refetch: jest.fn(),
    });
    renderPage();
    expect(screen.queryByText("No issues yet. Gait hasn't detected anything.")).not.toBeInTheDocument();
  });
});
