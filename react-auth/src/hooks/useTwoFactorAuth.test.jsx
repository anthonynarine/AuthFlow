import { renderHook, act } from "@testing-library/react";
import { useTwoFactorAuth } from "./useTwoFactorAuth";
import { authAxios, publicAxios } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

const mockNavigate = jest.fn();
const mockSetIsLoggedIn = jest.fn();
const mockCancelTwoFactor = jest.fn();

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
        cancelTwoFactor: mockCancelTwoFactor,
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

    test("a recovery code signs in instead of the code, and lands on Account with how many are left", async () => {
        publicAxios.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-recovery", recovery_codes_remaining: 2 },
        });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.verify2FA("  abcde-12345 ", { returnTo: "/console/invites/accept", recovery: true });
        });

        expect(publicAxios.post).toHaveBeenCalledWith(
            "/two-factor-login/",
            { recovery_code: "abcde-12345", session_transport: "cookie" },
            { withCredentials: true }
        );
        expect(persistAuthTokens).toHaveBeenCalledWith({ accessToken: "access-recovery" });
        expect(mockNavigate).toHaveBeenCalledWith("/account", {
            state: { notice: expect.stringContaining("You have 2 recovery codes left.") },
        });
    });

    test("a wrong recovery code says so and keeps them on the code step", async () => {
        publicAxios.post.mockRejectedValue({ response: { status: 403, data: { detail: "Authentication failed." } } });
        const { result } = renderHook(() => useTwoFactorAuth());
        await act(async () => {
            await result.current.verify2FA("abcde-12345", { recovery: true });
        });
        expect(result.current.twoFactorError).toBe("That recovery code didn't work. Check it, or try another one. Each works only once.");
        expect(result.current.sessionExpired).toBe(false);
        expect(mockCancelTwoFactor).not.toHaveBeenCalled();
    });

    test("a spent or expired sign-in (401) goes back to the password step", async () => {
        publicAxios.post.mockRejectedValue({ response: { status: 401, data: { error: "Invalid temporary token." } } });
        const { result } = renderHook(() => useTwoFactorAuth());
        await act(async () => {
            await result.current.verify2FA("123456");
        });
        expect(result.current.sessionExpired).toBe(true);
        expect(mockCancelTwoFactor).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled();
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
