import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RegisterPage } from "../components/register/RegisterPage";
import { ForgotPassword } from "../components/forgot-password/ForgotPassword";
import { ResetPassword } from "../components/reset-password/ResetPassword";
import { LoginPage } from "../components/login/LoginPage";
import { WorkspaceChooserStep } from "../components/workspace/onboarding/WorkspaceChooserStep";
import { publicAxios } from "../interceptors/axios";

const mockCancelTwoFactor = jest.fn();
const mockVerify2FA = jest.fn(() => Promise.resolve());
let mockIs2FARequired = false;

jest.mock("../interceptors/axios", () => ({ publicAxios: { post: jest.fn() } }));
jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({
        login: () => Promise.resolve(),
        is2FARequired: mockIs2FARequired,
        cancelTwoFactor: mockCancelTwoFactor,
        error: null,
        isLoading: false,
    }),
}));
jest.mock("../hooks/useTwoFactorAuth", () => ({
    useTwoFactorAuth: () => ({ verify2FA: mockVerify2FA, twoFactorError: null, sessionExpired: false, isLoading: false }),
}));

const TEST_PASSWORD = "test-only-passphrase";

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search + location.hash}</div>;
}

function visit(path, element, routePath = path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={routePath} element={element} />
                <Route path="*" element={<p>Elsewhere</p>} />
            </Routes>
            <LocationProbe />
        </MemoryRouter>
    );
}

function type(label, value) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
    jest.clearAllMocks();
    mockIs2FARequired = false;
});

describe("create account", () => {
    function fill() {
        type("First name", "Maya");
        type("Last name", "Okafor");
        type("Email", "maya@example.test");
        type("Password", TEST_PASSWORD);
        type("Confirm password", TEST_PASSWORD);
    }

    test("success says where the confirmation email went, instead of a silent redirect", async () => {
        publicAxios.post.mockResolvedValue({ data: {} });
        visit("/register", <RegisterPage />);
        fill();
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        expect(await screen.findByRole("heading", { name: "Check your email" })).toHaveFocus();
        expect(screen.getByText("maya@example.test")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
        expect(publicAxios.post).toHaveBeenCalledWith("/register/", {
            first_name: "Maya",
            last_name: "Okafor",
            email: "maya@example.test",
            password: TEST_PASSWORD,
            password_confirm: TEST_PASSWORD,
        });
    });

    test("Gait's errors land under their fields", async () => {
        publicAxios.post.mockRejectedValue({
            response: { status: 400, data: { error: { email: ["A user with that email already exists."], password: ["This password is too common."] } } },
        });
        visit("/register", <RegisterPage />);
        fill();
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        expect(await screen.findByText("A user with that email already exists.")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByText("This password is too common.")).toBeInTheDocument();
    });

    test("mismatched passwords are caught before asking Gait", () => {
        visit("/register", <RegisterPage />);
        fill();
        type("Confirm password", "something else");
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        expect(screen.getByText("These don't match. Type the same password twice.")).toBeInTheDocument();
        expect(publicAxios.post).not.toHaveBeenCalled();
    });
});

describe("forgot password", () => {
    test("the answer stays on screen and doesn't say whether the account exists", async () => {
        publicAxios.post.mockResolvedValue({ data: { message: "If your email is registered, you will receive a link." } });
        visit("/forgot-password", <ForgotPassword />);
        type("Email", "maya@example.test");
        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
        expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
        expect(screen.getByText(/If/)).toHaveTextContent("If maya@example.test has a Gait account, a reset link is on its way.");
        expect(publicAxios.post).toHaveBeenCalledWith("/forgot-password/", { email: "maya@example.test" });
    });

    test("a failure is shown, not hidden in a toast", async () => {
        publicAxios.post.mockRejectedValue(new Error("offline"));
        visit("/forgot-password", <ForgotPassword />);
        type("Email", "maya@example.test");
        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't send that just now.");
    });
});

describe("reset password", () => {
    const LINK = "/reset-password#token=test-only-reset-token";
    const OLD_LINK = "/reset-password/MQ/test-only-reset-token";
    const OLD_ROUTE = "/reset-password/:uidb64/:token";
    const INVALID = "This password reset link is invalid or has expired.";

    function submit(password = TEST_PASSWORD, confirm = TEST_PASSWORD) {
        type("New password", password);
        type("Confirm new password", confirm);
        fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    }

    test("today's link: the token is read from #token=, taken out of the address bar, and sent only in the body", async () => {
        publicAxios.post.mockResolvedValue({ data: { message: "ok" } });
        visit(LINK, <ResetPassword />, "/reset-password");
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/reset-password$/));
        submit();
        expect(await screen.findByRole("heading", { name: "Sign in with your new password" })).toHaveFocus();
        expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
        expect(publicAxios.post).toHaveBeenCalledWith("/reset-password/", {
            token: "test-only-reset-token",
            password: TEST_PASSWORD,
            password_confirm: TEST_PASSWORD,
        });
    });

    test("an older /reset-password/:uid/:token link still works", async () => {
        publicAxios.post.mockResolvedValue({ data: { message: "ok" } });
        visit(OLD_LINK, <ResetPassword />, OLD_ROUTE);
        submit();
        expect(await screen.findByRole("heading", { name: "Sign in with your new password" })).toBeInTheDocument();
        expect(publicAxios.post).toHaveBeenCalledWith("/reset-password/", {
            token: "test-only-reset-token",
            password: TEST_PASSWORD,
            password_confirm: TEST_PASSWORD,
        });
    });

    test("a link without a token is a dead link straight away, and nothing is sent", () => {
        visit("/reset-password", <ResetPassword />, "/reset-password");
        expect(screen.getByRole("heading", { name: "This reset link can't be used" })).toBeInTheDocument();
        expect(publicAxios.post).not.toHaveBeenCalled();
    });

    test("a used, unknown or expired link says so and offers a new one", async () => {
        publicAxios.post.mockRejectedValue({ response: { status: 400, data: { error: INVALID } } });
        visit(LINK, <ResetPassword />, "/reset-password");
        submit();
        expect(await screen.findByRole("heading", { name: "This reset link can't be used" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Send a new link" })).toHaveAttribute("href", "/forgot-password");
    });

    test("Gait's password rules land on the field (not a dead link), and the link stays usable", async () => {
        publicAxios.post.mockRejectedValue({
            response: { status: 400, data: { error: "['This password is too short.', 'This password is too common.']" } },
        });
        visit(LINK, <ResetPassword />, "/reset-password");
        submit("short", "short");
        expect(await screen.findByText("This password is too short. This password is too common.")).toBeInTheDocument();
        expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true");
        expect(screen.queryByRole("heading", { name: "This reset link can't be used" })).not.toBeInTheDocument();
    });

    test("a field-shaped weak-password answer is shown on its field too", async () => {
        publicAxios.post.mockRejectedValue({ response: { status: 400, data: { error: { password: ["This password is too short."] } } } });
        visit(OLD_LINK, <ResetPassword />, OLD_ROUTE);
        submit("short", "short");
        expect(await screen.findByText("This password is too short.")).toBeInTheDocument();
        expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true");
    });

    test("mismatched passwords are caught before asking Gait", () => {
        visit(LINK, <ResetPassword />, "/reset-password");
        submit(TEST_PASSWORD, "different");
        expect(screen.getByText("These don't match. Type the same password twice.")).toBeInTheDocument();
        expect(publicAxios.post).not.toHaveBeenCalled();
    });
});

describe("sign in", () => {
    test("the code step is part of the same card, focused, and can go back to a different account", () => {
        mockIs2FARequired = true;
        visit("/login", <LoginPage />);
        expect(screen.getByRole("heading", { name: "Enter your code" })).toHaveFocus();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        const code = screen.getByLabelText("6-digit code");
        expect(code).toHaveAttribute("autocomplete", "one-time-code");
        expect(code).toHaveAttribute("inputmode", "numeric");
        expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Use a different account" }));
        expect(mockCancelTwoFactor).toHaveBeenCalledTimes(1);
    });

    test("lost phone: the code step takes a recovery code instead, however it was written down", async () => {
        mockIs2FARequired = true;
        visit("/login", <LoginPage />);
        fireEvent.click(screen.getByRole("button", { name: "Lost your phone? Use a recovery code" }));
        const field = screen.getByLabelText("Recovery code");
        expect(field).toHaveAttribute("autocomplete", "off");
        const verify = screen.getByRole("button", { name: "Verify" });
        type("Recovery code", "ABCDE-123");
        expect(verify).toBeDisabled();
        type("Recovery code", "abcde 12345");
        expect(verify).toBeEnabled();
        fireEvent.click(verify);
        await waitFor(() => expect(mockVerify2FA).toHaveBeenCalledWith("abcde 12345", { returnTo: undefined, recovery: true }));
        fireEvent.click(screen.getByRole("button", { name: "Use your authenticator app instead" }));
        expect(screen.getByLabelText("6-digit code")).toHaveValue("");
    });

    test("Forgot password sits with the password field", () => {
        visit("/login", <LoginPage />);
        expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
    });
});

test("onboarding's workspace chooser lists real memberships with their roles", () => {
    const onChoose = jest.fn();
    render(
        <MemoryRouter>
            <WorkspaceChooserStep
                organizations={[
                    { id: "1", name: "Acme", slug: "acme", org_role: "OWNER" },
                    { id: "2", name: "Beta Labs", slug: "beta-labs", org_role: "MEMBER" },
                ]}
                onChoose={onChoose}
                onCreateNew={jest.fn()}
            />
        </MemoryRouter>
    );
    const list = screen.getByRole("list", { name: "Your workspaces" });
    expect(within(list).getAllByRole("listitem")[1]).toHaveTextContent("Beta LabsMember");
    fireEvent.click(screen.getByRole("button", { name: "Open Beta Labs" }));
    expect(onChoose).toHaveBeenCalledWith("beta-labs");
    expect(screen.getByRole("button", { name: "Create another workspace" })).toBeInTheDocument();
});

test("nothing on these pages puts a secret in storage", async () => {
    publicAxios.post.mockResolvedValue({ data: {} });
    visit("/reset-password#token=test-only-reset-token", <ResetPassword />, "/reset-password");
    type("New password", TEST_PASSWORD);
    type("Confirm new password", TEST_PASSWORD);
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() => expect(publicAxios.post).toHaveBeenCalled());
    expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage })).not.toContain("test-only");
});
