import { act, renderHook, waitFor } from "@testing-library/react";
import { useExerciseRunHistory } from "./useExerciseRunHistory";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

const RUN = { id: "run-1", playbook_key: "auth.refresh_token_replay", status: "PASSED" };

describe("useExerciseRunHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads recent run history", async () => {
    authAxios.get.mockResolvedValue({ data: [RUN] });
    const { result } = renderHook(() => useExerciseRunHistory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/runs/");
    expect(result.current.runs).toEqual([RUN]);
    expect(result.current.error).toBe(null);
  });

  test("a refetch failure preserves the last-known runs and flags them stale", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [RUN] });
    const { result } = renderHook(() => useExerciseRunHistory());
    await waitFor(() => expect(result.current.runs).toEqual([RUN]));

    authAxios.get.mockRejectedValueOnce({ response: { status: 500 } });
    await act(async () => {
      await expect(result.current.refetch()).rejects.toBeTruthy();
    });

    expect(result.current.runs).toEqual([RUN]);
    expect(result.current.isStale).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  test("an initial failure with no prior data leaves runs empty, not stale", async () => {
    authAxios.get.mockRejectedValueOnce({ response: { status: 500 } });
    const { result } = renderHook(() => useExerciseRunHistory());

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.runs).toEqual([]);
    expect(result.current.isStale).toBe(false);
  });
});
