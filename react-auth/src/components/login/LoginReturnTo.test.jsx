import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "../register/RegisterPage";
import { clearPendingInvite, setPendingPreview, setPendingToken } from "../../console/invites/pendingInvite";
import { publicAxios } from "../../interceptors/axios";

const mockLogin = jest.fn();
const mockVerify2FA = jest.fn();
let mockIs2FARequired = false;
let mockSessionExpired = false;

jest.mock("../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ login: mockLogin, is2FARequired: mockIs2FARequired, error: null, isLoading: false }),
}));
jest.mock("../../hooks/useTwoFactorAuth", () => ({
    useTwoFactorAuth: () => ({ verify2FA: mockVerify2FA, twoFactorError: null, sessionExpired: mockSessionExpired }),
}));
jest.mock("../../interceptors/axios", () => ({ publicAxios: { post: jest.fn() } }));

const SIGN_IN = "Sign in";
const INVITE = "/console/invites/accept";
const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="state">{JSON.stringify(location.state)}</div>;
}

function visitLogin(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
            <LocationProbe />
        </MemoryRouter>
    );
}

beforeEach(() => {
    mockIs2FARequired = false;
    mockSessionExpired = false;
    mockLogin.mockImplementation(() => Promise.resolve());
    mockVerify2FA.mockImplementation(() => Promise.resolve());
    clearPendingInvite();
});

afterEach(() => {
    clearPendingInvite();
});

test("the password step carries returnTo from the invite page", async () => {
    visitLogin({ returnTo: INVITE });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "b@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-only-password" } });
    fireEvent.click(screen.getByRole("button", { name: SIGN_IN }));
    await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ email: "b@example.test" }), { returnTo: INVITE })
    );
});

test("returnTo survives the two-factor step", async () => {
    mockIs2FARequired = true;
    visitLogin({ returnTo: INVITE });
    // The code is step 2 of the same card now (no modal).
    fireEvent.change(await screen.findByLabelText("6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(mockVerify2FA).toHaveBeenCalledWith("123456", { returnTo: INVITE, recovery: false }));
});

describe("Create account from the login page", () => {
    test("coming from the invite page, it keeps returnTo and Register prefills the invited email from memory", () => {
        setPendingToken("test-only-invite-token");
        setPendingPreview({ organization_name: "App One", organization_slug: "app-one", org_role: "ADMIN", invited_email: "b@example.test", expires_at: inDays(6) });
        visitLogin({ returnTo: INVITE });
        fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
        expect(screen.getByTestId("state")).toHaveTextContent(JSON.stringify({ returnTo: INVITE }));
        expect(screen.getByDisplayValue("b@example.test")).toBeInTheDocument();
    });

    test("a console page that sent them to sign in is carried too, without prefilling anything", () => {
        visitLogin({ from: "/console/app-one/members" });
        fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
        expect(screen.getByTestId("state")).toHaveTextContent(JSON.stringify({ returnTo: "/console/app-one/members" }));
        expect(screen.queryByDisplayValue("b@example.test")).not.toBeInTheDocument();
    });

    test.each(["//evil.com", "/\\evil.com", "https://evil.com", ["javascript", "alert(1)"].join(":")])(
        "an unsafe returnTo (%s) is dropped",
        (returnTo) => {
            visitLogin({ returnTo });
            fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
            expect(screen.getByTestId("state")).toHaveTextContent("null");
        }
    );

    test("with no returnTo it's a plain link to Register", () => {
        visitLogin(undefined);
        expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
    });

    test("with no invite in memory, Register doesn't prefill even when returning to the invite page", () => {
        visitLogin({ returnTo: INVITE });
        fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
        expect(screen.getByTestId("state")).toHaveTextContent(JSON.stringify({ returnTo: INVITE }));
        expect(screen.getByLabelText("Email")).toHaveValue("");
    });
});


describe("Continue after creating an account", () => {
    test.each([
        [true, INVITE, { returnTo: INVITE }],
        [false, INVITE, { returnTo: INVITE }],
        [undefined, "/console/lumen/applications?env=local", { returnTo: "/console/lumen/applications?env=local" }],
        [true, "https://outside.example", null],
        [false, "//outside.example", null],
        [undefined, "/\\outside.example", null],
    ])("delivery %s retains only a safe return path (%s)", async (verificationSent, returnTo, expectedState) => {
        publicAxios.post.mockResolvedValue({ data: { verification_sent: verificationSent } });
        render(
            <MemoryRouter initialEntries={[{ pathname: "/register", state: { returnTo } }]}>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        );
        for (const [label, value] of [
            ["First name", "Maya"], ["Last name", "Okafor"], ["Email", "maya@example.test"],
            ["Password", "test-only-password"], ["Confirm password", "test-only-password"],
        ]) {
            fireEvent.change(screen.getByLabelText(label), { target: { value } });
        }
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await screen.findByRole("heading", { name: verificationSent === true ? "Check your email" : "Confirm your email address" });
        fireEvent.click(screen.getByRole("link", { name: SIGN_IN }));
        expect(screen.getByTestId("state")).toHaveTextContent(JSON.stringify(expectedState));
        expect(screen.getByRole("button", { name: SIGN_IN })).toBeInTheDocument();
    });
});

test("missing temporary sign-in state explains restarting the password step without blaming the code", () => {
    mockSessionExpired = true;
    visitLogin({ returnTo: INVITE });
    expect(screen.getByText(/Your temporary sign-in state is missing or expired/)).toHaveTextContent("Enter your password again");
    expect(screen.getByText(/check that your browser allows cookies/)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("6-digit code")).not.toBeInTheDocument();
});
