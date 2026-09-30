import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccountPage } from "./AccountPage";
import { TwoStepSetupPage } from "./TwoStepSetupPage";
import { UserMenu } from "./UserMenu";
import { recoveryCodesText } from "./RecoveryCodes";
import { safeReturnTo } from "../auth/returnTo";
import { authAxios } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

let mockUser = null;
const mockSetUser = jest.fn();
const mockLogout = jest.fn();
const mockValidateSession = jest.fn();

jest.mock("../interceptors/axios", () => ({
    authAxios: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
    publicAxios: { post: jest.fn() },
    SESSION_TRANSPORT: { session_transport: "cookie" },
}));
jest.mock("../interceptors/tokenStorage", () => ({ persistAuthTokens: jest.fn() }));
jest.mock("./emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser, setUser: mockSetUser, logout: mockLogout }),
}));
jest.mock("../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: mockValidateSession }),
}));

const TEST_PASSWORD = "test-only-password";
const STEP_UP = { response: { status: 403, data: { code: "STEP_UP_REQUIRED", required_strength: "password" } } };
const TEN_CODES = Array.from({ length: 10 }, (_, index) => `test${index}-codes`);

/** Gait's recovery-code count for the signed-in account (never the codes). */
function mockRecoveryStatus(status = { enabled: true, recovery_codes_remaining: 10, generated_at: "2026-09-01T12:00:00Z" }) {
    authAxios.get.mockImplementation((url) =>
        url === "/user/2fa/recovery-codes/" ? Promise.resolve({ data: status }) : Promise.reject(new Error(url))
    );
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

function renderAt(path) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/account/two-step" element={<TwoStepSetupPage />} />
                    <Route path="/login" element={<p>Sign-in page</p>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

async function settle() {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { email: "maya@example.test", first_name: "Maya", last_name: "Okafor", email_verified: true, is_2fa_enabled: false, is_2fa_setup_in_progress: false };
    mockValidateSession.mockImplementation(() => Promise.resolve());
    mockLogout.mockImplementation(() => Promise.resolve());
    global.URL.createObjectURL = jest.fn(() => "blob:qr");
    global.URL.revokeObjectURL = jest.fn();
});

describe("user menu", () => {
    function showMenu(onSignOut = jest.fn()) {
        render(
            <MemoryRouter>
                <UserMenu user={mockUser} onSignOut={onSignOut} />
                <LocationProbe />
            </MemoryRouter>
        );
        return onSignOut;
    }

    test("flags two-step verification when it's off, and opens a keyboard menu", () => {
        showMenu();
        const button = screen.getByRole("button", { name: "Your account, two-step verification is off" });
        expect(button).toHaveAttribute("aria-expanded", "false");
        fireEvent.keyDown(button, { key: "ArrowDown" });
        const menu = screen.getByRole("menu", { name: "Your account" });
        const items = within(menu).getAllByRole("menuitem");
        expect(items.map((item) => item.textContent)).toEqual(["Account2FA off", "Docs", "Sign out"]);
        expect(items[0]).toHaveFocus();
        fireEvent.keyDown(menu, { key: "ArrowDown" });
        expect(items[1]).toHaveFocus();
        fireEvent.keyDown(menu, { key: "End" });
        expect(items[2]).toHaveFocus();
        fireEvent.keyDown(menu, { key: "Escape" });
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(button).toHaveFocus();
    });

    test("no flag once two-step is on; Account goes to /account; Sign out calls back", () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        const onSignOut = showMenu();
        fireEvent.click(screen.getByRole("button", { name: "Your account" }));
        expect(screen.getByRole("menuitem", { name: "Account" })).toHaveAttribute("href", "/account");
        fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
        expect(onSignOut).toHaveBeenCalledTimes(1);
    });
});

describe("/account", () => {
    test("signed out: goes to sign-in and remembers to come back", async () => {
        mockUser = null;
        renderAt("/account");
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
        expect(screen.getByTestId("state")).toHaveTextContent('{"from":"/account"}');
        expect(safeReturnTo("/account")).toBe("/account");
        expect(safeReturnTo("/account/two-step")).toBe("/account/two-step");
        expect(safeReturnTo("/account/../evil")).toBeNull();
    });

    test("shows email status, and makes turning two-step on the obvious next step", async () => {
        renderAt("/account");
        expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
        expect(screen.getByText(/Two-step verification is off\./)).toBeInTheDocument();
        const email = screen.getByRole("region", { name: "Email" });
        expect(email).toHaveTextContent("maya@example.test");
        expect(email).toHaveTextContent("Confirmed");
        const twoStep = screen.getByRole("region", { name: "Two-step verification" });
        expect(twoStep).toHaveTextContent("Off");
        expect(within(twoStep).getByRole("link", { name: "Turn on two-step verification" })).toHaveAttribute("href", "/account/two-step");
    });

    test("an unconfirmed email says so and offers a new link", async () => {
        mockUser = { ...mockUser, email_verified: false };
        renderAt("/account");
        const email = await screen.findByRole("region", { name: "Email" });
        expect(email).toHaveTextContent("Not confirmed");
        expect(within(email).getByRole("button", { name: "Resend link" })).toBeInTheDocument();
    });

    test("change password: checks the two new passwords match before asking Gait", async () => {
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
        expect(screen.getByLabelText("Current password")).toHaveFocus();
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "something-else" } });
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
        expect(screen.getByText("These don't match. Type the same password twice.")).toBeInTheDocument();
        expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("aria-invalid", "true");
        expect(authAxios.post).not.toHaveBeenCalled();
    });

    test("change password: when Gait wants a recent sign-in, confirm it's you, then it goes through", async () => {
        authAxios.post.mockImplementation((url) => {
            if (url === "/change-password/") {
                return authAxios.post.mock.calls.filter(([called]) => called === "/change-password/").length === 1
                    ? Promise.reject(STEP_UP)
                    : Promise.resolve({ data: { message: "Password changed successfully.", sessions_revoked: 2 } });
            }
            if (url === "/reauthenticate/") return Promise.resolve({ data: { message: "Reauthenticated successfully." } });
            return Promise.reject(new Error(url));
        });
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));

        const dialog = await screen.findByRole("dialog", { name: "Confirm it's you" });
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

        // Shown as an alert and announced once through the page's live region.
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Password changed. 2 other devices were signed out."));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(authAxios.post).toHaveBeenCalledWith("/reauthenticate/", { current_password: TEST_PASSWORD });
        expect(authAxios.post.mock.calls.filter(([url]) => url === "/change-password/")).toHaveLength(2);
    });

    test("change password with two-step on: confirming it's you asks for a code too, even for a password-strength step-up", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        let changes = 0;
        authAxios.post.mockImplementation((url) => {
            if (url === "/change-password/") {
                changes += 1;
                return changes === 1 ? Promise.reject(STEP_UP) : Promise.resolve({ data: { sessions_revoked: 0 } });
            }
            if (url === "/reauthenticate/") return Promise.resolve({ data: {} });
            return Promise.reject(new Error(url));
        });
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));

        const dialog = await screen.findByRole("dialog", { name: "Confirm it's you" });
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeDisabled();
        fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "135790" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Password changed."));
        expect(authAxios.post).toHaveBeenCalledWith("/reauthenticate/", { current_password: TEST_PASSWORD, otp: "135790" });
    });

    test("change password: Gait's field errors land on their fields", async () => {
        authAxios.post.mockRejectedValue({ response: { status: 400, data: { error: { current_password: ["That's not your current password."] } } } });
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong-test-password" } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "a-new-test-passphrase" } });
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
        expect(await screen.findByText("That's not your current password.")).toBeInTheDocument();
        expect(screen.getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
    });

    test("change password (CHK2a): the hint asks for 12 characters, and Gait's too-short message lands on New password", async () => {
        const tooShort = "This password is too short. It must contain at least 12 characters.";
        authAxios.post.mockRejectedValue({ response: { status: 400, data: { error: { new_password: [tooShort] } } } });
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
        expect(screen.getByText(/At least 12 characters/)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "eleven-char" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "eleven-char" } });
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
        expect(await screen.findByText(tooShort)).toBeInTheDocument();
        expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true");
    });

    async function openTurnOff() {
        fireEvent.click(await screen.findByRole("button", { name: "Turn off" }));
        return screen.getByRole("dialog", { name: "Turn off two-step verification?" });
    }

    const PROOF_REQUIRED = {
        response: { status: 403, data: { code: "PROOF_REQUIRED", reason: "PROOF_REQUIRED", message: "Enter your password and a code from your authenticator app (or a recovery code).", missing: ["otp"] } },
    };

    test("turn off: always asks for password + code in one step and sends them in the turn-off request itself (no re-authentication)", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        authAxios.patch.mockResolvedValue({ data: { is_2fa_setup_in_progress: false, sessions_revoked: 1 } });
        renderAt("/account");
        const dialog = await openTurnOff();
        const turnOff = within(dialog).getByRole("button", { name: "Turn off" });
        expect(turnOff).toBeDisabled();
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        expect(turnOff).toBeDisabled();
        fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "12 34 56" } });
        fireEvent.click(turnOff);

        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Two-step verification is off. 1 other device was signed out."));
        expect(authAxios.patch).toHaveBeenCalledTimes(1);
        expect(authAxios.patch).toHaveBeenCalledWith("/user/toggle-2fa/", { is_2fa_enabled: false, current_password: TEST_PASSWORD, otp: "123456" });
        expect(authAxios.post).not.toHaveBeenCalledWith("/reauthenticate/", expect.anything());
        expect(mockSetUser).toHaveBeenCalled();
    });

    test("turn off with a lost phone: a recovery code goes in the request instead of the code", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        authAxios.patch.mockResolvedValue({ data: { is_2fa_setup_in_progress: false, sessions_revoked: 0 } });
        renderAt("/account");
        const dialog = await openTurnOff();
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Lost your phone? Use a recovery code" }));
        fireEvent.change(within(dialog).getByLabelText("Recovery code"), { target: { value: " ABCDE-12345 " } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Turn off" }));

        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Two-step verification is off."));
        expect(authAxios.patch).toHaveBeenCalledWith("/user/toggle-2fa/", { is_2fa_enabled: false, current_password: TEST_PASSWORD, recovery_code: "ABCDE-12345" });
        expect(authAxios.post).not.toHaveBeenCalled();
    });

    test("turn off: Gait's field errors land on their fields; the code is cleared and nothing is turned off", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        authAxios.patch
            .mockRejectedValueOnce({ response: { status: 400, data: { error: { otp: ["Invalid authentication code."] } } } })
            .mockRejectedValueOnce({ response: { status: 400, data: { error: { current_password: ["Current password is incorrect."] } } } });
        renderAt("/account");
        const dialog = await openTurnOff();
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "000000" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Turn off" }));
        expect(await within(dialog).findByText("Invalid authentication code.")).toBeInTheDocument();
        expect(within(dialog).getByLabelText("6-digit code")).toHaveValue("");
        expect(within(dialog).getByLabelText("6-digit code")).toHaveAttribute("aria-invalid", "true");
        expect(within(dialog).getByLabelText("Current password")).toHaveValue(TEST_PASSWORD);

        fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "111111" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Turn off" }));
        expect(await within(dialog).findByText("Current password is incorrect.")).toBeInTheDocument();
        expect(within(dialog).getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
        expect(within(dialog).getByLabelText("Current password")).toHaveValue("");
        expect(mockSetUser).not.toHaveBeenCalled();
    });

    test("turn off: a PROOF_REQUIRED or throttled answer is shown in the dialog, which stays open", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        authAxios.patch
            .mockRejectedValueOnce(PROOF_REQUIRED)
            .mockRejectedValueOnce({ response: { status: 429, headers: { "retry-after": "60" }, data: {} } });
        renderAt("/account");
        const dialog = await openTurnOff();
        const fill = () => {
            fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
            fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "123456" } });
            fireEvent.click(within(dialog).getByRole("button", { name: "Turn off" }));
        };
        fill();
        expect(await within(dialog).findByRole("alert")).toHaveTextContent("Enter your password and a code from your authenticator app (or a recovery code).");
        fill();
        await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("Too many attempts. Wait a minute, then try again."));
        expect(screen.getByRole("dialog", { name: "Turn off two-step verification?" })).toBeInTheDocument();
    });

    test("recovery codes: shows how many are left, and turns amber at three or fewer", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus({ enabled: true, recovery_codes_remaining: 2, generated_at: "2026-09-01T12:00:00Z" });
        renderAt("/account");
        const panel = await screen.findByRole("region", { name: "Recovery codes" });
        await within(panel).findByText(/You have 2 recovery codes left/);
        expect(within(panel).getByText("2 left")).toHaveClass("ds-badge--warning");
        expect(within(panel).getByText("Running low.")).toBeInTheDocument();
        expect(within(panel).getByRole("button", { name: "Make new codes" })).toHaveClass("ds-btn--primary");
    });

    test("recovery codes: plenty left is calm, and there's no panel while two-step is off", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus();
        const { unmount } = renderAt("/account");
        const panel = await screen.findByRole("region", { name: "Recovery codes" });
        await within(panel).findByText(/You have 10 recovery codes left/);
        expect(within(panel).queryByText("Running low.")).not.toBeInTheDocument();
        unmount();
        mockUser = { ...mockUser, is_2fa_enabled: false };
        renderAt("/account");
        await screen.findByRole("heading", { name: "Account" });
        expect(screen.queryByRole("region", { name: "Recovery codes" })).not.toBeInTheDocument();
    });

    test("recovery codes: an account that turned two-step on before recovery codes existed is asked to make them", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus({ enabled: true, recovery_codes_remaining: 0, generated_at: null });
        renderAt("/account");
        const panel = await screen.findByRole("region", { name: "Recovery codes" });
        await within(panel).findByText(/doesn't have recovery codes yet/);
        expect(within(panel).getByRole("button", { name: "Make recovery codes" })).toBeInTheDocument();
    });

    test("recovery codes: making new ones always asks for proof and sends it with the request, shows them once, and Finish forgets them", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus({ enabled: true, recovery_codes_remaining: 1, generated_at: "2026-09-01T12:00:00Z" });
        authAxios.post.mockImplementation((url) =>
            url === "/user/2fa/recovery-codes/" ? Promise.resolve({ data: { recovery_codes: TEN_CODES } }) : Promise.reject(new Error(url))
        );
        renderAt("/account");
        const panel = await screen.findByRole("region", { name: "Recovery codes" });
        await within(panel).findByText(/You have 1 recovery code left/);
        fireEvent.click(within(panel).getByRole("button", { name: "Make new codes" }));

        const dialog = screen.getByRole("dialog", { name: "Make new recovery codes?" });
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.change(within(dialog).getByLabelText("6-digit code"), { target: { value: "246810" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Make new codes" }));

        const list = await screen.findByRole("list", { name: "Recovery codes" });
        expect(within(list).getAllByRole("listitem")).toHaveLength(10);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText(/Your old recovery codes no longer work/)).toBeInTheDocument();
        expect(authAxios.post).toHaveBeenCalledTimes(1);
        expect(authAxios.post).toHaveBeenCalledWith("/user/2fa/recovery-codes/", { current_password: TEST_PASSWORD, otp: "246810" });

        fireEvent.click(screen.getByRole("checkbox", { name: /I've saved these codes/ }));
        fireEvent.click(screen.getByRole("button", { name: "Finish" }));
        await waitFor(() => expect(screen.queryByRole("list", { name: "Recovery codes" })).not.toBeInTheDocument());
        await waitFor(() => expect(authAxios.get.mock.calls.filter(([url]) => url === "/user/2fa/recovery-codes/").length).toBe(2));
        expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage })).not.toContain("test0-codes");
    });

    test("recovery codes: a wrong code keeps the dialog open with the error on the code field; a recovery code also works", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        mockRecoveryStatus({ enabled: true, recovery_codes_remaining: 2, generated_at: "2026-09-01T12:00:00Z" });
        authAxios.post
            .mockRejectedValueOnce({ response: { status: 400, data: { error: { recovery_code: ["Invalid recovery code."] } } } })
            .mockResolvedValueOnce({ data: { recovery_codes: TEN_CODES } });
        renderAt("/account");
        const panel = await screen.findByRole("region", { name: "Recovery codes" });
        await within(panel).findByText(/You have 2 recovery codes left/);
        fireEvent.click(within(panel).getByRole("button", { name: "Make new codes" }));
        const dialog = screen.getByRole("dialog", { name: "Make new recovery codes?" });
        fireEvent.change(within(dialog).getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Lost your phone? Use a recovery code" }));
        fireEvent.change(within(dialog).getByLabelText("Recovery code"), { target: { value: "wrong-codes" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Make new codes" }));
        expect(await within(dialog).findByText("Invalid recovery code.")).toBeInTheDocument();
        expect(within(dialog).getByLabelText("Recovery code")).toHaveValue("");

        fireEvent.change(within(dialog).getByLabelText("Recovery code"), { target: { value: "right-codes" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Make new codes" }));
        expect(await screen.findByRole("list", { name: "Recovery codes" })).toBeInTheDocument();
        expect(authAxios.post).toHaveBeenLastCalledWith("/user/2fa/recovery-codes/", { current_password: TEST_PASSWORD, recovery_code: "right-codes" });
        expect(authAxios.post).not.toHaveBeenCalledWith("/reauthenticate/", expect.anything());
    });

    test("sign out everywhere confirms, revokes every session, and goes to sign-in", async () => {
        authAxios.post.mockResolvedValue({ data: { message: "Signed out of all devices" } });
        renderAt("/account");
        fireEvent.click(await screen.findByRole("button", { name: "Sign out everywhere" }));
        const dialog = screen.getByRole("dialog", { name: "Sign out everywhere?" });
        fireEvent.click(within(dialog).getByRole("button", { name: "Sign out everywhere" }));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
        expect(authAxios.post).toHaveBeenCalledWith("/logout-all/");
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});

describe("/account/two-step", () => {
    function mockSetup({ verify = { access_token: "test-only-access" } } = {}) {
        authAxios.post.mockImplementation((url) => {
            if (url === "/reauthenticate/") return Promise.resolve({ data: {} });
            if (url === "/verify-otp/") return Promise.resolve({ data: verify });
            return Promise.reject(new Error(url));
        });
        authAxios.patch.mockResolvedValue({ data: { is_2fa_setup_in_progress: true, manual_key: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP" } });
        authAxios.get.mockResolvedValue({ data: new Blob(["png"]) });
    }

    async function walkToCode() {
        renderAt("/account/two-step");
        expect(await screen.findByRole("heading", { name: "Protect your account" })).toHaveFocus();
        expect(screen.getByText("Step 1 of 4 · Before you start")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
        expect(screen.getByRole("heading", { name: "Confirm it's you" })).toHaveFocus();
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        expect(await screen.findByRole("img", { name: "QR code to add Gait to your authenticator app" })).toHaveAttribute("src", "blob:qr");
        expect(screen.getByText("Step 2 of 4 · Scan the code")).toBeInTheDocument();
        expect(screen.getByRole("group", { name: "Setup key" })).toHaveTextContent("JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP");
        fireEvent.click(screen.getByRole("button", { name: "Next: enter a code" }));
        fireEvent.change(screen.getByLabelText("6-digit code from the app"), { target: { value: "654321" } });
    }

    test("intro → confirm it's you → scan → code → on, then back to Account with a note", async () => {
        mockSetup();
        await walkToCode();
        fireEvent.click(screen.getByRole("button", { name: "Verify" }));
        expect(await screen.findByRole("heading", { name: "You're protected" })).toBeInTheDocument();

        expect(authAxios.post).toHaveBeenCalledWith("/reauthenticate/", { current_password: TEST_PASSWORD });
        expect(authAxios.patch).toHaveBeenCalledWith("/user/toggle-2fa/", { is_2fa_enabled: true });
        expect(authAxios.get).toHaveBeenCalledWith("/generate-qr/", { responseType: "blob" });
        expect(authAxios.post).toHaveBeenCalledWith("/verify-otp/", { otp: "654321", session_transport: "cookie" }, { withCredentials: true });
        expect(persistAuthTokens).toHaveBeenCalledWith({ accessToken: "test-only-access" });
        expect(mockSetUser).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Back to Account" }));
        // The Account page shows the note once, then drops it from history.
        expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Two-step verification is on.");
        expect(screen.getByRole("status")).not.toHaveTextContent("other devices");
        expect(screen.getByTestId("state")).toHaveTextContent("null");
    });

    test("turning it on signs out other sessions (H6): the done step and the Account note say so", async () => {
        mockSetup({ verify: { access_token: "test-only-access", sessions_revoked: 2 } });
        await walkToCode();
        fireEvent.click(screen.getByRole("button", { name: "Verify" }));
        expect(await screen.findByText(/You've been signed out on other devices\./)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back to Account" }));
        expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Two-step verification is on. You'll enter a code after your password from now on. You've been signed out on other devices.");
    });

    test("a wrong code says so and lets them try the one showing now", async () => {
        mockSetup();
        authAxios.post.mockImplementation((url) =>
            url === "/verify-otp/"
                ? Promise.reject({ response: { status: 400, data: { error: { otp: "Invalid OTP." } } } })
                : Promise.resolve({ data: {} })
        );
        await walkToCode();
        fireEvent.click(screen.getByRole("button", { name: "Verify" }));
        expect(await screen.findByText(/That code didn't match/)).toBeInTheDocument();
        expect(screen.getByLabelText("6-digit code from the app")).toHaveValue("");
    });

    test("a wrong password at the start is shown, and nothing is set up", async () => {
        authAxios.post.mockRejectedValue({ response: { status: 400, data: { error: { current_password: "Current password is incorrect." } } } });
        renderAt("/account/two-step");
        fireEvent.click(await screen.findByRole("button", { name: "Start" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong-test-password" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
        expect(authAxios.patch).not.toHaveBeenCalled();
    });

    test("the setup key can be copied for typing into the app", async () => {
        mockSetup();
        const writeText = jest.fn(() => Promise.resolve());
        Object.assign(navigator, { clipboard: { writeText } });
        renderAt("/account/two-step");
        fireEvent.click(await screen.findByRole("button", { name: "Start" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: TEST_PASSWORD } });
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        fireEvent.click(await screen.findByRole("button", { name: "Copy key" }));
        await settle();
        expect(writeText).toHaveBeenCalledWith("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP");
        expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });

    test("when Gait returns recovery codes (AUTH-B), they're shown once with copy, download and a saved check", async () => {
        const codes = ["7kq2-94mz", "p3x8-2rfw", "m9d4-hq7t"];
        mockSetup({ verify: { access_token: "test-only-access", recovery_codes: codes } });
        const writeText = jest.fn(() => Promise.resolve());
        Object.assign(navigator, { clipboard: { writeText } });
        await walkToCode();
        fireEvent.click(screen.getByRole("button", { name: "Verify" }));

        expect(await screen.findByRole("heading", { name: "Save your recovery codes" })).toBeInTheDocument();
        expect(screen.getByText("Step 4 of 4 · Recovery codes")).toBeInTheDocument();
        const list = screen.getByRole("list", { name: "Recovery codes" });
        expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(codes);

        const finish = screen.getByRole("button", { name: "Finish" });
        expect(finish).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Copy codes" }));
        await settle();
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining("7kq2-94mz\np3x8-2rfw\nm9d4-hq7t\n"));
        expect(screen.getByRole("status")).toHaveTextContent("Copied 3 codes.");

        fireEvent.click(screen.getByRole("checkbox", { name: /I've saved these codes/ }));
        expect(finish).toBeEnabled();
        fireEvent.click(finish);
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/account"));
        expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage })).not.toContain("7kq2-94mz");
    });

    test("already on: nothing to set up", async () => {
        mockUser = { ...mockUser, is_2fa_enabled: true };
        renderAt("/account/two-step");
        expect(await screen.findByRole("heading", { name: "Two-step verification is already on" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to Account" })).toHaveAttribute("href", "/account");
    });
});

test("the recovery-codes text file names the account and date, one code per line", () => {
    const text = recoveryCodesText(["aaaa-bbbb", "cccc-dddd"], { email: "maya@example.test", date: new Date("2026-09-28T12:00:00Z") });
    expect(text).toBe(
        "Gait recovery codes\nAccount: maya@example.test\nCreated: 2026-09-28\nEach code works once. Keep them somewhere safe, away from this device.\n\naaaa-bbbb\ncccc-dddd\n"
    );
});
