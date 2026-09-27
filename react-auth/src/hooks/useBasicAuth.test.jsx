import { renderHook, act } from "@testing-library/react";
import { useBasicAuth } from "./useBasicAuth";
import { logoutSession, publicAxios } from "../interceptors/axios";
import { queryClient } from "../app/queryClient";
import { clearPendingInvite, getPendingInvite, setPendingToken } from "../console/invites/pendingInvite";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("../interceptors/axios", () => ({
    publicAxios: { post: jest.fn() },
    logoutSession: jest.fn(),
    SESSION_TRANSPORT: { session_transport: "cookie" },
}));

jest.mock("../app/queryClient", () => ({
    queryClient: { clear: jest.fn() },
}));

describe("useBasicAuth session transport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("login asks Gait for the refresh token as an HttpOnly cookie", async () => {
        publicAxios.post.mockResolvedValue({ data: { access_token: "a" } });
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.login({ email: "a@b.c", password: "pw" });
        });

        expect(publicAxios.post).toHaveBeenCalledWith("/login/", {
            email: "a@b.c",
            password: "pw",
            session_transport: "cookie",
        });
        expect(result.current.isLoggedIn).toBe(true);
    });

    test("guest login also uses cookie transport", async () => {
        publicAxios.post.mockResolvedValue({ data: { access_token: "a" } });
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.guestLogin();
        });

        expect(publicAxios.post).toHaveBeenCalledWith("/guest-login/", { session_transport: "cookie" });
    });

    test("logout revokes the session and clears every cached query", async () => {
        logoutSession.mockResolvedValue(undefined);
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(logoutSession).toHaveBeenCalledTimes(1);
        expect(queryClient.clear).toHaveBeenCalledTimes(1);
        expect(result.current.isLoggedIn).toBe(false);
    });

    test("the cache is cleared even if the logout request fails", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        logoutSession.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(queryClient.clear).toHaveBeenCalledTimes(1);
        console.error.mockRestore();
    });
});

const SCRIPT_URL = ["javascript", "alert(1)"].join(":");

describe("useBasicAuth returnTo and the pending invite", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearPendingInvite();
        logoutSession.mockResolvedValue(undefined);
    });

    test.each([
        ["/console/invites/accept", "/console/invites/accept"],
        ["/console/app-one/members", "/console/app-one/members"],
        ["//evil.com", "/workspace"],
        ["https://evil.com", "/workspace"],
        [SCRIPT_URL, "/workspace"],
    ])("login with returnTo %s lands on %s", async (returnTo, expected) => {
        publicAxios.post.mockResolvedValue({ data: { access_token: "a" } });
        const { result } = renderHook(() => useBasicAuth());
        await act(async () => {
            await result.current.login({ email: "a@b.c", password: "pw" }, { returnTo });
        });
        expect(mockNavigate).toHaveBeenCalledWith(expected);
    });

    test("a password-only step that needs 2FA doesn't navigate yet", async () => {
        publicAxios.post.mockRejectedValue({ response: { status: 401, data: { "2fa_required": true } } });
        const { result } = renderHook(() => useBasicAuth());
        await act(async () => {
            await result.current.login({ email: "a@b.c", password: "pw" }, { returnTo: "/console/invites/accept" });
        });
        expect(result.current.is2FARequired).toBe(true);
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("Switch account (keepInvite) keeps the invite; an ordinary sign-out forgets it", async () => {
        const { result } = renderHook(() => useBasicAuth());
        setPendingToken("test-only-invite-token");
        await act(async () => {
            await result.current.logout({ keepInvite: true });
        });
        expect(getPendingInvite()).toMatchObject({ token: "test-only-invite-token" });

        await act(async () => {
            await result.current.logout();
        });
        expect(getPendingInvite()).toBeNull();
    });
});

