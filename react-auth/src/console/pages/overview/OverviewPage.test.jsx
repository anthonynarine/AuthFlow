import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleLayout } from "../../layout/ConsoleLayout";
import { OverviewPage } from "./OverviewPage";
import { belongsToOtherOrganization, consoleKeys } from "../../api/queryKeys";
import {
    fetchControls,
    fetchLatestEvidence,
    fetchMyOrganizations,
    fetchPosture,
    fetchPostureOverview,
} from "../../api/consoleApi";

let mockUser = { email: "owner@app-one.test" };

jest.mock("../../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser, isLoggedIn: Boolean(mockUser), logout: jest.fn() }),
}));
jest.mock("../../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("../../api/consoleApi", () => ({
    fetchMyOrganizations: jest.fn(),
    fetchPostureOverview: jest.fn(),
    fetchPosture: jest.fn(),
    fetchControls: jest.fn(),
    fetchLatestEvidence: jest.fn(),
}));

const APP_ONE = { id: "1", name: "App One", slug: "app-one", org_role: "OWNER", membership_status: "ACTIVE" };
const APP_TWO = { id: "2", name: "App Two", slug: "app-two", org_role: "MEMBER", membership_status: "ACTIVE" };
const CONTROL_KEY = "TENANT.APPLICATION.SELF_REPORTED_SECURITY_CHECK";

function posture(environment, overrides = {}) {
    return {
        environment,
        overall_status: "HEALTHY",
        overall_status_label: "Healthy",
        controls: { healthy: 1, needs_attention: 0, control_failure: 0, unknown: 0, not_applicable: 0 },
        open_findings: { info: 0, warning: 0, high: 0, critical: 0 },
        last_evaluated_at: "2026-09-26T15:00:00Z",
        has_data: true,
        ...overrides,
    };
}

const FAILING = {
    overall_status: "CONTROL_FAILURE",
    overall_status_label: "Control failure",
    controls: { healthy: 0, needs_attention: 0, control_failure: 1, unknown: 0, not_applicable: 0 },
    open_findings: { info: 0, warning: 1, high: 0, critical: 0 },
};

const OVERVIEW = {
    organization_slug: "app-one",
    environments: [
        posture("production", FAILING),
        posture("staging"),
        posture("test", { has_data: false, overall_status: "UNKNOWN", overall_status_label: "Unknown" }),
        posture("ci", { has_data: false, overall_status: "UNKNOWN", overall_status_label: "Unknown" }),
        posture("local"),
    ],
};

function control(status, statusLabel) {
    return {
        control_key: CONTROL_KEY,
        title: "Application self-reported security attestation received",
        state: { status, status_label: statusLabel, last_evaluated_at: "2026-09-26T15:00:00Z" },
        help: {
            status_explanation: "The Application's most recent self-reported attestation for this environment claims FAIL.",
            verification_summary: "INTERNAL test file references",
            why_it_matters: "INTERNAL implementation detail",
        },
    };
}

// Environment cards live in the "All environments" section (the top bar has
// its own environment buttons with the same names).
async function envCard(name) {
    const section = await screen.findByRole("region", { name: "All environments" });
    return within(section).getByRole("button", { name: new RegExp(`^${name}`) });
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

let navigateTo;
function Navigator() {
    navigateTo = useNavigate();
    return null;
}

function renderOverview(path = "/console/app-one/overview", client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="overview" element={<OverviewPage />} />
                        <Route path="applications" element={<div>applications page</div>} />
                        <Route path="security" element={<div>security page</div>} />
                    </Route>
                    <Route path="/console" element={<div>console entry</div>} />
                </Routes>
                <LocationProbe />
                <Navigator />
            </MemoryRouter>
        </QueryClientProvider>
    );
    return client;
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { email: "owner@app-one.test" };
    window.localStorage.clear();
    fetchMyOrganizations.mockResolvedValue([APP_ONE, APP_TWO]);
    fetchPostureOverview.mockResolvedValue(OVERVIEW);
    fetchPosture.mockImplementation((slug, environment) =>
        Promise.resolve(OVERVIEW.environments.find((row) => row.environment === environment))
    );
    fetchControls.mockImplementation((slug, environment) =>
        Promise.resolve([
            environment === "production" ? control("CONTROL_FAILURE", "Control failure") : control("HEALTHY", "Healthy"),
        ])
    );
    fetchLatestEvidence.mockImplementation((slug, environment) =>
        Promise.resolve(
            environment === "local"
                ? null
                : { id: `${environment}-e1`, trust: environment === "staging" ? "GAIT_VERIFIED" : "SELF_REPORTED", observed_at: "2026-09-26T15:00:00Z" }
        )
    );
});

describe("F1 Overview", () => {
    test("shows each environment in use, with status, findings and the source of its result", async () => {
        renderOverview("/console/app-one/overview?env=production");

        const production = await envCard("Production");
        expect(production).toHaveAttribute("aria-pressed", "true");
        expect(within(production).getByText("Control failure")).toBeInTheDocument();
        expect(within(production).getByText("1 open finding")).toBeInTheDocument();
        await waitFor(() => expect(within(production).getByText("Self-reported")).toBeInTheDocument());

        const staging = await envCard("Staging");
        await waitFor(() => expect(within(staging).getByText("Gait-verified")).toBeInTheDocument());
        const local = await envCard("Local");
        await waitFor(() => expect(within(local).getByText("No evidence yet")).toBeInTheDocument());

        expect(screen.getByText("No data yet: Test, CI.")).toBeInTheDocument();
        const section = screen.getByRole("region", { name: "All environments" });
        expect(within(section).queryByRole("button", { name: /^Test/ })).toBeNull();
    });

    test("the selected environment in detail: health, open findings by severity, and each control's source", async () => {
        renderOverview("/console/app-one/overview?env=production");

        expect(await screen.findByRole("heading", { name: "Production in detail" })).toBeInTheDocument();
        const severities = await screen.findByRole("list", { name: "Open findings by severity" });
        const warningRow = within(severities).getAllByRole("listitem").find((item) => within(item).queryByText("Warning"));
        expect(warningRow).toHaveTextContent("1");
        expect(screen.getByRole("link", { name: "See findings" })).toHaveAttribute(
            "href",
            "/console/app-one/security?env=production"
        );

        expect(await screen.findByText(/most recent self-reported attestation/)).toBeInTheDocument();
        expect(screen.queryByText(/INTERNAL/)).toBeNull();

        expect(fetchPosture).toHaveBeenCalledWith("app-one", "production");
        expect(fetchControls).toHaveBeenCalledWith("app-one", "production");
        expect(fetchLatestEvidence).toHaveBeenCalledWith("app-one", "production", CONTROL_KEY);
    });

    test("choosing an environment card switches the console's environment", async () => {
        renderOverview("/console/app-one/overview?env=production");
        fireEvent.click(await envCard("Staging"));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("env=staging"));
        expect(await screen.findByRole("heading", { name: "Staging in detail" })).toBeInTheDocument();
        await waitFor(() => expect(fetchPosture).toHaveBeenCalledWith("app-one", "staging"));
        expect(screen.queryByRole("link", { name: "See findings" })).toBeNull();
    });

    test("an environment with no data says so instead of showing an empty posture", async () => {
        renderOverview("/console/app-one/overview?env=ci");
        expect(await screen.findByText("Nothing has been reported from CI yet")).toBeInTheDocument();
        expect(fetchPosture).not.toHaveBeenCalledWith("app-one", "ci");
    });

    test("a company with nothing reported gets a next step, not an empty dashboard", async () => {
        fetchPostureOverview.mockResolvedValue({
            organization_slug: "app-one",
            environments: OVERVIEW.environments.map((row) => ({ ...row, has_data: false })),
        });
        renderOverview();
        expect(await screen.findByText("Nothing has been reported yet")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Go to Applications" })).toHaveAttribute("href", "/console/app-one/applications");
        expect(screen.getByRole("link", { name: "How to connect your software" })).toHaveAttribute(
            "href",
            "/docs/connecting-your-software"
        );
    });

    test("a 404 says 'doesn't exist or no access' with no details and no retry", async () => {
        fetchPosture.mockRejectedValue({ response: { status: 404, data: { detail: "Organization app-one secret detail" } } });
        renderOverview("/console/app-one/overview?env=production");
        expect(await screen.findByText("This doesn't exist, or you don't have access to it.")).toBeInTheDocument();
        expect(screen.queryByText(/secret detail/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });

    test("other errors can be retried", async () => {
        fetchPosture.mockRejectedValueOnce({ response: { status: 500, data: {} } });
        renderOverview("/console/app-one/overview?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("list", { name: "Open findings by severity" })).toBeInTheDocument();
    });

    test("loading state while the posture loads", async () => {
        fetchPostureOverview.mockReturnValue(new Promise(() => {}));
        renderOverview();
        expect(await screen.findByText("Loading your security posture…")).toBeInTheDocument();
    });
});

describe("company isolation in the cache", () => {
    test("every F1 query key starts with the company and the environment", () => {
        expect(consoleKeys.posture("app-one", "production")).toEqual(["console", "app-one", "production", "posture"]);
        expect(consoleKeys.controls("app-one", "staging")).toEqual(["console", "app-one", "staging", "controls"]);
        expect(consoleKeys.latestEvidence("app-one", "local", CONTROL_KEY).slice(0, 3)).toEqual([
            "console",
            "app-one",
            "local",
        ]);
    });

    test("switching company drops everything cached for the previous one", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        renderOverview("/console/app-one/overview?env=production", client);
        await screen.findByRole("heading", { name: "Production in detail" });
        expect(client.getQueryData(consoleKeys.posture("app-one", "production"))).toBeDefined();

        act(() => navigateTo("/console/app-two/overview?env=production"));

        await waitFor(() =>
            expect(
                client.getQueryCache().findAll().filter((query) => query.queryKey[1] === "app-one")
            ).toHaveLength(0)
        );
        expect(client.getQueryData(consoleKeys.myOrganizations())).toBeDefined();
        await waitFor(() => expect(fetchPostureOverview).toHaveBeenCalledWith("app-two"));
    });

    test("belongsToOtherOrganization never matches the caller's own organization list", () => {
        expect(belongsToOtherOrganization(consoleKeys.myOrganizations(), "app-two")).toBe(false);
        expect(belongsToOtherOrganization(consoleKeys.posture("app-one", "production"), "app-two")).toBe(true);
        expect(belongsToOtherOrganization(consoleKeys.posture("app-two", "production"), "app-two")).toBe(false);
    });
});
