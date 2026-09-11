import { act, renderHook, waitFor } from "@testing-library/react";
import { authAxios } from "../interceptors/axios";
import { useSecurityCaseSnapshot } from "./useSecurityCaseSnapshot";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

const SNAPSHOT_POLL_INTERVAL_MS = 8000;

function snapshotResponse(overrides = {}) {
  return { data: { snapshot: { current_state_label: "Investigating", ...overrides } } };
}

/**
 * B-UX2: an immediate refetch triggered by an operational Copilot response
 * must supplement polling, not replace it -- and a refetch failure must
 * never clear the last-known trusted snapshot.
 */
describe("useSecurityCaseSnapshot", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    authAxios.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("polling continues on its normal interval after a manual immediate refetch", async () => {
    authAxios.get.mockResolvedValue(snapshotResponse());

    const { result } = renderHook(() => useSecurityCaseSnapshot("case-1"));

    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    expect(authAxios.get).toHaveBeenCalledTimes(1);

    // Simulate the immediate refresh triggered right after an operational
    // Copilot response -- e.g. action_status === "DISPATCHED".
    await act(async () => {
      await result.current.refetch({ silent: true });
    });
    expect(authAxios.get).toHaveBeenCalledTimes(2);

    // Normal polling must still fire afterward, on schedule.
    await act(async () => {
      jest.advanceTimersByTime(SNAPSHOT_POLL_INTERVAL_MS);
    });
    await waitFor(() => expect(authAxios.get).toHaveBeenCalledTimes(3));
  });

  test("a failed immediate refetch keeps the last-known snapshot and flags it stale, without throwing", async () => {
    authAxios.get.mockResolvedValueOnce(snapshotResponse({ current_state_label: "Awaiting deployment approval" }));

    const { result } = renderHook(() => useSecurityCaseSnapshot("case-1"));

    await waitFor(() => expect(result.current.snapshot?.current_state_label).toBe("Awaiting deployment approval"));

    authAxios.get.mockRejectedValueOnce({ response: { status: 500 } });

    await act(async () => {
      await expect(result.current.refetch({ silent: true })).rejects.toBeTruthy();
    });

    // The previous trusted snapshot is preserved verbatim -- not cleared,
    // not replaced with a fabricated CONTROL_FAILURE-style state.
    expect(result.current.snapshot?.current_state_label).toBe("Awaiting deployment approval");
    expect(result.current.isStale).toBe(true);
  });
});
