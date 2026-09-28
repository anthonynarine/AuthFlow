import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppsHomePage } from "./AppsHomePage";
import { useOrganizations } from "../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../hooks/useOrganizationApplications";

jest.mock("../../hooks/useOrganizations", () => ({ useOrganizations: jest.fn() }));
jest.mock("../../hooks/useOrganizationApplications", () => ({ useOrganizationApplications: jest.fn() }));
jest.mock("../../hooks/useValidateSessionOnMount", () => ({ useValidateSessionOnMount: jest.fn() }));
jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: { is_staff: false } }),
}));

function orgs(list) {
  return { organizations: list, isLoading: false, error: null, refetch: jest.fn() };
}

function apps(list, overrides = {}) {
  return { applications: list, isLoading: false, error: null, refetch: jest.fn(), ...overrides };
}

function renderPage(path = "/workspace/apps") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workspace/apps" element={<AppsHomePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AppsHomePage — the honest tenant founder home", () => {
  beforeEach(() => jest.clearAllMocks());

  test("multiple Companies with no ?org= shows the chooser", () => {
    useOrganizations.mockReturnValue(
      orgs([
        { id: "1", name: "Acme", slug: "acme", org_role: "OWNER" },
        { id: "2", name: "Beta", slug: "beta", org_role: "MEMBER" },
      ])
    );
    useOrganizationApplications.mockReturnValue(apps([]));
    renderPage();
    expect(screen.getByRole("heading", { name: "Which workspace are you working in?" })).toBeInTheDocument();
  });

  test("no Apps yet offers Add your first App, never a fake Apps table", () => {
    useOrganizations.mockReturnValue(orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER" }]));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderPage();
    expect(screen.getByRole("link", { name: "Add your first App" })).toHaveAttribute(
      "href",
      "/workspace/onboarding?org=acme"
    );
  });

  test("Apps exist: lists them plainly and shows the honest security empty state, never 'Connected'", () => {
    useOrganizations.mockReturnValue(orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER" }]));
    useOrganizationApplications.mockReturnValue(
      apps([{ id: "app-1", name: "Acme API", slug: "acme-api", environment: "production", status: "ACTIVE" }])
    );
    renderPage();

    expect(screen.getByText("Acme API")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
    expect(
      screen.getByText("Your App is set up. Gait has not received enough security activity to show issues yet.")
    ).toBeInTheDocument();

    // BACKEND_UI_CONTRACT_GAP: APPLICATION_ACTIVITY_STATUS — no backend
    // signal exists for this, so the page must never claim it anyway.
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
  });

  test("a Company with no membership match for ?org= never invents a Company", () => {
    useOrganizations.mockReturnValue(orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER" }]));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderPage("/workspace/apps?org=not-a-real-company");
    expect(screen.getByRole("heading", { name: "Which workspace are you working in?" })).toBeInTheDocument();
  });

  test("zero Companies points back to onboarding, not a broken empty page", () => {
    useOrganizations.mockReturnValue(orgs([]));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderPage();
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute("href", "/workspace/onboarding");
  });
});
