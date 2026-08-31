import { act, renderHook, waitFor } from "@testing-library/react";
import { useSecuritySessionDetail } from "./useSecuritySessionDetail";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

describe("useSecuritySessionDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads session detail and related timeline events through authAxios", async () => {
    authAxios.get
      .mockResolvedValueOnce({
        data: {
          uuid: "session-1",
          user: { email: "staff@example.com" },
          created_at: "2026-08-30T10:00:00Z",
        },
      })
      .mockResolvedValueOnce({
        data: {
          count: 3,
          results: [
            { id: 1, event_type: "TOKEN_REFRESHED" },
            { id: 2, event_type: "REFRESH_REPLAY_DETECTED" },
            { id: 3, event_type: "SESSION_REVOKED" },
          ],
        },
      });

    const { result } = renderHook(() => useSecuritySessionDetail());

    await act(async () => {
      await result.current.fetchSession("session-1");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenNthCalledWith(1, "/security/sessions/session-1/");
    expect(authAxios.get).toHaveBeenNthCalledWith(2, "/security/events/", {
      params: { session: "session-1", page: 1, page_size: 20 },
    });
    expect(result.current.session.uuid).toBe("session-1");
    expect(result.current.timelineEvents).toHaveLength(3);
  });
});
