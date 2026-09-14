import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OnboardingWizardPage } from "./OnboardingWizardPage";
import { useOrganizations } from "../../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../../hooks/useOrganizationApplications";

jest.mock("../../../hooks/useOrganizations", () => ({ useOrganizations: jest.fn() }));
jest.mock("../../../hooks/useOrganizationApplications", () => ({ useOrganizationApplications: jest.fn() }));
jest.mock("../../../hooks/useValidateSessionOnMount", () => ({ useValidateSessionOnMount: jest.fn() }));
jest.mock("../../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: { is_staff: true, first_name: "Anthony" } }),
}));
jest.mock("./AppSetupFlow", () => ({
  AppSetupFlow: ({ application, onDone }) => (
    <div data-testid="app-setup-flow">
      app-setup-flow:{application.name}
      <button type="button" onClick={onDone}>
        finish-setup
      </button>
    </div>
  ),
}));

function orgs(list, overrides = {}) {
  return {
    organizations: list,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    createOrganization: jest.fn(),
    isCreating: false,
    createError: null,
    ...overrides,
  };
}

function apps(list, overrides = {}) {
  return {
    applications: list,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    createApplication: jest.fn(),
    isCreating: false,
    createError: null,
    ...overrides,
  };
}

function renderWizard(initialPath = "/workspace/onboarding") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/workspace/onboarding" element={<OnboardingWizardPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OnboardingWizardPage — Company step", () => {
  beforeEach(() => jest.clearAllMocks());

  test("zero Companies shows Create your Company", () => {
    useOrganizations.mockReturnValue(orgs([]));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();
    expect(screen.getByRole("heading", { name: "Create your Company" })).toBeInTheDocument();
  });

  test("multiple Companies with none chosen shows the chooser, not a create form", () => {
    useOrganizations.mockReturnValue(
      orgs([
        { id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" },
        { id: "2", name: "Beta", slug: "beta", org_role: "OWNER", membership_status: "ACTIVE" },
      ])
    );
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();
    expect(screen.getByRole("heading", { name: "Which Company are you working on?" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create your Company" })).not.toBeInTheDocument();
  });

  test("exactly one Company skips company creation and goes straight to the App step", () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();
    expect(screen.queryByRole("heading", { name: "Create your Company" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add your first App" })).toBeInTheDocument();
  });

  test("successful Company creation sends only { name, slug } — never role/status/is_staff", async () => {
    const createOrganization = jest.fn().mockResolvedValue({
      id: "new-1",
      name: "Acme Inc",
      slug: "acme-inc",
      status: "ACTIVE",
      org_role: "OWNER",
      membership_status: "ACTIVE",
    });
    useOrganizations.mockReturnValue(orgs([], { createOrganization }));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();

    fireEvent.change(screen.getByLabelText("Company name"), { target: { value: "Acme Inc" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));

    expect(createOrganization).toHaveBeenCalledTimes(1);
    const payload = createOrganization.mock.calls[0][0];
    expect(payload).toEqual({ name: "Acme Inc", slug: "acme-inc" });
    expect(Object.keys(payload).sort()).toEqual(["name", "slug"]);
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("is_staff");
    expect(payload).not.toHaveProperty("org_role");
  });

  test("Company validation failure keeps the form data and shows the real backend error", () => {
    useOrganizations.mockReturnValue(
      orgs([], { createError: { response: { data: { detail: "An organization with this slug already exists." } } } })
    );
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();

    fireEvent.change(screen.getByLabelText("Company name"), { target: { value: "Acme Inc" } });
    expect(screen.getByText("An organization with this slug already exists.")).toBeInTheDocument();
    // Entered data is never cleared on error.
    expect(screen.getByLabelText("Company name")).toHaveValue("Acme Inc");
  });
});

describe("OnboardingWizardPage — App step", () => {
  beforeEach(() => jest.clearAllMocks());

  test("successful App creation sends only { name, slug, environment } — organization comes from the route", async () => {
    const createApplication = jest.fn().mockResolvedValue({
      id: "app-1",
      name: "Acme API",
      slug: "acme-api",
      environment: "production",
      status: "ACTIVE",
    });
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(apps([], { createApplication }));
    renderWizard();

    fireEvent.change(screen.getByLabelText("App name"), { target: { value: "Acme API" } });
    fireEvent.click(screen.getByRole("button", { name: "Add App" }));

    expect(createApplication).toHaveBeenCalledTimes(1);
    const payload = createApplication.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(["environment", "name", "slug"]);
    expect(payload).not.toHaveProperty("organization");
    expect(payload).not.toHaveProperty("organization_id");
    expect(payload).not.toHaveProperty("created_by");
    // useOrganizationApplications itself is the hook called with the current
    // Company's slug (asserted via the mock's call to the hook factory).
    expect(useOrganizationApplications).toHaveBeenCalledWith("acme");
  });

  test("App validation failure (e.g. duplicate slug) keeps the form and shows the real error", () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(
      apps([], { createError: { response: { data: { detail: "An application with this slug already exists in this environment." } } } })
    );
    renderWizard();

    fireEvent.change(screen.getByLabelText("App name"), { target: { value: "Acme API" } });
    expect(
      screen.getByText("An application with this slug already exists in this environment.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("App name")).toHaveValue("Acme API");
  });
});

describe("OnboardingWizardPage — App setup step", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Company + App already existing skips both creation steps entirely", () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(
      apps([{ id: "app-1", name: "Acme API", slug: "acme-api", environment: "production", status: "ACTIVE" }])
    );
    renderWizard();

    expect(screen.queryByRole("heading", { name: "Create your Company" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add your first App" })).not.toBeInTheDocument();
    expect(screen.getByTestId("app-setup-flow")).toHaveTextContent("app-setup-flow:Acme API");
  });
});
