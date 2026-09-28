import "@testing-library/jest-dom";
import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AcceptInvitePage } from "./AcceptInvitePage";
import { RegisterPage } from "../../components/register/RegisterPage";
import { acceptInvite, fetchMyOrganizations, previewInvite } from "../api/consoleApi";
import { resendVerificationEmail } from "../../account/emailVerificationApi";
import { clearPendingInvite, getPendingInvite, handleSignedOut } from "./pendingInvite";

let mockUser = null;
const mockLogout = jest.fn();
const mockValidateSession = jest.fn();

jest.mock("../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser, logout: mockLogout }),
}));
jest.mock("../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: mockValidateSession }),
}));
jest.mock("../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../interceptors/axios", () => ({ publicAxios: { post: jest.fn() } }));
jest.mock("../api/consoleApi", () => ({
    previewInvite: jest.fn(),
    acceptInvite: jest.fn(),
    fetchMyOrganizations: jest.fn(),
}));

// Obviously fake, test-only tokens.
const TOKEN = "test-only-invite-token";
const OTHER_TOKEN = "test-only-invite-token-2";
const CANT_BE_USED = "This invite can't be used. Ask whoever invited you for a new one.";
const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

function preview(overrides = {}) {
    return {
        organization_name: "App One",
        organization_slug: "app-one",
        org_role: "ADMIN",
        invited_email: "b@example.test",
        invited_by_name: "Ana Owner",
        expires_at: inDays(6),
        ...overrides,
    };
}

function LocationProbe() {
    const location = useLocation();
    return (
        <>
            <div data-testid="location">{location.pathname}</div>
            <div data-testid="state">{JSON.stringify(location.state)}</div>
        </>
    );
}

function visit(hash, { strict = false } = {}) {
    window.history.replaceState(null, "", `/console/invites/accept${hash}`);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/console/invites/accept"]}>
                <Routes>
                    <Route path="/console/invites/accept" element={<AcceptInvitePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*" element={<p>Elsewhere</p>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
    return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

async function settle() {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function expectTokenNowhere(token = TOKEN) {
    expect(window.location.href).not.toContain(token);
    expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage })).not.toContain(token);
    expect(document.cookie).not.toContain(token);
    expect(document.body.innerHTML).not.toContain(token);
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockLogout.mockImplementation(() => Promise.resolve());
    mockValidateSession.mockImplementation(() => Promise.resolve());
    fetchMyOrganizations.mockResolvedValue([]);
    previewInvite.mockResolvedValue(preview());
    clearPendingInvite();
    window.localStorage.clear();
    window.sessionStorage.clear();
});

afterEach(() => {
    jest.useRealTimers();
    clearPendingInvite();
    window.history.replaceState(null, "", "/");
});

describe("token handling", () => {
    test("reads the fragment, strips it at once, previews exactly once under StrictMode, and never stores it", async () => {
        visit(`#token=${TOKEN}`, { strict: true });
        expect(window.location.hash).toBe("");
        expect(window.location.pathname).toBe("/console/invites/accept");
        expect(await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" })).toBeInTheDocument();
        expect(previewInvite).toHaveBeenCalledTimes(1);
        expect(previewInvite).toHaveBeenCalledWith(TOKEN);
        expectTokenNowhere();
    });

    test("a query-string token is ignored", async () => {
        window.history.replaceState(null, "", `/console/invites/accept?token=${TOKEN}`);
        visit(`?token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Open your invite link again" })).toBeInTheDocument();
        expect(previewInvite).not.toHaveBeenCalled();
    });

    test("opening a second invite link in the same tab (hashchange) previews the new one", async () => {
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        previewInvite.mockResolvedValue(preview({ organization_name: "App Two", organization_slug: "app-two", org_role: "MEMBER" }));
        act(() => {
            window.history.replaceState(null, "", `/console/invites/accept#token=${OTHER_TOKEN}`);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(await screen.findByRole("heading", { name: "App Two invited you to its workspace as Member" })).toBeInTheDocument();
        expect(previewInvite).toHaveBeenLastCalledWith(OTHER_TOKEN);
        expect(window.location.hash).toBe("");
        expectTokenNowhere(OTHER_TOKEN);
    });

    test("no token at all asks them to open the link again", async () => {
        visit("");
        expect(await screen.findByRole("heading", { name: "Open your invite link again" })).toBeInTheDocument();
    });
});

describe("invalid invites all look the same and reveal nothing", () => {
    test.each([
        ["unknown or used", { response: { status: 404, data: { code: "INVITE_INVALID", detail: "x" } } }],
        ["a network failure", new Error("offline")],
    ])("%s", async (_, failure) => {
        previewInvite.mockRejectedValue(failure);
        visit(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "This invite can't be used" })).toBeInTheDocument();
        expect(screen.getByText(CANT_BE_USED)).toBeInTheDocument();
        expect(document.body).not.toHaveTextContent("App One");
        expect(getPendingInvite()).toBeNull();
    });

    test("an already-expired preview is treated as invalid and forgotten", async () => {
        previewInvite.mockResolvedValue(preview({ expires_at: inDays(-1) }));
        visit(`#token=${TOKEN}`);
        expect(await screen.findByText(CANT_BE_USED)).toBeInTheDocument();
        expect(document.body).not.toHaveTextContent("App One");
        expect(getPendingInvite()).toBeNull();
    });

    test("the invite expiring while the page is open turns it invalid", async () => {
        previewInvite.mockResolvedValue(preview({ expires_at: new Date(Date.now() + 200).toISOString() }));
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        expect(await screen.findByText(CANT_BE_USED, {}, { timeout: 2000 })).toBeInTheDocument();
        expect(getPendingInvite()).toBeNull();
    });
});

describe("not signed in", () => {
    test("shows company and role, and Sign in carries the allowlisted returnTo", async () => {
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        expect(screen.getByText("b@example.test")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
        expect(screen.getByTestId("location")).toHaveTextContent("/login");
        expect(screen.getByTestId("state")).toHaveTextContent('{"returnTo":"/console/invites/accept"}');
        expect(getPendingInvite()).toMatchObject({ token: TOKEN });
    });

    test("Create account prefills the invited email", async () => {
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        expect(screen.getByTestId("location")).toHaveTextContent("/register");
        expect(screen.getByDisplayValue("b@example.test")).toBeInTheDocument();
    });

    test("signing out in another tab forgets the invite", async () => {
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        act(() => handleSignedOut());
        expect(await screen.findByRole("heading", { name: "Open your invite link again" })).toBeInTheDocument();
        expect(getPendingInvite()).toBeNull();
    });

    test("the session ending (refresh failed) forgets the invite", async () => {
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" });
        act(() => {
            window.dispatchEvent(new Event("gait:session-ended"));
        });
        expect(await screen.findByRole("heading", { name: "Open your invite link again" })).toBeInTheDocument();
    });
});

describe("signed in", () => {
    test("as a different account: says who's who, and Switch account keeps the invite on purpose", async () => {
        mockUser = { email: "c@example.test", email_verified: true };
        mockLogout.mockImplementation(async ({ keepInvite } = {}) => {
            // Mirrors useBasicAuth.logout: keepInvite survives exactly this sign-out.
            const { keepThroughNextSignOut } = jest.requireActual("./pendingInvite");
            if (keepInvite) keepThroughNextSignOut();
            handleSignedOut();
        });
        visit(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "This invite is for someone else" })).toBeInTheDocument();
        expect(screen.getByText("c@example.test")).toBeInTheDocument();
        expect(screen.getByText("b@example.test")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Join/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Switch account" }));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
        expect(mockLogout).toHaveBeenCalledWith({ keepInvite: true });
        expect(screen.getByTestId("state")).toHaveTextContent('{"returnTo":"/console/invites/accept"}');
        expect(getPendingInvite()).toMatchObject({ token: TOKEN });
        expect(acceptInvite).not.toHaveBeenCalled();
    });

    test("matching email is compared case-insensitively", async () => {
        mockUser = { email: "B@Example.test", email_verified: true };
        visit(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Join App One" })).toBeInTheDocument();
    });

    test("with an unconfirmed email: explains, offers Resend, and rechecks", async () => {
        mockUser = { email: "b@example.test", email_verified: false };
        resendVerificationEmail.mockResolvedValue({ sent: true });
        visit(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Confirm your email to join" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
        await waitFor(() => expect(resendVerificationEmail).toHaveBeenCalled());
        mockValidateSession.mockClear();
        fireEvent.click(screen.getByRole("button", { name: "I've confirmed my email, continue" }));
        await waitFor(() => expect(mockValidateSession).toHaveBeenCalled());
        expect(acceptInvite).not.toHaveBeenCalled();
    });

    test("already a member: offers the company instead of Join", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        fetchMyOrganizations.mockResolvedValue([{ id: "1", name: "App One", slug: "app-one", org_role: "MEMBER" }]);
        visit(`#token=${TOKEN}`);
        const link = await screen.findByRole("link", { name: "Go to App One" });
        expect(link).toHaveAttribute("href", "/console/app-one/overview");
        expect(screen.queryByRole("button", { name: /Join/ })).not.toBeInTheDocument();
    });

    test("valid: confirms company, role, what it can do, inviter and expiry, then joins with a one-time welcome", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        acceptInvite.mockResolvedValue({ organization_slug: "app-one", organization_name: "App One", org_role: "ADMIN" });
        visit(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Join App One" })).toBeInTheDocument();
        expect(screen.getByText(/Manages applications, keys, findings and people, except Owners\./)).toBeInTheDocument();
        expect(screen.getByText("Ana Owner")).toBeInTheDocument();
        expect(screen.getByText("Expires")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Join App One" }));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/app-one/overview"));
        expect(acceptInvite).toHaveBeenCalledWith(TOKEN);
        expect(screen.getByTestId("state")).toHaveTextContent('{"welcome":{"company":"App One","role":"ADMIN"}}');
        expect(getPendingInvite()).toBeNull();
        expectTokenNowhere();
    });

    test("a deleted inviter is named as such", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        previewInvite.mockResolvedValue(preview({ invited_by_name: "" }));
        visit(`#token=${TOKEN}`);
        expect(await screen.findByText("a deleted account")).toBeInTheDocument();
    });

    test.each([
        ["EMAIL_NOT_VERIFIED", { status: 403, data: { code: "EMAIL_NOT_VERIFIED", detail: "x" } }, "Confirm your email to join"],
        ["ALREADY_MEMBER", { status: 409, data: { code: "ALREADY_MEMBER", detail: "x" } }, "You're already in App One"],
        ["INVITE_INVALID", { status: 404, data: { code: "INVITE_INVALID", detail: "x" } }, "This invite can't be used"],
    ])("Gait refusing the join with %s", async (_, response, heading) => {
        mockUser = { email: "b@example.test", email_verified: true };
        acceptInvite.mockRejectedValue({ response });
        visit(`#token=${TOKEN}`);
        fireEvent.click(await screen.findByRole("button", { name: "Join App One" }));
        expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    });

    test("Gait saying EMAIL_MISMATCH (look-alike account) shows the reason and keeps the invite", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        acceptInvite.mockRejectedValue({ response: { status: 403, data: { code: "EMAIL_MISMATCH", detail: "This invite is for a different email address." } } });
        visit(`#token=${TOKEN}`);
        fireEvent.click(await screen.findByRole("button", { name: "Join App One" }));
        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(getPendingInvite()).toMatchObject({ token: TOKEN });
    });
});

describe("rate limits", () => {
    test("a rate-limited preview counts down, then retries", async () => {
        jest.useFakeTimers();
        previewInvite.mockRejectedValueOnce({ response: { status: 429, headers: { "retry-after": "2" }, data: { code: "RATE_LIMITED" } } });
        visit(`#token=${TOKEN}`);
        await act(async () => {
            await Promise.resolve();
        });
        expect(await screen.findByRole("heading", { name: "Too many attempts" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Try again in \ds/ })).toBeDisabled();
        act(() => {
            jest.advanceTimersByTime(2500);
        });
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(previewInvite).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
        expect(await screen.findByRole("heading", { name: "App One invited you to its workspace as Admin" })).toBeInTheDocument();
    });

    test("a rate-limited join shows the same wait", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        acceptInvite.mockRejectedValue({ response: { status: 429, headers: { "retry-after": "30" }, data: { code: "RATE_LIMITED" } } });
        visit(`#token=${TOKEN}`);
        fireEvent.click(await screen.findByRole("button", { name: "Join App One" }));
        expect(await screen.findByRole("heading", { name: "Too many attempts" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Try again in \d+s/ })).toBeDisabled();
        await settle();
    });
});

describe("joined elsewhere by confirmed email (INV1)", () => {
    const APP_ONE_MEMBERSHIP = { id: "1", name: "App One", slug: "app-one", org_role: "ADMIN" };

    test("Join says 'already in', not 'can't be used', when the invite was used up by joining in another tab", async () => {
        mockUser = { email: "b@example.test", email_verified: true };
        acceptInvite.mockImplementation(() => {
            fetchMyOrganizations.mockResolvedValue([APP_ONE_MEMBERSHIP]);
            return Promise.reject({ response: { status: 404, data: { code: "INVITE_INVALID", detail: "x" } } });
        });
        visit(`#token=${TOKEN}`);
        fireEvent.click(await screen.findByRole("button", { name: "Join App One" }));
        expect(await screen.findByRole("heading", { name: "You're already in App One" })).toBeInTheDocument();
        expect(screen.queryByText(CANT_BE_USED)).not.toBeInTheDocument();
    });

    test("\"I've confirmed my email, continue\" rechecks workspaces, so a join in the other tab shows as already in", async () => {
        mockUser = { email: "b@example.test", email_verified: false };
        visit(`#token=${TOKEN}`);
        await screen.findByRole("heading", { name: "Confirm your email to join" });
        mockUser = { email: "b@example.test", email_verified: true };
        fetchMyOrganizations.mockResolvedValue([APP_ONE_MEMBERSHIP]);
        fireEvent.click(screen.getByRole("button", { name: "I've confirmed my email, continue" }));
        expect(await screen.findByRole("link", { name: "Go to App One" })).toHaveAttribute("href", "/console/app-one/overview");
        expect(acceptInvite).not.toHaveBeenCalled();
    });
});
