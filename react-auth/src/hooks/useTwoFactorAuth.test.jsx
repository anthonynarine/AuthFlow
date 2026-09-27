import { renderHook, act } from "@testing-library/react";
import { useTwoFactorAuth } from "./useTwoFactorAuth";
import { authAxios, publicAxios } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

const mockNavigate = jest.fn();
const mockSetIsLoggedIn = jest.fn();
const mockSetUser = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("../interceptors/axios", () => ({
    authAxios: { post: jest.fn(), patch: jest.fn(), get: jest.fn() },
    publicAxios: { post: jest.fn() },
    SESSION_TRANSPORT: { session_transport: "cookie" },
}));

jest.mock("../interceptors/tokenStorage", () => ({
    persistAuthTokens: jest.fn(),
}));

jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({
        setIsLoggedIn: mockSetIsLoggedIn,
        setUser: mockSetUser,
    }),
}));

describe("useTwoFactorAuth session transport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("2FA login asks for cookie transport and keeps only the access token", async () => {
        publicAxios.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-2fa" },
        });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.verify2FA("123456");
        });

        expect(publicAxios.post).toHaveBeenCalledWith(
            "/two-factor-login/",
            { otp: "123456", session_transport: "cookie" },
            { withCredentials: true }
        );
        expect(authAxios.post).not.toHaveBeenCalled();
        expect(persistAuthTokens).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "access-2fa" }));
        expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith("/workspace");
    });

    test("2FA setup (E3) uses the cookie session: no refresh token is read from the body", async () => {
        authAxios.patch.mockResolvedValue({ data: { is_2fa_enabled: false, is_2fa_setup_in_progress: true } });
        authAxios.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-setup", refresh_token: "must-not-be-used" },
        });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.toggle2fa(true);
        });
        await act(async () => {
            await result.current.verify2FA("654321");
        });

        expect(authAxios.post).toHaveBeenCalledWith(
            "/verify-otp/",
            { otp: "654321", session_transport: "cookie" },
            { withCredentials: true }
        );
        expect(persistAuthTokens).toHaveBeenCalledWith({ accessToken: "access-setup" });
        expect(JSON.stringify(persistAuthTokens.mock.calls)).not.toContain("must-not-be-used");
    });
});

const SCRIPT_URL = ["javascript", "alert(1)"].join(":");

describe("useTwoFactorAuth returnTo", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        publicAxios.post.mockResolvedValue({ status: 200, data: { access_token: "access-2fa" } });
    });

    test("after the one-time code, an allowed returnTo is where they land", async () => {
        const { result } = renderHook(() => useTwoFactorAuth());
        await act(async () => {
            await result.current.verify2FA("123456", { returnTo: "/console/invites/accept" });
        });
        expect(mockNavigate).toHaveBeenCalledWith("/console/invites/accept");
    });

    test.each(["//evil.com", "/\\evil.com", "https://evil.com", SCRIPT_URL])(
        "an unsafe returnTo (%s) falls back to the workspace",
        async (returnTo) => {
            const { result } = renderHook(() => useTwoFactorAuth());
            await act(async () => {
                await result.current.verify2FA("123456", { returnTo });
            });
            expect(mockNavigate).toHaveBeenCalledWith("/workspace");
        }
    );
});
