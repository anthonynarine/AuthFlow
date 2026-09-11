import { useCallback, useEffect, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { isActiveRunStatus } from "../components/security-exercises/securityExerciseLabels";

const POLL_INTERVAL_MS = 4000;

function generateIdempotencyKey() {
  return window.crypto.randomUUID();
}

function isSameLogicalRequest(a, b) {
  if (!a || !b) {
    return false;
  }
  return (
    a.playbook_key === b.playbook_key &&
    a.playbook_version === b.playbook_version &&
    a.environment === b.environment &&
    (a.target_control_key || "") === (b.target_control_key || "")
  );
}

/**
 * Owns one governed Security Exercise run request end to end: submission,
 * REQUESTED -> terminal polling, and cleanup.
 *
 * Idempotency key lifecycle (B-RED1C.1 -- Trunks): the key belongs to one
 * logical exercise submission, not to an individual HTTP attempt. It is
 * generated once (`crypto.randomUUID()`) and held in `lastRequestRef` for
 * the life of that submission -- across re-renders, a timed-out/ambiguous
 * POST, and an explicit "Try again" click -- as long as the retried
 * request is identical (same playbook/version/environment/target
 * control). Changing any of those fields, or the submission settling and
 * the modal closing (`reset()`), starts a new logical submission and
 * mints a new key. Trunks makes a same-key retry deterministic on the
 * backend (201 if the first attempt never arrived, 200 with the original
 * run if it did), so this hook no longer needs to guess via a recent-run
 * time-window heuristic -- the old `tryRecoverRun` approach is removed.
 *
 * B-RED1C section 31/32 still holds: never auto-retries the execution
 * POST. A `submittingRef` guard (not just disabled-button state) makes a
 * double-click physically unable to fire a second POST -- and therefore
 * unable to mint a second key -- since React state updates that would
 * disable the button are not synchronous with the click handler.
 */
export function useExerciseRunExecution({ onRunSettled } = {}) {
  const [run, setRun] = useState(null);
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);
  const pollTimerRef = useRef(null);
  // { key, payload } for the current logical submission -- survives
  // retries of the same request, cleared on reset() or an
  // IDEMPOTENCY_KEY_CONFLICT (a poisoned key must never be reused).
  const lastRequestRef = useRef(null);
  const onRunSettledRef = useRef(onRunSettled);
  onRunSettledRef.current = onRunSettled;

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollRun = useCallback(
    async (runId) => {
      try {
        const { data } = await authAxios.get(`/security-exercises/runs/${runId}/`);
        setRun(data);
        setSubmitError(null);
        if (!isActiveRunStatus(data.status)) {
          clearPoll();
          setStatus("settled");
          onRunSettledRef.current?.(data);
        }
      } catch (pollError) {
        // Keep the last-known run on screen; a transient status-refresh
        // failure must not blank a run that is actually executing.
        setSubmitError(pollError);
      }
    },
    [clearPoll]
  );

  const startPolling = useCallback(
    (runId) => {
      clearPoll();
      pollTimerRef.current = window.setInterval(() => {
        pollRun(runId).catch(() => {});
      }, POLL_INTERVAL_MS);
    },
    [clearPoll, pollRun]
  );

  const settleOrPoll = useCallback(
    (createdRun) => {
      setRun(createdRun);
      if (isActiveRunStatus(createdRun.status)) {
        setStatus("polling");
        startPolling(createdRun.id);
      } else {
        setStatus("settled");
        onRunSettledRef.current?.(createdRun);
      }
    },
    [startPolling]
  );

  const submit = useCallback(
    async (payload) => {
      if (submittingRef.current) {
        return;
      }
      submittingRef.current = true;
      setStatus("submitting");
      setSubmitError(null);

      const reusingKey = isSameLogicalRequest(lastRequestRef.current?.payload, payload);
      const idempotencyKey = reusingKey ? lastRequestRef.current.key : generateIdempotencyKey();
      lastRequestRef.current = { key: idempotencyKey, payload };

      try {
        const { data } = await authAxios.post("/security-exercises/runs/", payload, {
          headers: { "Idempotency-Key": idempotencyKey },
        });
        // Both 201 (created) and 200 (idempotent replay of an existing
        // run) are the same successful logical outcome -- neither is
        // treated as an error or a duplicate.
        settleOrPoll(data);
      } catch (postError) {
        const errorCode = postError.response?.data?.error;
        if (errorCode === "IDEMPOTENCY_KEY_CONFLICT") {
          // This key is now confirmed poisoned against a different
          // logical request server-side. Never resubmit with it --
          // dropping it here means the *next explicit* user action
          // mints a fresh key, rather than silently retrying behind
          // the user's back.
          lastRequestRef.current = null;
        }
        setSubmitError(postError);
        setStatus("error");
      } finally {
        submittingRef.current = false;
      }
    },
    [settleOrPoll]
  );

  const reset = useCallback(() => {
    clearPoll();
    submittingRef.current = false;
    lastRequestRef.current = null;
    setRun(null);
    setStatus("idle");
    setSubmitError(null);
  }, [clearPoll]);

  useEffect(() => clearPoll, [clearPoll]);

  return {
    run,
    status,
    submitError,
    submit,
    reset,
    isSubmitting: status === "submitting",
    isPolling: status === "polling",
  };
}
