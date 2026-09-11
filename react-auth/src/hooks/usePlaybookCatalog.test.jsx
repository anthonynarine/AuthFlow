import { act, renderHook, waitFor } from "@testing-library/react";
import { usePlaybookCatalog } from "./usePlaybookCatalog";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

const PLAYBOOK = { key: "auth.refresh_token_replay", version: 1, title: "Refresh Token Replay" };

describe("usePlaybookCatalog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads the catalog with no filters applied", async () => {
    authAxios.get.mockResolvedValue({ data: [PLAYBOOK] });
    const { result } = renderHook(() => usePlaybookCatalog());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/playbooks/", { params: {} });
    expect(result.current.playbooks).toEqual([PLAYBOOK]);
  });

  test("filter changes translate into the matching query params", async () => {
    authAxios.get.mockResolvedValue({ data: [PLAYBOOK] });
    const { result } = renderHook(() => usePlaybookCatalog());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.updateFilter("category", "AUTHENTICATION");
    });
    await waitFor(() =>
      expect(authAxios.get).toHaveBeenLastCalledWith("/security-exercises/playbooks/", {
        params: { category: "AUTHENTICATION" },
      })
    );

    await act(async () => {
      result.current.updateFilter("executable", true);
    });
    await waitFor(() =>
      expect(authAxios.get).toHaveBeenLastCalledWith("/security-exercises/playbooks/", {
        params: { category: "AUTHENTICATION", executable: "true" },
      })
    );
  });

  test("a refresh failure preserves the last-known catalog and flags it stale", async () => {
    authAxios.get.mockResolvedValueOnce({ data: [PLAYBOOK] });
    const { result } = renderHook(() => usePlaybookCatalog());
    await waitFor(() => expect(result.current.playbooks).toEqual([PLAYBOOK]));

    authAxios.get.mockRejectedValueOnce({ response: { status: 500 } });
    await act(async () => {
      await expect(result.current.refetch()).rejects.toBeTruthy();
    });

    expect(result.current.playbooks).toEqual([PLAYBOOK]);
    expect(result.current.isStale).toBe(true);
    expect(result.current.error).toBeTruthy();
  });
});
