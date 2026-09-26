import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleLayout } from "../../layout/ConsoleLayout";
import { ApplicationsPage } from "./ApplicationsPage";
import { ApplicationDetailPage } from "./ApplicationDetailPage";
import {
    changeApplicationStatus,
    createApplication,
    fetchApplication,
    fetchApplicationActivity,
    fetchApplications,
    fetchCredentials,
    fetchMyOrganizations,
    fetchPostureOverview,
    issueCredential,
    renameApplication,
    revokeCredential,
} from "../../api/consoleApi";

jest.mock("../../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: { email: "me@app-one.test" }, isLoggedIn: true, logout: jest.fn() }),
}));
jest.mock("../../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("../../api/consoleApi", () => ({
    fetchMyOrganizations: jest.fn(),
    fetchPostureOverview: jest.fn(),
    fetchApplications: jest.fn(),
    createApplication: jest.fn(),
    fetchApplication: jest.fn(),
    renameApplication: jest.fn(),
    changeApplicationStatus: jest.fn(),
    fetchApplicationActivity: jest.fn(),
    fetchCredentials: jest.fn(),
    issueCredential: jest.fn(),
    revokeCredential: jest.fn(),
}));

// Obviously fake, test-only value -- never shaped like a real key.
const ONE_TIME_SECRET = "test-only-one-time-secret-not-a-real-key";

const PROD_API = { id: "a1", name: "App One API", slug: "app-one-api", environment: "production", status: "ACTIVE", created_at: "2026-09-20T10:00:00Z", updated_at: "2026-09-20T10:00:00Z" };
const PROD_WORKER = { id: "a2", name: "App One Worker", slug: "app-one-worker", environment: "production", status: "SUSPENDED", created_at: "2026-09-20T10:00:00Z", updated_at: "2026-09-21T10:00:00Z" };
const LOCAL_API = { id: "a3", name: "App One API", slug: "app-one-api", environment: "local", status: "ACTIVE", created_at: "2026-09-20T10:00:00Z", updated_at: "2026-09-20T10:00:00Z" };

const RECENTLY = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const KEYS = [
    { credential_id: "k1", label: "prod server", status: "ACTIVE", created_at: "2026-09-20T10:00:00Z", created_by_email: "owner@app-one.test", last_used_at: RECENTLY, revoked_at: null, revoked_by_email: null },
    { credential_id: "k2", label: "", status: "REVOKED", created_at: "2026-09-01T10:00:00Z", created_by_email: "owner@app-one.test", last_used_at: null, revoked_at: "2026-09-10T10:00:00Z", revoked_by_email: "owner@app-one.test" },
];

function membership(role) {
    return { id: "1", name: "App One", slug: "app-one", org_role: role, membership_status: "ACTIVE" };
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

let client;
function renderAt(path) {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="applications" element={<ApplicationsPage />} />
                        <Route path="applications/:applicationId" element={<ApplicationDetailPage />} />
                    </Route>
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

function asRole(role) {
    fetchMyOrganizations.mockResolvedValue([membership(role)]);
}

beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    asRole("OWNER");
    fetchPostureOverview.mockResolvedValue({ organization_slug: "app-one", environments: [] });
    fetchApplications.mockResolvedValue([PROD_API, PROD_WORKER, LOCAL_API]);
    fetchApplication.mockImplementation((slug, id) => Promise.resolve([PROD_API, PROD_WORKER, LOCAL_API].find((a) => a.id === id)));
    fetchApplicationActivity.mockImplementation((slug, id) =>
        Promise.resolve(
            id === "a1"
                ? { has_activity: true, first_seen_at: "2026-09-20T11:00:00Z", last_seen_at: "2026-09-26T15:00:00Z", activity_source: "TENANT_SECURITY_SIGNAL" }
                : { has_activity: false, first_seen_at: null, last_seen_at: null, activity_source: null }
        )
    );
    fetchCredentials.mockResolvedValue(KEYS);
});

describe("F2 application list", () => {
    test("lists only the current environment's applications, with status and last report", async () => {
        renderAt("/console/app-one/applications?env=production");
        const table = await screen.findByRole("table", { name: "Applications in Production" });
        const rows = within(table).getAllByRole("row").slice(1);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent("App One API");
        expect(rows[1]).toHaveTextContent("Suspended");
        await waitFor(() => expect(rows[0]).toHaveTextContent(/Sep 26, 2026|26 Sep 2026/));
        expect(rows[1]).toHaveTextContent("No reports yet");
        expect(within(rows[0]).getByRole("link", { name: "App One API" })).toHaveAttribute(
            "href",
            "/console/app-one/applications/a1?env=production"
        );
        expect(screen.getByText(/1 more application is in other environments/)).toBeInTheDocument();
    });

    test("Owners and Admins can add an application; Members can't", async () => {
        renderAt("/console/app-one/applications?env=production");
        expect(await screen.findByRole("button", { name: "Add application" })).toBeInTheDocument();
    });

    test("a Member sees the list but no add button, and is told who can add", async () => {
        asRole("MEMBER");
        fetchApplications.mockResolvedValue([LOCAL_API]);
        renderAt("/console/app-one/applications?env=production");
        expect(await screen.findByText("No applications in Production yet")).toBeInTheDocument();
        expect(screen.getByText("Ask an Owner or Admin of this company to add one.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Add application" })).toBeNull();
    });

    test("adding: the slug follows the name, fields are validated, and success opens the new application", async () => {
        createApplication.mockResolvedValue({ id: "a9", name: "Billing", slug: "billing", environment: "staging", status: "ACTIVE" });
        renderAt("/console/app-one/applications?env=staging");
        fireEvent.click(await screen.findByRole("button", { name: "Add application" }));
        const dialog = screen.getByRole("dialog", { name: "Add an application" });

        fireEvent.click(within(dialog).getByRole("button", { name: "Add application" }));
        expect(within(dialog).getByText("Give the application a name.")).toBeInTheDocument();
        expect(createApplication).not.toHaveBeenCalled();

        fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Billing Service!" } });
        expect(within(dialog).getByLabelText("Slug")).toHaveValue("billing-service");
        fireEvent.change(within(dialog).getByLabelText("Slug"), { target: { value: "bad slug" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Add application" }));
        expect(within(dialog).getByText("Use only letters, numbers, hyphens and underscores.")).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText("Slug"), { target: { value: "billing" } });
        expect(within(dialog).getByLabelText("Environment")).toHaveValue("staging");
        fireEvent.click(within(dialog).getByRole("button", { name: "Add application" }));

        await waitFor(() => expect(createApplication).toHaveBeenCalledWith("app-one", { name: "Billing Service!", slug: "billing", environment: "staging" }));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/app-one/applications/a9?env=staging"));
    });

    test("a duplicate slug shows Gait's own message", async () => {
        createApplication.mockRejectedValue({ response: { status: 400, data: { detail: "An application with this slug already exists in this environment." } } });
        renderAt("/console/app-one/applications?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Add application" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "App One API" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Add application" }));
        expect(await within(dialog).findByText("An application with this slug already exists in this environment.")).toBeInTheDocument();
    });

    test("the dialog closes on Escape and returns focus to the button that opened it", async () => {
        renderAt("/console/app-one/applications?env=production");
        const opener = await screen.findByRole("button", { name: "Add application" });
        opener.focus();
        fireEvent.click(opener);
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByLabelText("Name")).toHaveFocus();
        fireEvent.keyDown(dialog, { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(opener).toHaveFocus();
    });
});

describe("F2 application detail: role gating", () => {
    test("Owner: rename, suspend and retire, plus the key list", async () => {
        renderAt("/console/app-one/applications/a1?env=production");
        expect(await screen.findByRole("heading", { level: 1, name: "App One API" })).toBeInTheDocument();
        for (const name of ["Rename", "Suspend", "Retire"]) {
            expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
        expect(screen.queryByRole("button", { name: "Reactivate" })).toBeNull();
        const keys = await screen.findByRole("table", { name: "Connection keys" });
        expect(within(keys).getAllByRole("row")).toHaveLength(3);
        expect(within(keys).getByText("prod server")).toBeInTheDocument();
        expect(within(keys).getByText("Unlabelled")).toBeInTheDocument();
    });

    test("Admin: everything except retire", async () => {
        asRole("ADMIN");
        renderAt("/console/app-one/applications/a1?env=production");
        expect(await screen.findByRole("button", { name: "Suspend" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Retire" })).toBeNull();
        expect(await screen.findByRole("table", { name: "Connection keys" })).toBeInTheDocument();
    });

    test("Member: no actions, and keys are never requested", async () => {
        asRole("MEMBER");
        renderAt("/console/app-one/applications/a1?env=production");
        expect(await screen.findByRole("heading", { level: 1, name: "App One API" })).toBeInTheDocument();
        for (const name of ["Rename", "Suspend", "Retire", "Issue key"]) {
            expect(screen.queryByRole("button", { name })).toBeNull();
        }
        expect(screen.getByText("Only Owners and Admins can see and manage connection keys.")).toBeInTheDocument();
        expect(fetchCredentials).not.toHaveBeenCalled();
    });

    test("a suspended application offers reactivate, and can't issue keys", async () => {
        renderAt("/console/app-one/applications/a2?env=production");
        expect(await screen.findByRole("button", { name: "Reactivate" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Suspend" })).toBeNull();
        expect(screen.getByRole("button", { name: "Issue key" })).toBeDisabled();
        expect(screen.getByText(/none of this application's keys work/)).toBeInTheDocument();
    });

    test("an application from another company (or a guessed id) is 'doesn't exist or no access', no retry", async () => {
        fetchApplication.mockRejectedValue({ response: { status: 404, data: { detail: "Not found." } } });
        renderAt("/console/app-one/applications/zzz?env=production");
        expect(await screen.findByText("This doesn't exist, or you don't have access to it.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });
});

describe("F2 lifecycle actions", () => {
    test("suspend asks first, then calls Gait", async () => {
        changeApplicationStatus.mockResolvedValue({ ...PROD_API, status: "SUSPENDED" });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Suspend" }));
        const dialog = screen.getByRole("dialog", { name: "Suspend this application?" });
        expect(dialog).toHaveTextContent("All of its connection keys stop working immediately");
        fireEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));
        await waitFor(() => expect(changeApplicationStatus).toHaveBeenCalledWith("app-one", "a1", "suspend"));
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    test("a refused transition shows Gait's detail", async () => {
        changeApplicationStatus.mockRejectedValue({
            response: { status: 400, data: { code: "INVALID_TRANSITION", detail: "Cannot suspend an application that is suspended." } },
        });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Suspend" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspend" }));
        expect(await screen.findByText("Cannot suspend an application that is suspended.")).toBeInTheDocument();
    });

    test("a 403 says the role can't do it", async () => {
        changeApplicationStatus.mockRejectedValue({ response: { status: 403, data: { detail: "You do not have permission." } } });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Suspend" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspend" }));
        expect(await screen.findByText("Your role in this organization can't do that.")).toBeInTheDocument();
    });

    test("retire needs the slug typed, and says it's permanent", async () => {
        changeApplicationStatus.mockResolvedValue({ ...PROD_API, status: "REVOKED" });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Retire" }));
        const dialog = screen.getByRole("dialog", { name: "Retire this application?" });
        expect(dialog).toHaveTextContent("This can't be undone.");
        const confirm = within(dialog).getByRole("button", { name: "Retire permanently" });
        expect(confirm).toBeDisabled();
        fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "app-one" } });
        expect(confirm).toBeDisabled();
        fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "app-one-api" } });
        fireEvent.click(confirm);
        await waitFor(() => expect(changeApplicationStatus).toHaveBeenCalledWith("app-one", "a1", "retire"));
    });

    test("rename validates and saves", async () => {
        renameApplication.mockResolvedValue({ ...PROD_API, name: "Public API" });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Rename" }));
        const dialog = screen.getByRole("dialog", { name: "Rename application" });
        fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "  " } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Rename" }));
        expect(within(dialog).getByText("Give the application a name.")).toBeInTheDocument();
        fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Public API" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Rename" }));
        await waitFor(() => expect(renameApplication).toHaveBeenCalledWith("app-one", "a1", "Public API"));
    });
});

describe("F2 connection keys", () => {
    const originalClipboard = navigator.clipboard;
    afterEach(() => {
        Object.defineProperty(navigator, "clipboard", { value: originalClipboard, configurable: true });
    });

    test("a new key is shown once, with copy and a can't-be-shown-again warning, then gone for good", async () => {
        const writeText = jest.fn(() => Promise.resolve());
        Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
        issueCredential.mockResolvedValue({ credential_id: "k3", raw_secret: ONE_TIME_SECRET, created_at: "2026-09-26T16:00:00Z", label: "laptop" });

        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Issue key" }));
        const form = screen.getByRole("dialog", { name: "Issue a connection key" });
        fireEvent.change(within(form).getByLabelText("Label (optional)"), { target: { value: "laptop" } });
        fireEvent.click(within(form).getByRole("button", { name: "Issue key" }));

        const dialog = await screen.findByRole("dialog", { name: "Save this connection key now" });
        expect(issueCredential).toHaveBeenCalledWith("app-one", "a1", "laptop");
        expect(within(dialog).getByLabelText("Connection key")).toHaveValue(ONE_TIME_SECRET);
        expect(dialog).toHaveTextContent("This key can't be shown again.");

        fireEvent.click(within(dialog).getByRole("button", { name: "Copy key" }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(ONE_TIME_SECRET));
        expect(await within(dialog).findByText("Copied to clipboard.")).toBeInTheDocument();

        // A stray click outside doesn't lose it; Done needs an explicit "saved".
        fireEvent.mouseDown(document.querySelector(".gc-dialog-backdrop"));
        expect(screen.getByRole("dialog", { name: "Save this connection key now" })).toBeInTheDocument();
        const done = within(dialog).getByRole("button", { name: "Done" });
        expect(done).toBeDisabled();
        fireEvent.click(within(dialog).getByLabelText("I've saved this key somewhere safe"));
        fireEvent.click(done);

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.body.innerHTML).not.toContain(ONE_TIME_SECRET);
        const cached = JSON.stringify([
            client.getQueryCache().findAll().map((query) => query.state.data),
            client.getMutationCache().getAll().map((mutation) => mutation.state.data),
        ]);
        expect(cached).not.toContain(ONE_TIME_SECRET);
        expect(JSON.stringify({ ...window.localStorage })).not.toContain(ONE_TIME_SECRET);
        expect(JSON.stringify({ ...window.sessionStorage })).not.toContain(ONE_TIME_SECRET);
        await waitFor(() => expect(fetchCredentials).toHaveBeenCalledTimes(2));
    });

    test("when copying fails, the key is selected for manual copy", async () => {
        Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
        issueCredential.mockResolvedValue({ credential_id: "k3", raw_secret: ONE_TIME_SECRET, created_at: "2026-09-26T16:00:00Z", label: "" });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Issue key" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Issue key" }));
        const dialog = await screen.findByRole("dialog", { name: "Save this connection key now" });
        fireEvent.click(within(dialog).getByRole("button", { name: "Copy key" }));
        expect(await within(dialog).findByText(/Couldn't copy/)).toBeInTheDocument();
    });

    test("Gait refusing to issue (application not active) shows its reason", async () => {
        issueCredential.mockRejectedValue({
            response: { status: 400, data: { code: "APPLICATION_NOT_ACTIVE", detail: "Credentials can only be issued for an active application." } },
        });
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Issue key" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Issue key" }));
        expect(await screen.findByText("Credentials can only be issued for an active application.")).toBeInTheDocument();
    });

    test("revoking shows when the key was last used, and warns if that was recent", async () => {
        revokeCredential.mockResolvedValue(undefined);
        renderAt("/console/app-one/applications/a1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Revoke prod server" }));
        const dialog = screen.getByRole("dialog", { name: "Revoke this key?" });
        expect(dialog).toHaveTextContent("Last used:");
        expect(dialog).toHaveTextContent("This key was used in the last 24 hours");
        fireEvent.click(within(dialog).getByRole("button", { name: "Revoke key" }));
        await waitFor(() => expect(revokeCredential).toHaveBeenCalledWith("app-one", "a1", "k1"));
        expect(screen.queryByRole("button", { name: /Revoke unlabelled/ })).toBeNull();
    });
});
