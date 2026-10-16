import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { BasicAuthProvider } from "../../context/auth/BasicAuthContext";
import { LoginPage } from "./LoginPage";
import { publicAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
    publicAxios: { post: jest.fn() }, logoutSession: jest.fn(),
    SESSION_TRANSPORT: { session_transport: "cookie" }, SESSION_ENDED_EVENT: "test:session-ended",
}));
jest.mock("../../app/queryClient", () => ({ queryClient: { clear: jest.fn() } }));
jest.mock("../../interceptors/tokenStorage", () => ({ persistAuthTokens: jest.fn(), clearAuthTokens: jest.fn() }));

function Destination() {
    return <><p>Signed-in destination</p><Link to="/login" state={{ returnTo: "/console/moneta/applications/app1" }}>Sign in again</Link></>;
}
function setup() {
    render(<MemoryRouter initialEntries={["/login"]}><BasicAuthProvider><Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/workspace" element={<Destination />} />
        <Route path="/account" element={<Destination />} />
    </Routes></BasicAuthProvider></MemoryRouter>);
}
async function passwordStep() {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-only-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
    await screen.findByLabelText("6-digit code");
}
beforeEach(() => {
    jest.clearAllMocks();
    publicAxios.post.mockImplementation((url) => url === "/login/"
        ? Promise.reject({ response: { status: 401, data: { "2fa_required": true } } })
        : Promise.resolve({ data: { access_token: "test-only-access", recovery_codes_remaining: 2 } }));
});

test.each([false, true])("completed MFA clears shared challenge so a later login starts at password (recovery=%s)", async (recovery) => {
    setup();
    await passwordStep();
    if (recovery) {
        fireEvent.click(screen.getByRole("button", { name: "Lost your phone? Use a recovery code" }));
        fireEvent.change(screen.getByLabelText("Recovery code"), { target: { value: "abcde-12345" } });
    } else {
        fireEvent.change(screen.getByLabelText("6-digit code"), { target: { value: "123456" } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Verify", exact: true }));
    await screen.findByText("Signed-in destination");
    fireEvent.click(screen.getByRole("link", { name: "Sign in again" }));
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("6-digit code")).not.toBeInTheDocument();
    expect(publicAxios.post).toHaveBeenCalledTimes(2);
    await passwordStep();
    expect(publicAxios.post).toHaveBeenCalledTimes(3);
    expect(screen.getByLabelText("6-digit code")).toHaveValue("");
});

test("missing temporary context returns the real provider to password without another MFA request", async () => {
    setup();
    await passwordStep();
    publicAxios.post.mockRejectedValueOnce({ response: { status: 400, data: { error: "OTP and temporary token are required." } } });
    fireEvent.change(screen.getByLabelText("6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify", exact: true }));
    await screen.findByLabelText("Password");
    expect(screen.getByText(/temporary sign-in state is missing or expired/)).toBeInTheDocument();
    expect(screen.queryByLabelText("6-digit code")).not.toBeInTheDocument();
    expect(publicAxios.post).toHaveBeenCalledTimes(2);
});
