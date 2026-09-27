import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const mockLogin = jest.fn();
const mockVerify2FA = jest.fn();
let mockIs2FARequired = false;

jest.mock("../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ login: mockLogin, is2FARequired: mockIs2FARequired, error: null, isLoading: false }),
}));
jest.mock("../../hooks/useTwoFactorAuth", () => ({
    useTwoFactorAuth: () => ({ verify2FA: mockVerify2FA, twoFactorError: null }),
}));

const SIGN_IN = "Sign in";

function visitLogin(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
            <LoginPage />
        </MemoryRouter>
    );
}

beforeEach(() => {
    mockIs2FARequired = false;
    mockLogin.mockImplementation(() => Promise.resolve());
    mockVerify2FA.mockImplementation(() => Promise.resolve());
});

test("the password step carries returnTo from the invite page", async () => {
    visitLogin({ returnTo: "/console/invites/accept" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "b@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: SIGN_IN }));
    await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ email: "b@example.test" }), { returnTo: "/console/invites/accept" })
    );
});

test("returnTo survives the two-factor step", async () => {
    mockIs2FARequired = true;
    visitLogin({ returnTo: "/console/invites/accept" });
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(mockVerify2FA).toHaveBeenCalledWith(expect.anything(), { returnTo: "/console/invites/accept" }));
});
