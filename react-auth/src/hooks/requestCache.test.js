import { cachedGet, invalidateCached, __clearRequestCacheForTests } from "./requestCache";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  __clearRequestCacheForTests();
});

describe("cachedGet — request de-duplication", () => {
  test("two concurrent calls for the same URL only hit the network once", async () => {
    let resolveRequest;
    authAxios.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const first = cachedGet("/security/cases/case-1/workflow/snapshot/");
    const second = cachedGet("/security/cases/case-1/workflow/snapshot/");

    resolveRequest({ data: { snapshot: { current_state: "INVESTIGATING" } } });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(authAxios.get).toHaveBeenCalledTimes(1);
    expect(firstResult.data).toEqual(secondResult.data);
  });

  test("different URLs are never conflated", async () => {
    authAxios.get.mockResolvedValueOnce({ data: { snapshot: { case: "one" } } });
    authAxios.get.mockResolvedValueOnce({ data: { snapshot: { case: "two" } } });

    const one = await cachedGet("/security/cases/case-1/workflow/snapshot/");
    const two = await cachedGet("/security/cases/case-2/workflow/snapshot/");

    expect(authAxios.get).toHaveBeenCalledTimes(2);
    expect(one.data.snapshot.case).toBe("one");
    expect(two.data.snapshot.case).toBe("two");
  });
});

describe("cachedGet — short-TTL freshness", () => {
  test("a second call within the TTL window reuses the cached value without a new request", async () => {
    authAxios.get.mockResolvedValueOnce({ data: { value: "fresh" } });

    await cachedGet("/security/findings/", { ttlMs: 10000 });
    const second = await cachedGet("/security/findings/", { ttlMs: 10000 });

    expect(authAxios.get).toHaveBeenCalledTimes(1);
    expect(second.data.value).toBe("fresh");
  });

  test("bypassCache always forces a real network call, never serving stale security truth", async () => {
    authAxios.get.mockResolvedValueOnce({ data: { value: "first" } });
    authAxios.get.mockResolvedValueOnce({ data: { value: "second" } });

    await cachedGet("/security/findings/");
    const forced = await cachedGet("/security/findings/", { bypassCache: true });

    expect(authAxios.get).toHaveBeenCalledTimes(2);
    expect(forced.data.value).toBe("second");
  });

  test("invalidateCached drops matching entries so the next read is real", async () => {
    authAxios.get.mockResolvedValueOnce({ data: { value: "first" } });
    authAxios.get.mockResolvedValueOnce({ data: { value: "second" } });

    await cachedGet("/security/cases/case-1/workflow/snapshot/");
    invalidateCached("/security/cases/case-1/");
    const afterInvalidate = await cachedGet("/security/cases/case-1/workflow/snapshot/");

    expect(authAxios.get).toHaveBeenCalledTimes(2);
    expect(afterInvalidate.data.value).toBe("second");
  });

  test("an expired entry (TTL elapsed) is refetched, not served stale", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    authAxios.get.mockResolvedValueOnce({ data: { value: "first" } });
    authAxios.get.mockResolvedValueOnce({ data: { value: "second" } });

    await cachedGet("/security/findings/", { ttlMs: 1000 });
    jest.advanceTimersByTime(1500);
    const afterExpiry = await cachedGet("/security/findings/", { ttlMs: 1000 });

    expect(authAxios.get).toHaveBeenCalledTimes(2);
    expect(afterExpiry.data.value).toBe("second");
    jest.useRealTimers();
  });
});
