import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityControlsSection } from "./SecurityControlsSection";
import { SecurityFindingsSection } from "./SecurityFindingsSection";
import { SecurityEvidenceSection } from "./SecurityEvidenceSection";
import { authAxios } from "../../interceptors/axios";
import { __resetSecurityHelpCacheForTests } from "../../hooks/useSecurityHelp";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

const HELP_TOPICS = [
  { key: "controls", title: "Controls", short_description: "The protections Gait expects the system to maintain." },
  { key: "findings", title: "Findings", short_description: "A durable security problem that needs investigation." },
  { key: "evidence", title: "Evidence", short_description: "The trusted, dated observations a control's status is computed from." },
];

beforeEach(() => {
  jest.clearAllMocks();
  __resetSecurityHelpCacheForTests();

  authAxios.get.mockImplementation((url) => {
    if (url === "/security/help/") {
      return Promise.resolve({ data: HELP_TOPICS });
    }
    if (url === "/security/domains/") {
      return Promise.resolve({ data: [] });
    }
    // /security/controls/, /security/findings/, /security/evidence/
    return Promise.resolve({ data: { results: [], count: 0, next: null, previous: null } });
  });
});

describe("Observatory section-level help wiring", () => {
  test("Controls section shows backend-driven help, not hardcoded copy", async () => {
    render(<SecurityControlsSection />);

    const button = await screen.findByRole("button", { name: "Explain Security Controls" });
    fireEvent.click(button);

    expect(screen.getByRole("dialog", { name: "Security Controls" })).toBeInTheDocument();
    expect(
      screen.getByText("The protections Gait expects the system to maintain.")
    ).toBeInTheDocument();
    // The old hardcoded copy must be gone.
    expect(screen.queryByText(/Lists the security controls Gait is tracking/i)).not.toBeInTheDocument();
  });

  test("Findings section shows backend-driven help, not hardcoded copy", async () => {
    render(<SecurityFindingsSection />);

    const button = await screen.findByRole("button", { name: "Explain Security Findings" });
    fireEvent.click(button);

    expect(
      screen.getByText("A durable security problem that needs investigation.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Lists detected security issues/i)).not.toBeInTheDocument();
  });

  test("Evidence section shows backend-driven help, not hardcoded copy", async () => {
    render(<SecurityEvidenceSection />);

    const button = await screen.findByRole("button", { name: "Explain Security Evidence" });
    fireEvent.click(button);

    expect(
      screen.getByText("The trusted, dated observations a control's status is computed from.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Shows the evidence records supporting/i)).not.toBeInTheDocument();
  });

  test("omits the section info button when the help API fails, without breaking the section", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security/help/") {
        return Promise.reject({ response: { status: 500 } });
      }
      if (url === "/security/domains/") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { results: [], count: 0, next: null, previous: null } });
    });

    render(<SecurityControlsSection />);

    await waitFor(() => expect(authAxios.get).toHaveBeenCalledWith("/security/help/"));
    expect(screen.getByText("Controls")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Explain /i })).not.toBeInTheDocument();
  });
});
