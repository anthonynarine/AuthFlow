import { act, renderHook, waitFor } from "@testing-library/react";
import { useSecurityFindingRecommendation } from "./useSecurityFindingRecommendation";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

function recommendation(overrides = {}) {
  return {
    id: "rec-1",
    status: "ACCEPTED",
    recommendation_type: "INVESTIGATE",
    scope: "FINDING",
    scope_reference: "finding-1",
    finding_ids: ["finding-1"],
    title: "Investigate refresh replay",
    generated_at: "2026-09-12T10:00:00Z",
    commander_handoff: { id: "handoff-1", status: "REQUESTED" },
    ...overrides,
  };
}

describe("useSecurityFindingRecommendation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    authAxios.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does nothing when no findingId is given", () => {
    const { result } = renderHook(() => useSecurityFindingRecommendation(null));
    expect(result.current.recommendation).toBe(null);
    expect(authAxios.get).not.toHaveBeenCalled();
  });

  test("fetches the list and derives the recommendation matching the finding", async () => {
    authAxios.get.mockResolvedValue({
      data: [recommendation({ id: "other", scope_reference: "finding-2", finding_ids: ["finding-2"] }), recommendation()],
    });

    const { result } = renderHook(() => useSecurityFindingRecommendation("finding-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledWith("/security/strategy/recommendations/");
    expect(result.current.recommendation.id).toBe("rec-1");
  });

  test("picks the most recently generated recommendation when more than one matches", async () => {
    authAxios.get.mockResolvedValue({
      data: [
        recommendation({ id: "older", generated_at: "2026-09-01T00:00:00Z", commander_handoff: null }),
        recommendation({ id: "newer", generated_at: "2026-09-10T00:00:00Z", commander_handoff: null }),
      ],
    });

    const { result } = renderHook(() => useSecurityFindingRecommendation("finding-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recommendation.id).toBe("newer");
  });

  test("polls while the handoff is REQUESTED and stops once it reaches a terminal status", async () => {
    authAxios.get
      .mockResolvedValueOnce({ data: [recommendation({ commander_handoff: { id: "h", status: "REQUESTED" } })] })
      .mockResolvedValueOnce({
        data: [recommendation({ status: "HANDED_OFF", commander_handoff: { id: "h", status: "COMPLETED" } })],
      });

    const { result } = renderHook(() => useSecurityFindingRecommendation("finding-1"));
    await waitFor(() => expect(result.current.recommendation?.commander_handoff?.status).toBe("REQUESTED"));

    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.recommendation?.commander_handoff?.status).toBe("COMPLETED"));

    const callsAtTerminal = authAxios.get.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsAtTerminal);
  });

  test("does not poll when there is no recommendation, or it has no pending handoff", async () => {
    authAxios.get.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useSecurityFindingRecommendation("finding-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsAfterLoad = authAxios.get.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsAfterLoad);
  });

  test("cleans up its polling interval on unmount", async () => {
    authAxios.get.mockResolvedValue({ data: [recommendation({ commander_handoff: { id: "h", status: "REQUESTED" } })] });
    const { result, unmount } = renderHook(() => useSecurityFindingRecommendation("finding-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBeforeUnmount = authAxios.get.mock.calls.length;
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(20000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
