import { renderHook, waitFor } from "@testing-library/react";
import {
  useSecurityLearningIndex,
  fetchLearningTopic,
  __resetSecurityLearningCacheForTests,
} from "./useSecurityLearning";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

describe("useSecurityLearningIndex", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityLearningCacheForTests();
  });

  test("loads the bounded learning index once and exposes it", async () => {
    authAxios.get.mockResolvedValue({
      data: [
        { key: "access_token", title: "Access Token", category: "Authentication & Sessions" },
        { key: "security_posture", title: "Security Posture", category: "Security Truth" },
      ],
    });

    const { result } = renderHook(() => useSecurityLearningIndex());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledWith("/security/learning/");
    expect(result.current.topics).toHaveLength(2);
    expect(result.current.error).toBe(null);
  });

  test("fetches the index only once across multiple hook instances", async () => {
    authAxios.get.mockResolvedValue({ data: [{ key: "access_token", title: "Access Token" }] });

    const first = renderHook(() => useSecurityLearningIndex());
    const second = renderHook(() => useSecurityLearningIndex());

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledTimes(1);
    expect(second.result.current.topics).toHaveLength(1);
  });

  test("does not throw on index failure and leaves the catalog empty with an error", async () => {
    const error = { response: { status: 500 } };
    authAxios.get.mockRejectedValue(error);

    const { result } = renderHook(() => useSecurityLearningIndex());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.topics).toEqual([]);
  });
});

describe("fetchLearningTopic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityLearningCacheForTests();
  });

  test("fetches one topic by key from the detail endpoint", async () => {
    authAxios.get.mockResolvedValue({ data: { key: "refresh_token", title: "Refresh Token" } });

    const topic = await fetchLearningTopic("refresh_token");

    expect(authAxios.get).toHaveBeenCalledWith("/security/learning/refresh_token/");
    expect(topic).toEqual({ key: "refresh_token", title: "Refresh Token" });
  });

  test("caches a topic by key so reopening the same topic does not refetch", async () => {
    authAxios.get.mockResolvedValue({ data: { key: "refresh_token", title: "Refresh Token" } });

    await fetchLearningTopic("refresh_token");
    await fetchLearningTopic("refresh_token");

    expect(authAxios.get).toHaveBeenCalledTimes(1);
  });

  test("dedupes concurrent in-flight requests for the same key", async () => {
    let resolveRequest;
    authAxios.get.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const first = fetchLearningTopic("token_family");
    const second = fetchLearningTopic("token_family");
    resolveRequest({ data: { key: "token_family", title: "Refresh Token Family" } });

    await Promise.all([first, second]);
    expect(authAxios.get).toHaveBeenCalledTimes(1);
  });

  test("fetches different keys independently", async () => {
    authAxios.get.mockImplementation((url) =>
      Promise.resolve({ data: { key: url, title: "x" } })
    );

    await fetchLearningTopic("a");
    await fetchLearningTopic("b");

    expect(authAxios.get).toHaveBeenCalledTimes(2);
  });

  test("rejects and does not cache on failure, so a retry can succeed", async () => {
    authAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(fetchLearningTopic("unknown_topic")).rejects.toBeTruthy();

    authAxios.get.mockResolvedValueOnce({ data: { key: "unknown_topic", title: "Now Exists" } });
    const topic = await fetchLearningTopic("unknown_topic");
    expect(topic).toEqual({ key: "unknown_topic", title: "Now Exists" });
  });

  test("rejects immediately for a missing topic key without a network call", async () => {
    await expect(fetchLearningTopic(undefined)).rejects.toBeTruthy();
    expect(authAxios.get).not.toHaveBeenCalled();
  });
});
