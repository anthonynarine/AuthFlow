import { act, renderHook, waitFor } from "@testing-library/react";
import { authAxios } from "../interceptors/axios";
import { useExerciseRunExecution } from "./useExerciseRunExecution";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const PAYLOAD = { playbook_key: "auth.refresh_token_replay", playbook_version: 1, environment: "test" };

function runResponse(overrides = {}, status = 201) {
  return {
    status,
    data: {
      id: "run-1",
      playbook_key: "auth.refresh_token_replay",
      playbook_version: 1,
      environment: "test",
      status: "REQUESTED",
      requested_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

/**
 * B-RED1C.1 (Trunks): window.crypto is not implemented at all in this
 * project's jsdom test environment (jsdom 16), so every test that
 * exercises key generation installs its own sequential mock.
 */
function mockUuidSequence(...uuids) {
  const randomUUID = jest.fn();
  uuids.forEach((uuid) => randomUUID.mockReturnValueOnce(uuid));
  window.crypto = { randomUUID };
  return randomUUID;
}

describe("useExerciseRunExecution idempotency", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    authAxios.get.mockReset();
    authAxios.post.mockReset();
    delete window.crypto;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete window.crypto;
  });

  test("a new deliberate submission generates one UUID and sends it as the Idempotency-Key header", async () => {
    const randomUUID = mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse());
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(authAxios.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = authAxios.post.mock.calls[0];
    expect(url).toBe("/security-exercises/runs/");
    expect(body).toEqual(PAYLOAD);
    expect(Object.keys(body).sort()).toEqual(["environment", "playbook_key", "playbook_version"]);
    expect(config).toEqual({ headers: { "Idempotency-Key": "uuid-1" } });
  });

  test("optional target_control_key is still the only extra body field, never a probe/capability/authority field", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse());
    const { result } = renderHook(() => useExerciseRunExecution());

    const payloadWithControl = { ...PAYLOAD, target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION" };
    await act(async () => {
      await result.current.submit(payloadWithControl);
    });

    const [, body] = authAxios.post.mock.calls[0];
    expect(Object.keys(body).sort()).toEqual([
      "environment",
      "playbook_key",
      "playbook_version",
      "target_control_key",
    ]);
    expect(body).not.toHaveProperty("probe_key");
    expect(body).not.toHaveProperty("capability");
    expect(body).not.toHaveProperty("authority");
  });

  test("201 (created) is handled normally", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse({ status: "REQUESTED" }, 201));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.run.id).toBe("run-1");
    expect(result.current.status).toBe("polling");
  });

  test("an idempotent 200 replay is treated as an identical success, not an error or a duplicate", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse({ status: "RUNNING" }, 200));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("polling");
    expect(result.current.submitError).toBeNull();
    expect(result.current.run.status).toBe("RUNNING");
  });

  test("a 200 idempotent replay carrying a terminal PASSED settles immediately without polling", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse({ status: "PASSED" }, 200));
    const onRunSettled = jest.fn();
    const { result } = renderHook(() => useExerciseRunExecution({ onRunSettled }));

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("settled");
    expect(result.current.run.status).toBe("PASSED");
    expect(onRunSettled).toHaveBeenCalledWith(expect.objectContaining({ status: "PASSED" }));
  });

  test("a same-logical-request retry after an ambiguous network failure reuses the exact same key, and does not use the old recent-run GET heuristic", async () => {
    const randomUUID = mockUuidSequence("uuid-1");
    authAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("error");
    // Trunks makes the old best-effort "search recent runs" heuristic
    // unnecessary; a genuine retry now simply re-POSTs with the same key.
    expect(authAxios.get).not.toHaveBeenCalled();

    authAxios.post.mockResolvedValueOnce(runResponse({ status: "REQUESTED" }));
    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(authAxios.post).toHaveBeenCalledTimes(2);
    const [, , firstConfig] = authAxios.post.mock.calls[0];
    const [, , secondConfig] = authAxios.post.mock.calls[1];
    expect(secondConfig.headers["Idempotency-Key"]).toBe(firstConfig.headers["Idempotency-Key"]);
    expect(result.current.status).toBe("polling");
  });

  test("a genuinely new run after reset() gets a brand new key", async () => {
    const randomUUID = mockUuidSequence("uuid-1", "uuid-2");
    authAxios.post.mockResolvedValue(runResponse({ status: "PASSED" }, 201));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });
    expect(randomUUID).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(randomUUID).toHaveBeenCalledTimes(2);
    const keys = authAxios.post.mock.calls.map(([, , config]) => config.headers["Idempotency-Key"]);
    expect(keys[0]).toBe("uuid-1");
    expect(keys[1]).toBe("uuid-2");
    expect(keys[0]).not.toBe(keys[1]);
  });

  test("changing the environment for the next submission (without reset) gets a new key, not a reused one", async () => {
    const randomUUID = mockUuidSequence("uuid-1", "uuid-2");
    authAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });
    expect(result.current.status).toBe("error");

    authAxios.post.mockResolvedValueOnce(runResponse());
    await act(async () => {
      await result.current.submit({ ...PAYLOAD, environment: "staging" });
    });

    expect(randomUUID).toHaveBeenCalledTimes(2);
    const keys = authAxios.post.mock.calls.map(([, , config]) => config.headers["Idempotency-Key"]);
    expect(keys[0]).not.toBe(keys[1]);
  });

  test("changing the target control for the next submission (without reset) gets a new key", async () => {
    const randomUUID = mockUuidSequence("uuid-1", "uuid-2");
    authAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useExerciseRunExecution());

    const withControl = { ...PAYLOAD, target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION" };
    await act(async () => {
      await result.current.submit(withControl);
    });
    expect(result.current.status).toBe("error");

    authAxios.post.mockResolvedValueOnce(runResponse());
    await act(async () => {
      await result.current.submit({ ...withControl, target_control_key: "GAIT.AUTH.STEP_UP_ENFORCEMENT" });
    });

    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  test("a rapid double-click generates only one key and one POST", async () => {
    const randomUUID = mockUuidSequence("uuid-1", "uuid-2");
    let resolvePost;
    authAxios.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = () => resolve(runResponse());
      })
    );
    const { result } = renderHook(() => useExerciseRunExecution());

    act(() => {
      result.current.submit(PAYLOAD);
      result.current.submit(PAYLOAD);
    });

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(authAxios.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePost();
      await Promise.resolve();
    });
  });

  test("does not auto-retry the POST after a network-level failure -- the same key just sits ready for an explicit retry", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(authAxios.post).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("error");

    await act(async () => {
      jest.advanceTimersByTime(20000);
    });
    expect(authAxios.post).toHaveBeenCalledTimes(1);
  });

  test("a 409 IDEMPOTENCY_KEY_CONFLICT is surfaced safely, and never silently resubmitted", async () => {
    const randomUUID = mockUuidSequence("uuid-1", "uuid-2");
    authAxios.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: "IDEMPOTENCY_KEY_CONFLICT", detail: "This idempotency key was already used for a different request." },
      },
    });
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.submitError.response.data.error).toBe("IDEMPOTENCY_KEY_CONFLICT");
    // No automatic resubmission happened.
    expect(authAxios.post).toHaveBeenCalledTimes(1);

    // A conflicted key is poisoned -- the next explicit attempt (even with
    // the identical payload) must mint a fresh key, not reuse the doomed one.
    authAxios.post.mockResolvedValueOnce(runResponse());
    await act(async () => {
      await result.current.submit(PAYLOAD);
    });
    expect(randomUUID).toHaveBeenCalledTimes(2);
    const keys = authAxios.post.mock.calls.map(([, , config]) => config.headers["Idempotency-Key"]);
    expect(keys[0]).not.toBe(keys[1]);
  });

  test("a 400 IDEMPOTENCY_KEY_REQUIRED is surfaced safely and never silently falls back to a headerless POST", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: "IDEMPOTENCY_KEY_REQUIRED", detail: "Idempotency-Key header is required." } },
    });
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.submitError.response.data.error).toBe("IDEMPOTENCY_KEY_REQUIRED");
    // Only ever one attempt, and it always carried a header -- this is a
    // diagnostic surface, never a trigger to retry without one.
    expect(authAxios.post).toHaveBeenCalledTimes(1);
    expect(authAxios.post.mock.calls[0][2].headers["Idempotency-Key"]).toBe("uuid-1");
  });

  test("a 400 IDEMPOTENCY_KEY_INVALID is surfaced safely", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: "IDEMPOTENCY_KEY_INVALID", detail: "Idempotency-Key must be a UUID." } },
    });
    const { result } = renderHook(() => useExerciseRunExecution());

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.submitError.response.data.error).toBe("IDEMPOTENCY_KEY_INVALID");
  });

  test("an active run polls on an interval and a terminal run stops polling (unaffected by the key change)", async () => {
    mockUuidSequence("uuid-1");
    authAxios.post.mockResolvedValue(runResponse({ status: "RUNNING" }));
    authAxios.get
      .mockResolvedValueOnce(runResponse({ status: "RUNNING" }))
      .mockResolvedValueOnce(runResponse({ status: "PASSED", result_summary: "held" }));

    const onRunSettled = jest.fn();
    const { result } = renderHook(() => useExerciseRunExecution({ onRunSettled }));

    await act(async () => {
      await result.current.submit(PAYLOAD);
    });
    expect(result.current.status).toBe("polling");

    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/runs/run-1/");
    expect(result.current.run.status).toBe("RUNNING");

    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.status).toBe("settled"));
    expect(result.current.run.status).toBe("PASSED");
    expect(onRunSettled).toHaveBeenCalledWith(expect.objectContaining({ status: "PASSED" }));

    const callsBeforeMoreTime = authAxios.get.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(authAxios.get.mock.calls.length).toBe(callsBeforeMoreTime);
  });
});
