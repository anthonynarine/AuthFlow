import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PendingInvites } from "./PendingInvites";
import { ConsoleLayout } from "../layout/ConsoleLayout";
import { consoleKeys } from "../api/queryKeys";
import { acceptInviteById, fetchMyInvites, fetchMyOrganizations, fetchPostureOverview } from "../api/consoleApi";

jest.mock("../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: { email: "sam@example.test", email_verified: true }, isLoggedIn: true, logout: () => Promise.resolve() }),
}));
jest.mock("../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("../api/consoleApi", () => ({
    fetchMyInvites: jest.fn(),
    acceptInviteById: jest.fn(),
    fetchMyOrganizations: jest.fn(),
    fetchPostureOverview: jest.fn(),
}));

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000 - 60000).toISOString();

function invite(overrides = {}) {
    return {
        id: "3f0c6a52-0000-4000-8000-000000000001",
        organization_name: "Lumen",
        organization_slug: "lumen",
        org_role: "MEMBER",
        invited_by_email: "owner@lumen.test",
        expires_at: inDays(6),
        ...overrides,
    };
}

const ACME = { id: "1", name: "Acme", slug: "acme", org_role: "OWNER", membership_status: "ACTIVE" };
const LUMEN = { id: "2", name: "Lumen", slug: "lumen", org_role: "MEMBER", membership_status: "ACTIVE" };

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function renderList(invites) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/somewhere"]}>
                <Routes>
                    <Route path="/somewhere" element={<PendingInvites invites={invites} />} />
                    <Route path="/console/:orgSlug/overview" element={<p>Workspace overview</p>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

function renderConsole() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/console/acme/overview"]}>
                <Routes>
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="overview" element={<p>Overview body</p>} />
                    </Route>
                    <Route path="/console" element={<p>Console entry</p>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    fetchMyInvites.mockResolvedValue([]);
    fetchMyOrganizations.mockResolvedValue([ACME]);
    fetchPostureOverview.mockResolvedValue({ organization_slug: "acme", environments: [] });
});

describe("pending invites list", () => {
    test("each invite reads as a sentence; Join opens the confirm step, Cancel closes it; only one is open", () => {
        renderList([invite(), invite({ id: "3f0c6a52-0000-4000-8000-000000000002", organization_name: "Acme", organization_slug: "acme", org_role: "ADMIN", invited_by_email: null })]);
        const list = screen.getByRole("list", { name: "Pending invites" });
        expect(list).toHaveTextContent("Lumen invited you to its workspace as Member");
        expect(list).toHaveTextContent("Acme invited you to its workspace as Admin");

        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        const confirm = screen.getByRole("group", { name: "Join Lumen?" });
        expect(confirm).toHaveTextContent("Sees the workspace's applications, findings and members");
        expect(within(confirm).getByText("Join Lumen?")).toHaveFocus();

        fireEvent.click(screen.getByRole("button", { name: "Join Acme" }));
        expect(screen.queryByRole("group", { name: "Join Lumen?" })).not.toBeInTheDocument();
        const acme = screen.getByRole("group", { name: "Join Acme?" });
        expect(acme).toHaveTextContent("a deleted account");

        fireEvent.click(within(acme).getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("group")).not.toBeInTheDocument();
        expect(acceptInviteById).not.toHaveBeenCalled();
    });

    test.each([
        ["an invite that can't be used any more", { status: 404, data: { code: "INVITE_INVALID" } }, "This invite can't be used anymore. Ask whoever invited you for a new one."],
        ["an unconfirmed email", { status: 403, data: { code: "EMAIL_NOT_VERIFIED" } }, "Confirm your email first, then try again."],
    ])("Gait refusing because of %s says so", async (_, response, message) => {
        acceptInviteById.mockRejectedValue({ response });
        renderList([invite()]);
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as a Member" }));
        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByTestId("location")).toHaveTextContent("/somewhere");
    });

    test("already a member: offers the workspace", async () => {
        acceptInviteById.mockRejectedValue({ response: { status: 409, data: { code: "ALREADY_MEMBER" } } });
        renderList([invite()]);
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as a Member" }));
        expect(await screen.findByRole("link", { name: "Go to Lumen" })).toHaveAttribute("href", "/console/lumen/overview");
    });

    test("rate limited: the Join button waits out Retry-After", async () => {
        acceptInviteById.mockRejectedValue({ response: { status: 429, headers: { "retry-after": "30" }, data: { code: "RATE_LIMITED" } } });
        renderList([invite()]);
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as a Member" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
        expect(screen.getByRole("button", { name: /Try again in \d+s/ })).toBeDisabled();
    });

    test("a workspace list cached before joining can't bounce them out of the new workspace", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
        client.setQueryData(consoleKeys.myOrganizations(), [ACME]); // e.g. from an earlier visit to /console
        acceptInviteById.mockImplementation(async () => {
            fetchMyOrganizations.mockResolvedValue([ACME, LUMEN]);
            return { organization_slug: "lumen", organization_name: "Lumen", org_role: "MEMBER" };
        });
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter initialEntries={["/somewhere"]}>
                    <Routes>
                        <Route path="/somewhere" element={<PendingInvites invites={[invite()]} />} />
                        <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                            <Route path="overview" element={<p>Overview body</p>} />
                        </Route>
                        <Route path="/console" element={<p>Console entry</p>} />
                    </Routes>
                    <LocationProbe />
                </MemoryRouter>
            </QueryClientProvider>
        );
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as a Member" }));
        expect(await screen.findByText("Overview body")).toBeInTheDocument();
        expect(screen.getByTestId("location")).toHaveTextContent("/console/lumen/overview");
    });

    test("joining sends only the invite's id and lands in the workspace", async () => {
        acceptInviteById.mockResolvedValue({ organization_slug: "lumen", organization_name: "Lumen", org_role: "MEMBER" });
        renderList([invite()]);
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as a Member" }));
        expect(await screen.findByText("Workspace overview")).toBeInTheDocument();
        expect(acceptInviteById).toHaveBeenCalledWith("3f0c6a52-0000-4000-8000-000000000001");
    });
});

describe("console: invitations for people who already have a workspace", () => {
    test("nothing pending: no Invitations button", async () => {
        renderConsole();
        expect(await screen.findByText("Overview body")).toBeInTheDocument();
        await waitFor(() => expect(fetchMyInvites).toHaveBeenCalled());
        expect(screen.queryByRole("button", { name: /Invitations/ })).not.toBeInTheDocument();
    });

    test("an unconfirmed email (403) is not an error: no button", async () => {
        fetchMyInvites.mockRejectedValue({ response: { status: 403, data: { code: "EMAIL_NOT_VERIFIED" } } });
        renderConsole();
        expect(await screen.findByText("Overview body")).toBeInTheDocument();
        await waitFor(() => expect(fetchMyInvites).toHaveBeenCalled());
        expect(screen.queryByRole("button", { name: /Invitations/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("pending: the top bar shows how many; joining moves to the new workspace and closes the dialog", async () => {
        fetchMyInvites.mockResolvedValue([invite()]);
        acceptInviteById.mockImplementation(async () => {
            fetchMyOrganizations.mockResolvedValue([ACME, LUMEN]);
            fetchMyInvites.mockResolvedValue([]);
            return { organization_slug: "lumen", organization_name: "Lumen", org_role: "MEMBER" };
        });
        renderConsole();
        fireEvent.click(await screen.findByRole("button", { name: "Invitations: 1 pending" }));
        const dialog = screen.getByRole("dialog", { name: "Your invitations" });
        fireEvent.click(within(dialog).getByRole("button", { name: "Join Lumen" }));
        fireEvent.click(within(dialog).getByRole("button", { name: "Join Lumen as a Member" }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/lumen/overview"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(await screen.findByText("Welcome to Lumen.")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("button", { name: /Invitations/ })).not.toBeInTheDocument());
    });
});
