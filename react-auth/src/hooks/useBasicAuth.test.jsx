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

test("signing out after a two-step sign-in doesn't leave sign-in on the code step", async () => {
    publicAxios.post.mockRejectedValue({ response: { status: 401, data: { "2fa_required": true } } });
    logoutSession.mockResolvedValue(undefined);
    const { result } = renderHook(() => useBasicAuth());
    await act(async () => {
        await result.current.login({ email: "a@b.c", password: "pw" });
    });
    expect(result.current.is2FARequired).toBe(true);
    await act(async () => {
        await result.current.logout();
    });
    expect(result.current.is2FARequired).toBe(false);
});

// GAIT-SEC-035/036: a failed sign-in must not put credentials in the console.
describe("useBasicAuth failure logging", () => {
    let errorSpy;

    function credentialLadenError(status) {
        return {
            code: "ERR_BAD_REQUEST",
            message: "Request failed for pw-SECRET-123",
            config: {
                method: "post",
                baseURL: "https://api.example.test/api",
                url: "/login/?next=%2Fconsole&token=query-SECRET",
                headers: { Authorization: "Bearer access-SECRET", "X-CSRFToken": "csrf-SECRET" },
                data: JSON.stringify({ email: "person@example.test", password: "pw-SECRET-123" }),
            },
            response: { status, data: { error: "Invalid credentials", access_token: "resp-SECRET" } },
        };
    }

    function assertNothingSecretLogged() {
        const logged = JSON.stringify(errorSpy.mock.calls);
        for (const secret of ["pw-SECRET-123", "Bearer", "access-SECRET", "csrf-SECRET", "query-SECRET",
            "token=", "?", "person@example.test", "resp-SECRET", "Authorization", "password\""]) {
            expect(logged).not.toContain(secret);
        }
    }

    beforeEach(() => {
        jest.clearAllMocks();
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    test("a failed login logs a sanitized summary only", async () => {
        publicAxios.post.mockRejectedValue(credentialLadenError(400));
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.login({ email: "person@example.test", password: "pw-SECRET-123" });
        });

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0][0]).toBe("Login failed: POST /api/login/, status 400, code ERR_BAD_REQUEST");
        assertNothingSecretLogged();
    });

    test("guest login, logout and forgot-password failures log no secrets either", async () => {
        publicAxios.post.mockRejectedValue(credentialLadenError(500));
        logoutSession.mockRejectedValue(credentialLadenError(500));
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.guestLogin();
            await result.current.logout();
            await result.current.forgotPassword("person@example.test");
        });

        expect(errorSpy).toHaveBeenCalledTimes(3);
        assertNothingSecretLogged();
    });
});
