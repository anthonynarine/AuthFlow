import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { consoleKeys } from "../../../console/api/queryKeys";
import { acceptInviteById, fetchMyInvites } from "../../../console/api/consoleApi";
import { OnboardingWizardPage } from "./OnboardingWizardPage";
import { useOrganizations } from "../../../hooks/useOrganizations";
import { useOrganizationApplications } from "../../../hooks/useOrganizationApplications";

jest.mock("../../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../../hooks/useOrganizations", () => ({ useOrganizations: jest.fn() }));
jest.mock("../../../console/api/consoleApi", () => ({ fetchMyInvites: jest.fn(), acceptInviteById: jest.fn() }));
jest.mock("../../../hooks/useOrganizationApplications", () => ({ useOrganizationApplications: jest.fn() }));
jest.mock("../../../hooks/useValidateSessionOnMount", () => ({ useValidateSessionOnMount: jest.fn() }));
jest.mock("../../../context/auth/UserSessionContext", () => ({ useUserSessionServices: () => ({ validateSession: jest.fn(() => Promise.resolve()) }) }));
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

// `invites`: what Gait's "my invites" already said (default none; undefined: not asked yet).
function renderWizard(initialPath = "/workspace/onboarding", options = {}) {
  const invites = "invites" in options ? options.invites : [];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  if (invites !== undefined) client.setQueryData(consoleKeys.myInvites(), invites);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/workspace/onboarding" element={<OnboardingWizardPage />} />
          <Route path="/console/:orgSlug/overview" element={<p>Workspace overview</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OnboardingWizardPage — Company step", () => {
  beforeEach(() => jest.clearAllMocks());

  test("zero Companies shows Create your workspace", () => {
    useOrganizations.mockReturnValue(orgs([]));
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();
    expect(screen.getByRole("heading", { name: "Create your workspace" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Which workspace are you working in?" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create your workspace" })).not.toBeInTheDocument();
  });

  test("exactly one Company skips company creation and goes straight to the App step", () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(apps([]));
    renderWizard();
    expect(screen.queryByRole("heading", { name: "Create your workspace" })).not.toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("Workspace name"), { target: { value: "Acme Inc" } });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));

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

    fireEvent.change(screen.getByLabelText("Workspace name"), { target: { value: "Acme Inc" } });
    expect(screen.getByText("An organization with this slug already exists.")).toBeInTheDocument();
    // Entered data is never cleared on error.
    expect(screen.getByLabelText("Workspace name")).toHaveValue("Acme Inc");
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

    expect(screen.queryByRole("heading", { name: "Create your workspace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add your first App" })).not.toBeInTheDocument();
    expect(screen.getByTestId("app-setup-flow")).toHaveTextContent("app-setup-flow:Acme API");
  });

  test("a failed Apps load says so in the card and offers Retry", () => {
    const refetch = jest.fn();
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(apps([], { error: { response: { status: 500, data: {} } }, refetch }));
    renderWizard();

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong loading this. Please try again.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("a 403 on the Apps load explains the permission and offers no Retry", () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "MEMBER", membership_status: "ACTIVE" }])
    );
    useOrganizationApplications.mockReturnValue(apps([], { error: { response: { status: 403, data: {} } } }));
    renderWizard();

    expect(screen.getByRole("alert")).toHaveTextContent("You don't have permission to see this workspace.");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});

const INVITE = {
  id: "3f0c6a52-0000-4000-8000-000000000001",
  organization_name: "Lumen",
  organization_slug: "lumen",
  org_role: "ADMIN",
  invited_by_email: "owner@lumen.test",
  expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 - 60000).toISOString(),
};

describe("OnboardingWizardPage — invited, no workspace yet (INV-UX)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrganizations.mockReturnValue(orgs([]));
    useOrganizationApplications.mockReturnValue(apps([]));
    fetchMyInvites.mockResolvedValue([]);
  });

  test("pending invites come first; creating a workspace is the secondary choice", () => {
    renderWizard(undefined, { invites: [INVITE] });
    expect(screen.getByRole("heading", { name: "Join your team's workspace" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Your invitations" })).toHaveTextContent("Lumen invited you to its workspace as Admin");
    expect(screen.queryByRole("heading", { name: "Create your workspace" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create your own workspace" }));
    expect(screen.getByRole("heading", { name: "Create your workspace" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back to your invitations (1)" }));
    expect(screen.getByRole("heading", { name: "Join your team's workspace" })).toBeInTheDocument();
  });

  test("joining from onboarding lands in the workspace", async () => {
    acceptInviteById.mockResolvedValue({ organization_slug: "lumen", organization_name: "Lumen", org_role: "ADMIN" });
    renderWizard(undefined, { invites: [INVITE] });
    fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
    fireEvent.click(screen.getByRole("button", { name: "Join Lumen as an Admin" }));
    expect(await screen.findByText("Workspace overview")).toBeInTheDocument();
    expect(acceptInviteById).toHaveBeenCalledWith(INVITE.id);
  });

  test("while Gait is asked for invites, nothing is offered yet", () => {
    fetchMyInvites.mockReturnValue(new Promise(() => {}));
    renderWizard(undefined, { invites: undefined });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create your workspace" })).not.toBeInTheDocument();
  });

  test("an unconfirmed email (403) means no invites to show yet: the create step as before", async () => {
    fetchMyInvites.mockRejectedValue({ response: { status: 403, data: { code: "EMAIL_NOT_VERIFIED" } } });
    renderWizard(undefined, { invites: undefined });
    expect(await screen.findByRole("heading", { name: "Create your workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Your invitations" })).not.toBeInTheDocument();
  });

  test("with a workspace already, onboarding doesn't ask for invites (the console offers them)", async () => {
    useOrganizations.mockReturnValue(
      orgs([{ id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" }])
    );
    renderWizard(undefined, { invites: undefined });
    expect(screen.getByRole("heading", { name: "Add your first App" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMyInvites).not.toHaveBeenCalled());
  });
});
