import { renderHook, act } from "@testing-library/react";
import { useUserSession } from "./useUserSession";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
    authAxios: { get: jest.fn() },
}));

const mockServices = { setUser: jest.fn(), setIsLoggedIn: jest.fn(), setMessage: jest.fn() };
jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => mockServices,
}));

// GAIT-SEC-035/036: a failed session check must not log the bearer token.
test("a failed session validation logs a sanitized summary only", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    authAxios.get.mockRejectedValue({
        code: "ERR_BAD_REQUEST",
        config: {
            method: "get",
            url: "/validate-session/?token=query-SECRET",
            headers: { Authorization: "Bearer access-SECRET" },
        },
        response: { status: 401, data: { detail: "expired" } },
    });
    const { result } = renderHook(() => useUserSession());

    await act(async () => {
        await result.current.validateSession();
    });

    expect(errorSpy.mock.calls).toEqual([["Session validation failed: GET /validate-session/, status 401, code ERR_BAD_REQUEST"]]);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toMatch(/SECRET|Bearer|token=/);
    errorSpy.mockRestore();
});
