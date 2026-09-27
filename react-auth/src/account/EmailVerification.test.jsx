import "@testing-library/jest-dom";
import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VerifyEmailPage, readTokenFromHash } from "./VerifyEmailPage";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { CreateCompanyStep } from "../components/workspace/onboarding/CreateCompanyStep";
import { resendVerificationEmail, verifyEmailToken } from "./emailVerificationApi";

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

// Obviously fake, test-only token.
const TOKEN = "test-only-verification-token";

function visitVerify(hash, { strict = false } = {}) {
    window.history.replaceState(null, "", `/verify-email${hash}`);
    const page = (
        <MemoryRouter>
            <VerifyEmailPage />
        </MemoryRouter>
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
        expect(await screen.findByRole("heading", { name: "Email confirmed" })).toBeInTheDocument();
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
        expect(screen.getByRole("heading", { name: "Email confirmed" })).toBeInTheDocument();
        expect(verifyEmailToken).toHaveBeenNthCalledWith(2, TOKEN);
        await act(() => Promise.resolve()); // fake timers: no macrotask flush here
    });

    test("a second link opened in the same tab (fragment change, no reload) is stripped and verified too", async () => {
        mockUser = { email: "me@example.test", email_verified: true };
        verifyEmailToken
            .mockResolvedValueOnce({ email_verified: true, email: "me@example.test" })
            .mockRejectedValueOnce({ response: { status: 400, data: { code: "VERIFICATION_INVALID" } } });
        visitVerify(`#token=${TOKEN}`);
        expect(await screen.findByRole("heading", { name: "Email confirmed" })).toBeInTheDocument();

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
        window.history.replaceState(null, "", `/verify-email?token=${TOKEN}`);
        render(
            <MemoryRouter>
                <VerifyEmailPage />
            </MemoryRouter>
        );
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
