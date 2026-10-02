import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkspaceEntry } from "./WorkspaceEntry";
import { useOrganizations } from "../../hooks/useOrganizations";

jest.mock("../../hooks/useOrganizations", () => ({ useOrganizations: jest.fn() }));

let mockUser = null;
jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: mockUser }),
}));
jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("./FounderHomePage", () => ({
  FounderHomePage: () => <div data-testid="founder-home-page">platform-home</div>,
}));

function renderEntry() {
  return render(
    <MemoryRouter initialEntries={["/workspace"]}>
      <Routes>
        <Route path="/workspace" element={<WorkspaceEntry />} />
        <Route path="/workspace/onboarding" element={<div data-testid="onboarding">onboarding</div>} />
        <Route path="/console" element={<div data-testid="console-entry">console-entry</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("WorkspaceEntry — PLATFORM vs tenant routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  test("an operator gets the existing PLATFORM FounderHomePage unmodified, regardless of Company count", () => {
    mockUser = { is_gait_operator: true };
    useOrganizations.mockReturnValue({ organizations: [], isLoading: false });
    renderEntry();
    expect(screen.getByTestId("founder-home-page")).toBeInTheDocument();
  });

  test("OPS1: staff without is_gait_operator gets the tenant path, never FounderHomePage", () => {
    mockUser = { is_staff: true, is_superuser: true };
    useOrganizations.mockReturnValue({ organizations: [], isLoading: false });
    renderEntry();
    expect(useOrganizations).toHaveBeenCalledWith(true);
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
    expect(screen.queryByTestId("founder-home-page")).not.toBeInTheDocument();
  });

  test("non-staff with zero Companies is routed to onboarding, never shown FounderHomePage", () => {
    mockUser = { is_gait_operator: false };
    useOrganizations.mockReturnValue({ organizations: [], isLoading: false });
    renderEntry();
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
    expect(screen.queryByTestId("founder-home-page")).not.toBeInTheDocument();
  });

  test("non-staff with an existing Company is routed to the tenant console, never PLATFORM data", () => {
    mockUser = { is_gait_operator: false };
    useOrganizations.mockReturnValue({
      organizations: [{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER" }],
      isLoading: false,
    });
    renderEntry();
    expect(screen.getByTestId("console-entry")).toBeInTheDocument();
    expect(screen.queryByTestId("founder-home-page")).not.toBeInTheDocument();
  });

  test("non-staff with multiple Companies is also routed to the console (its org switcher handles which one)", () => {
    mockUser = { is_gait_operator: false };
    useOrganizations.mockReturnValue({
      organizations: [
        { id: "1", name: "Acme", slug: "acme", org_role: "OWNER" },
        { id: "2", name: "Beta", slug: "beta", org_role: "MEMBER" },
      ],
      isLoading: false,
    });
    renderEntry();
    expect(screen.getByTestId("console-entry")).toBeInTheDocument();
  });

  test("organizations are never fetched for a staff user (they don't need onboarding forced on them)", () => {
    mockUser = { is_gait_operator: true };
    useOrganizations.mockReturnValue({ organizations: [], isLoading: false });
    renderEntry();
    expect(useOrganizations).toHaveBeenCalledWith(false);
  });
});
