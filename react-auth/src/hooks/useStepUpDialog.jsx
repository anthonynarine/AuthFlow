import { useCallback, useMemo, useState } from "react";
import { authAxios } from "../interceptors/axios";
import {
  getStepUpFailureMessage,
  getStepUpSuccessMessage,
  getStepUpThrottleMessage,
  getStepUpRequirement,
  isStepUpRequiredError,
  parseRetryAfter,
} from "../utils/stepUpUtils";

const initialState = {
  isOpen: false,
  status: "closed",
  requiredStrength: "password",
  reason: "",
  currentStrength: null,
  authAgeSeconds: null,
  maxAuthAgeSeconds: null,
  operation: null,
  actionLabel: "",
  error: "",
  retryAfterSeconds: null,
  successMessage: "",
};

export function useStepUpDialog() {
  const [state, setState] = useState(initialState);

  const requestStepUp = useCallback((error, actionLabel) => {
    const requirement = getStepUpRequirement(error);

    setState({
      isOpen: true,
      status: "required",
      requiredStrength: requirement.requiredStrength,
      reason: requirement.reason,
      currentStrength: requirement.currentStrength,
      authAgeSeconds: requirement.authAgeSeconds,
      maxAuthAgeSeconds: requirement.maxAuthAgeSeconds,
      operation: requirement.operation,
      actionLabel: actionLabel || requirement.operation || "this action",
      error: "",
      retryAfterSeconds: null,
      successMessage: "",
    });

    return requirement;
  }, []);

  const closeStepUp = useCallback(() => {
    setState(initialState);
  }, []);

  const submitStepUp = useCallback(async ({ currentPassword, otp }) => {
    setState((current) => ({
      ...current,
      status: "submitting",
      error: "",
      retryAfterSeconds: null,
    }));

    try {
      const payload = {
        current_password: currentPassword,
      };

      if (state.requiredStrength === "mfa") {
        payload.otp = otp;
      }

      const { data } = await authAxios.post("/reauthenticate/", payload);

      const successMessage = getStepUpSuccessMessage(state.actionLabel);
      setState((current) => ({
        ...current,
        status: "success",
        error: "",
        retryAfterSeconds: null,
        successMessage: data?.message || successMessage,
      }));

      return { ok: true, data };
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfterSeconds = parseRetryAfter(error.response.headers?.["retry-after"]);
        setState((current) => ({
          ...current,
          status: "throttled",
          error: getStepUpThrottleMessage(retryAfterSeconds),
          retryAfterSeconds,
          successMessage: "",
        }));
        return { ok: false, throttled: true, retryAfterSeconds };
      }

      if (isStepUpRequiredError(error)) {
        const requirement = getStepUpRequirement(error, state.requiredStrength);
        setState((current) => ({
          ...current,
          status: "required",
          requiredStrength: requirement.requiredStrength,
          reason: requirement.reason,
          currentStrength: requirement.currentStrength,
          authAgeSeconds: requirement.authAgeSeconds,
          maxAuthAgeSeconds: requirement.maxAuthAgeSeconds,
          operation: requirement.operation,
          error: "",
          retryAfterSeconds: null,
        }));
        return { ok: false, stepUpRequired: true, requirement };
      }

      const fallbackMessage = getStepUpFailureMessage(state.requiredStrength);
      setState((current) => ({
        ...current,
        status: "failed",
        error: error.response?.data?.error || error.response?.data?.detail || fallbackMessage,
        retryAfterSeconds: null,
        successMessage: "",
      }));
      return { ok: false, error };
    }
  }, [state.actionLabel, state.requiredStrength]);

  const derivedState = useMemo(() => state, [state]);

  return {
    state: derivedState,
    requestStepUp,
    submitStepUp,
    closeStepUp,
  };
}
