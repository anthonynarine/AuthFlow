import { act, renderHook, waitFor } from "@testing-library/react";
import { useSecurityEvents } from "./useSecurityEvents";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

const eventResponse = {
  data: {
    count: 2,
    next: "next",
    previous: null,
    results: [
      {
        id: 1,
        event_type: "LOGIN_SUCCESS",
        severity: "INFO",
        outcome: "SUCCESS",
      },
      {
        id: 2,
        event_type: "REFRESH_REPLAY_DETECTED",
        severity: "HIGH",
        outcome: "DENIED",
      },
    ],
  },
};

describe("useSecurityEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authAxios.get.mockResolvedValue(eventResponse);
  });

  test("loads paginated events", async () => {
    const { result } = renderHook(() => useSecurityEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledWith("/security/events/", {
      params: { page: 1, page_size: 25 },
    });
    expect(result.current.events).toHaveLength(2);
    expect(result.current.count).toBe(2);
  });

  test("event type, severity, outcome, and page changes request backend params", async () => {
    const { result } = renderHook(() => useSecurityEvents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.updateFilter("event_type", "LOGIN_FAILURE");
    });
    await waitFor(() => expect(authAxios.get).toHaveBeenLastCalledWith("/security/events/", {
      params: { page: 1, page_size: 25, event_type: "LOGIN_FAILURE" },
    }));

    await act(async () => {
      result.current.updateFilter("severity", "HIGH");
    });
    await waitFor(() => expect(authAxios.get).toHaveBeenLastCalledWith("/security/events/", {
      params: { page: 1, page_size: 25, event_type: "LOGIN_FAILURE", severity: "HIGH" },
    }));

    await act(async () => {
      result.current.updateFilter("outcome", "DENIED");
    });
    await waitFor(() => expect(authAxios.get).toHaveBeenLastCalledWith("/security/events/", {
      params: {
        page: 1,
        page_size: 25,
        event_type: "LOGIN_FAILURE",
        severity: "HIGH",
        outcome: "DENIED",
      },
    }));

    await act(async () => {
      result.current.setPage(2);
    });
    await waitFor(() => expect(authAxios.get).toHaveBeenLastCalledWith("/security/events/", {
      params: {
        page: 2,
        page_size: 25,
        event_type: "LOGIN_FAILURE",
        severity: "HIGH",
        outcome: "DENIED",
      },
    }));
  });
});
