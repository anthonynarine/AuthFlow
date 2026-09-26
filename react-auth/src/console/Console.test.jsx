import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleLayout } from "./layout/ConsoleLayout";
import { ConsoleEntry } from "./pages/ConsoleEntry";
import { SectionPlaceholder } from "./pages/SectionPlaceholder";
import { consoleKeys } from "./api/queryKeys";
import { fetchMyOrganizations, fetchPostureOverview } from "./api/consoleApi";

let mockUser = null;
const mockValidateSession = jest.fn(() => Promise.resolve());
const mockLogout = jest.fn(() => Promise.resolve());

jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser, isLoggedIn: Boolean(mockUser), logout: mockLogout }),
}));
jest.mock("../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: mockValidateSession }),
}));
jest.mock("./api/consoleApi", () => ({
    fetchMyOrganizations: jest.fn(),
    fetchPostureOverview: jest.fn(),
}));

const ACME = { id: "1", name: "Acme Health", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" };
const BETA = { id: "2", name: "Beta Clinic", slug: "beta", org_role: "MEMBER", membership_status: "ACTIVE" };

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderConsole(path) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login">login</div>} />
                    <Route path="/workspace/onboarding" element={<div data-testid="onboarding">onboarding</div>} />
                    <Route path="/console" element={<ConsoleEntry />} />
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="overview" element={<SectionPlaceholder title="Overview" />} />
                        <Route path="members" element={<SectionPlaceholder title="Members" />} />
                    </Route>
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    window.localStorage.clear();
    fetchPostureOverview.mockResolvedValue({
        environments: [
            { environment: "production", has_data: false },
            { environment: "staging", has_data: true },
        ],
    });
});

describe("ConsoleLayout gating", () => {
    test("signed-out visitors are sent to sign-in and no tenant data is requested", async () => {
        renderConsole("/console/acme/overview");
        await waitFor(() => expect(screen.getByTestId("login")).toBeInTheDocument());
        expect(fetchPostureOverview).not.toHaveBeenCalled();
    });

    test("a slug the caller is not a member of never renders a tenant page", async () => {
        mockUser = { email: "me@acme.test" };
        fetchMyOrganizations.mockResolvedValue([ACME]);

        renderConsole("/console/someone-else/overview");

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/acme/overview"));
        expect(fetchPostureOverview).not.toHaveBeenCalledWith("someone-else");
    });

    test("members get the shell: org switcher, role, navigation carrying the environment", async () => {
        mockUser = { email: "me@acme.test" };
        fetchMyOrganizations.mockResolvedValue([ACME, BETA]);

        renderConsole("/console/acme/overview");

        expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
        expect(screen.getByDisplayValue("Acme Health")).toBeInTheDocument();
        expect(screen.getByText("Owner")).toBeInTheDocument();
        // defaults to the first environment that has data
        await waitFor(() =>
            expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("href", "/console/acme/members?env=staging")
        );
    });

    test("choosing an environment updates ?env=", async () => {
        mockUser = { email: "me@acme.test" };
        fetchMyOrganizations.mockResolvedValue([ACME]);
        renderConsole("/console/acme/overview?env=staging");

        fireEvent.click(await screen.findByRole("button", { name: "Production" }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("env=production"));
    });

    test("sign out revokes the session and returns to sign-in", async () => {
        mockUser = { email: "me@acme.test" };
        fetchMyOrganizations.mockResolvedValue([ACME]);
        renderConsole("/console/acme/overview");

        fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

        await waitFor(() => expect(screen.getByTestId("login")).toBeInTheDocument());
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});

describe("ConsoleEntry", () => {
    test("no organization yet goes to onboarding", async () => {
        mockUser = { email: "me@acme.test" };
        fetchMyOrganizations.mockResolvedValue([]);
        renderConsole("/console");
        await waitFor(() => expect(screen.getByTestId("onboarding")).toBeInTheDocument());
    });

    test("returns to the last organization only while still a member", async () => {
        mockUser = { email: "me@acme.test" };
        window.localStorage.setItem("gait.console.lastOrg", "beta");
        fetchMyOrganizations.mockResolvedValue([ACME, BETA]);
        renderConsole("/console");
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/beta/overview"));
    });

    test("a remembered organization the caller left is ignored", async () => {
        mockUser = { email: "me@acme.test" };
        window.localStorage.setItem("gait.console.lastOrg", "former-employer");
        fetchMyOrganizations.mockResolvedValue([ACME]);
        renderConsole("/console");
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/acme/overview"));
    });
});

describe("query keys", () => {
    test("tenant data is keyed by organization and environment", () => {
        expect(consoleKeys.scope("acme", "production")).toEqual(["console", "acme", "production"]);
        expect(consoleKeys.scope("acme", "production")).not.toEqual(consoleKeys.scope("beta", "production"));
        expect(consoleKeys.scope("acme", "production")).not.toEqual(consoleKeys.scope("acme", "staging"));
        expect(consoleKeys.postureOverview("acme")[1]).toBe("acme");
    });
});
