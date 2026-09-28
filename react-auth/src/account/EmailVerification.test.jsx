import "@testing-library/jest-dom";
import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VerifyEmailPage, readTokenFromHash } from "./VerifyEmailPage";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { CreateCompanyStep } from "../components/workspace/onboarding/CreateCompanyStep";
import { resendVerificationEmail, verifyEmailToken } from "./emailVerificationApi";
import { acceptInviteById, fetchMyInvites } from "../console/api/consoleApi";

let mockUser = null;
const mockValidateSession = jest.fn(() => Promise.resolve());

jest.mock("./emailVerificationApi", () => ({
    verifyEmailToken: jest.fn(),
    resendVerificationEmail: jest.fn(),
}));
jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser }),
}));
jest.mock("../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: mockValidateSession }),
}));
jest.mock("../console/api/consoleApi", () => ({
    fetchMyInvites: jest.fn(),
    acceptInviteById: jest.fn(),
}));

// Obviously fake, test-only token.
const TOKEN = "test-only-verification-token";

function LocationProbe() {
    const location = useLocation();
    return (
        <>
            <div data-testid="location">{location.pathname}</div>
            <div data-testid="state">{JSON.stringify(location.state)}</div>
        </>
    );
}

function visitVerify(hash, { strict = false } = {}) {
    window.history.replaceState(null, "", `/verify-email${hash}`);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const page = (
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <VerifyEmailPage />
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
    return render(strict ? <StrictMode>{page}</StrictMode> : page);
}

// Let pending session checks (and their .finally) finish inside act().
async function settle() {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function rateLimited(seconds, code = "RATE_LIMITED") {
    return { response: { status: 429, headers: { "retry-after": String(seconds) }, data: { code, detail: "Too many attempts." } } };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSession.mockImplementation(() => Promise.resolve()); // CRA's resetMocks clears it
    mockUser = null;
    fetchMyInvites.mockResolvedValue([]);
    window.localStorage.clear();
    window.sessionStorage.clear();
});

afterEach(() => {
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
});

describe("/verify-email", () => {
    test("reads the token from the fragment only", () => {
        expect(readTokenFromHash(`#token=${TOKEN}`)).toBe(TOKEN);
        expect(readTokenFromHash("")).toBeNull();
        expect(readTokenFromHash(`#token=${"x".repeat(257)}`)).toBeNull();
    });

    test("strips the token from the address bar at once, verifies exactly once (even in StrictMode), and confirms", async () => {
        verifyEmailToken.mockResolvedValue({ email_verified: true, email: "new@example.test" });
        visitVerify(`#token=${TOKEN}`, { strict: true });

        expect(window.location.hash).toBe("");
        expect(window.location.pathname).toBe("/verify-email");
        expect(await screen.findByText(/is confirmed\./)).toBeInTheDocument();
        expect(screen.getByText("new@example.test")).toBeInTheDocument();
        expect(verifyEmailToken).toHaveBeenCalledTimes(1);
        expect(verifyEmailToken).toHaveBeenCalledWith(TOKEN);
        expect(mockValidateSession).toHaveBeenCalled(); // banners elsewhere refresh
        expect(screen.getByRole("link", { name: "Sign in to continue" })).toHaveAttribute("href", "/login");

        expect(document.body.innerHTML).not.toContain(TOKEN);
        expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage })).not.toContain(TOKEN);
        await settle();
    });

    test("a signed-in visitor continues to the console", async () => {
        mockUser = { email: "me@example.test", email_verified: false };
        verifyEmailToken.mockResolvedValue({ email_verified: true, email: "me@example.test" });
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByRole("link", { name: "Continue" })).toHaveAttribute("href", "/console");
        await settle();
    });

    test("invalid or expired, signed out: explains and points to sign in", async () => {
        verifyEmailToken.mockRejectedValue({ response: { status: 400, data: { code: "VERIFICATION_INVALID" } } });
        visitVerify(`#token=${TOKEN}`);
        await settle();
        expect(await screen.findByRole("heading", { name: "This link can't be used" })).toBeInTheDocument();
        expect(screen.getByText(/links last 48 hours/)).toBeInTheDocument();
        expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
        expect(mockValidateSession).toHaveBeenCalled();
        await settle();
    });

    test("invalid, signed in and not yet confirmed: offers a new link", async () => {
        mockUser = { email: "me@example.test", email_verified: false };
        verifyEmailToken.mockRejectedValue({ response: { status: 400, data: { code: "VERIFICATION_INVALID" } } });
        resendVerificationEmail.mockResolvedValue({ email_verified: false, sent: true });
        visitVerify(`#token=${TOKEN}`);
        const button = await screen.findByRole("button", { name: "Resend link" });
        fireEvent.click(button);
        expect(await screen.findByText("Sent. Check your inbox (and spam).")).toBeInTheDocument();
        expect(resendVerificationEmail).toHaveBeenCalledTimes(1);
        await settle();
    });

    test("invalid but already confirmed: says so instead of an error", async () => {
        mockUser = { email: "me@example.test", email_verified: true };
        verifyEmailToken.mockRejectedValue({ response: { status: 400, data: { code: "VERIFICATION_INVALID" } } });
        visitVerify(`#token=${TOKEN}`);
        await settle();
        expect(await screen.findByRole("heading", { name: "Your email is already confirmed" })).toBeInTheDocument();
        await settle();
    });

    test("rate limited: waits for Retry-After, then retries with the same token", async () => {
        jest.useFakeTimers();
        verifyEmailToken.mockRejectedValueOnce(rateLimited(3)).mockResolvedValueOnce({ email_verified: true, email: "me@example.test" });
        visitVerify(`#token=${TOKEN}`);
        await act(() => Promise.resolve());
        const retry = screen.getByRole("button", { name: "Try again in 3s" });
        expect(retry).toBeDisabled();
        await act(async () => {
            jest.advanceTimersByTime(3100);
        });
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        await act(() => Promise.resolve());
        expect(screen.getByText(/is confirmed\./)).toBeInTheDocument();
        expect(verifyEmailToken).toHaveBeenNthCalledWith(2, TOKEN);
        await act(() => Promise.resolve()); // fake timers: no macrotask flush here
    });

    test("a second link opened in the same tab (fragment change, no reload) is stripped and verified too", async () => {
        mockUser = { email: "me@example.test", email_verified: true };
        verifyEmailToken
            .mockResolvedValueOnce({ email_verified: true, email: "me@example.test" })
            .mockRejectedValueOnce({ response: { status: 400, data: { code: "VERIFICATION_INVALID" } } });
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByText(/is confirmed\./)).toBeInTheDocument();

        await act(async () => {
            window.history.replaceState(null, "", `/verify-email#token=${TOKEN}-2`);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(window.location.hash).toBe("");
        expect(await screen.findByRole("heading", { name: "Your email is already confirmed" })).toBeInTheDocument();
        expect(verifyEmailToken).toHaveBeenNthCalledWith(2, `${TOKEN}-2`);
        await settle();
    });

    test("no token in the link: invalid, and nothing is sent", async () => {
        visitVerify("");
        await settle();
        expect(await screen.findByRole("heading", { name: "This link can't be used" })).toBeInTheDocument();
        expect(verifyEmailToken).not.toHaveBeenCalled();
        await settle();
    });

    test("a token in the query string is ignored (only the fragment counts)", async () => {
        visitVerify(`?token=${TOKEN}`);
        await settle();
        expect(await screen.findByRole("heading", { name: "This link can't be used" })).toBeInTheDocument();
        expect(verifyEmailToken).not.toHaveBeenCalled();
        await settle();
    });
});

describe("unverified banner", () => {
    function renderBanner() {
        return render(<EmailVerificationBanner />);
    }

    test("only when Gait says the address is unconfirmed", () => {
        mockUser = { email: "me@example.test" }; // older Gait: no field
        const { rerender } = renderBanner();
        expect(screen.queryByRole("region", { name: "Confirm your email" })).toBeNull();
        mockUser = { email: "me@example.test", email_verified: true };
        rerender(<EmailVerificationBanner />);
        expect(screen.queryByRole("region", { name: "Confirm your email" })).toBeNull();
        mockUser = { email: "me@example.test", email_verified: false };
        rerender(<EmailVerificationBanner />);
        expect(screen.getByRole("region", { name: "Confirm your email" })).toHaveTextContent("Confirm me@example.test.");
    });

    test("resend starts a 60-second cooldown", async () => {
        jest.useFakeTimers();
        mockUser = { email: "me@example.test", email_verified: false };
        resendVerificationEmail.mockResolvedValue({ email_verified: false, sent: true });
        renderBanner();
        fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
        await act(() => Promise.resolve());
        expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();
        await act(async () => {
            jest.advanceTimersByTime(60_500);
        });
        expect(screen.getByRole("button", { name: "Resend link" })).toBeEnabled();
    });

    test("a RESEND_COOLDOWN honours Retry-After instead of showing an error", async () => {
        mockUser = { email: "me@example.test", email_verified: false };
        resendVerificationEmail.mockRejectedValue(rateLimited(42, "RESEND_COOLDOWN"));
        renderBanner();
        fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
        expect(await screen.findByRole("button", { name: "Resend in 42s" })).toBeDisabled();
        expect(screen.queryByText(/Too many/)).toBeNull();
    });

    test("if Gait says it's already confirmed, the session refreshes so the banner goes", async () => {
        mockUser = { email: "me@example.test", email_verified: false };
        resendVerificationEmail.mockResolvedValue({ email_verified: true, sent: false });
        renderBanner();
        fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
        await waitFor(() => expect(mockValidateSession).toHaveBeenCalled());
    });
});

describe("creating a company before confirming", () => {
    test("EMAIL_NOT_VERIFIED shows Gait's reason with a resend button", () => {
        const error = {
            response: { status: 403, data: { code: "EMAIL_NOT_VERIFIED", detail: "Confirm your email address before creating a company." } },
        };
        render(<CreateCompanyStep onCreate={jest.fn(() => Promise.reject(error))} isCreating={false} createError={error} />);
        expect(screen.getByRole("alert")).toHaveTextContent("Confirm your email address before creating a company.");
        expect(screen.getByRole("button", { name: "Resend link" })).toBeInTheDocument();
    });
});

const LUMEN_INVITE = {
    id: "3f0c6a52-0000-4000-8000-000000000001",
    organization_name: "Lumen",
    organization_slug: "lumen",
    org_role: "OWNER",
    invited_by_email: "owner@lumen.test",
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 - 60000).toISOString(),
};

describe("INV-UX: invites on the confirmed page", () => {
    test("signed in after confirming: pending invites are offered, and Join lands in the workspace with a welcome", async () => {
        mockUser = { email: "new@example.test", email_verified: false }; // the session still holds the old flag
        verifyEmailToken.mockResolvedValue({ email_verified: true, email: "new@example.test" });
        fetchMyInvites.mockResolvedValue([LUMEN_INVITE]);
        acceptInviteById.mockResolvedValue({ organization_slug: "lumen", organization_name: "Lumen", org_role: "OWNER" });
        visitVerify(`#token=${TOKEN}`);

        expect(await screen.findByRole("heading", { name: "You've been invited" })).toBeInTheDocument();
        expect(screen.getByText("You've been invited to a workspace.")).toBeInTheDocument();
        expect(screen.getByText("Join now, or continue to Gait.")).toBeInTheDocument();
        const list = screen.getByRole("list", { name: "Your invitations" });
        expect(list).toHaveTextContent("Lumen invited you to its workspace as Owner");
        expect(list).toHaveTextContent("From owner@lumen.test · expires in 6 days");
        expect(screen.queryByText(/You can now create a company/)).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Continue" })).toHaveClass("ds-btn--secondary");

        fireEvent.click(screen.getByRole("button", { name: "Join Lumen" }));
        const confirm = screen.getByRole("group", { name: "Join Lumen?" });
        expect(confirm).toHaveTextContent("Full control, including other Owners");
        expect(confirm).toHaveTextContent("owner@lumen.test");
        fireEvent.click(screen.getByRole("button", { name: "Join Lumen as an Owner" }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/console/lumen/overview"));
        expect(acceptInviteById).toHaveBeenCalledWith(LUMEN_INVITE.id);
        expect(screen.getByTestId("state")).toHaveTextContent('{"welcome":{"company":"Lumen","role":"OWNER"}}');
    });

    test("no invites: the page reads as before", async () => {
        mockUser = { email: "new@example.test", email_verified: true };
        verifyEmailToken.mockResolvedValue({ email_verified: true, email: "new@example.test" });
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByText(/You can now create a workspace or accept an invite\./)).toBeInTheDocument();
        await waitFor(() => expect(fetchMyInvites).toHaveBeenCalled());
        expect(screen.queryByRole("list", { name: "Your invitations" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Continue" })).not.toHaveClass("ds-btn--secondary");
    });

    test("not signed in: invites aren't asked for; signing in leads to them", async () => {
        verifyEmailToken.mockResolvedValue({ email_verified: true, email: "new@example.test" });
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByRole("link", { name: "Sign in to continue" })).toBeInTheDocument();
        await settle();
        expect(fetchMyInvites).not.toHaveBeenCalled();
    });

    test("an already-confirmed account opening an old link still sees its invites", async () => {
        mockUser = { email: "me@example.test", email_verified: true };
        verifyEmailToken.mockRejectedValue({ response: { status: 404, data: { code: "VERIFICATION_INVALID" } } });
        fetchMyInvites.mockResolvedValue([LUMEN_INVITE, { ...LUMEN_INVITE, id: "3f0c6a52-0000-4000-8000-000000000002", organization_name: "Acme", organization_slug: "acme", org_role: "MEMBER" }]);
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Your email is already confirmed" })).toBeInTheDocument();
        expect(await screen.findByText("You've been invited to 2 workspaces.")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Join / })).toHaveLength(2);
    });
});
