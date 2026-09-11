import { act, renderHook, waitFor } from "@testing-library/react";
import { useExerciseRunDetail } from "./useExerciseRunDetail";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

function run(overrides = {}) {
  return {
    id: "run-1",
    playbook_key: "auth.refresh_token_replay",
    playbook_version: 1,
    status: "RUNNING",
    ...overrides,
  };
}

describe("useExerciseRunDetail", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    authAxios.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does nothing when no runId is given", () => {
    const { result } = renderHook(() => useExerciseRunDetail(null));
    expect(result.current.run).toBe(null);
    expect(authAxios.get).not.toHaveBeenCalled();
  });

  test("fetches the run once on mount", async () => {
    authAxios.get.mockResolvedValue({ data: run({ status: "PASSED" }) });
    const { result } = renderHook(() => useExerciseRunDetail("run-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/runs/run-1/");
    expect(result.current.run.status).toBe("PASSED");
  });

  test("polls while the run is active and stops once it reaches a terminal status", async () => {
    authAxios.get
      .mockResolvedValueOnce({ data: run({ status: "RUNNING" }) })
      .mockResolvedValueOnce({ data: run({ status: "PASSED" }) });

    const { result } = renderHook(() => useExerciseRunDetail("run-1"));
    await waitFor(() => expect(result.current.run?.status).toBe("RUNNING"));

    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.run?.status).toBe("PASSED"));

    const callsAtTerminal = authAxios.get.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsAtTerminal);
  });

  test("does not poll a run that is already terminal on first load", async () => {
    authAxios.get.mockResolvedValue({ data: run({ status: "DENIED" }) });
    const { result } = renderHook(() => useExerciseRunDetail("run-1"));
    await waitFor(() => expect(result.current.run?.status).toBe("DENIED"));

    const callsAfterLoad = authAxios.get.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsAfterLoad);
  });

  test("a refresh failure preserves the last-known run instead of clearing it", async () => {
    authAxios.get
      .mockResolvedValueOnce({ data: run({ status: "RUNNING" }) })
      .mockRejectedValueOnce({ response: { status: 500 } });

    const { result } = renderHook(() => useExerciseRunDetail("run-1"));
    await waitFor(() => expect(result.current.run?.status).toBe("RUNNING"));

    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });

    expect(result.current.run?.status).toBe("RUNNING");
    expect(result.current.error).toBeTruthy();
  });
});
