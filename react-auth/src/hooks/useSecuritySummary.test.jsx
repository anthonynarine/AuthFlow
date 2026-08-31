import { renderHook, waitFor } from "@testing-library/react";
import { useSecuritySummary } from "./useSecuritySummary";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

describe("useSecuritySummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads summary through authAxios and exposes values", async () => {
    authAxios.get.mockResolvedValue({
      data: {
        window_hours: 24,
        successful_logins: 35,
        failed_logins: 1,
        replay_events: 7,
        sessions_revoked: 49,
        active_sessions: 103,
      },
    });

    const { result } = renderHook(() => useSecuritySummary());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledWith("/security/summary/");
    expect(result.current.summary.active_sessions).toBe(103);
    expect(result.current.summary.window_hours).toBe(24);
    expect(result.current.error).toBe(null);
  });

  test("exposes error state", async () => {
    const error = { response: { status: 500 } };
    authAxios.get.mockRejectedValue(error);

    const { result } = renderHook(() => useSecuritySummary());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summary).toBe(null);
    expect(result.current.error).toBe(error);
  });
});
