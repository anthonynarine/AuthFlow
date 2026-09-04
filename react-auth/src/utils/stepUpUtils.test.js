import { isStepUpRequiredError, getStepUpRequirement, parseRetryAfter, formatRetryAfter } from "./stepUpUtils";

describe("stepUpUtils", () => {
  test("detects step-up-required responses and parses the backend requirement shape", () => {
    const error = {
      response: {
        status: 403,
        data: {
          code: "STEP_UP_REQUIRED",
          reason: "MFA_REQUIRED",
          required_strength: "mfa",
          current_strength: "password",
          auth_age_seconds: 601,
          max_auth_age_seconds: 600,
          operation: "disabling two-factor authentication",
        },
      },
    };

    expect(isStepUpRequiredError(error)).toBe(true);
    expect(getStepUpRequirement(error)).toEqual({
      code: "STEP_UP_REQUIRED",
      reason: "MFA_REQUIRED",
      requiredStrength: "mfa",
      currentStrength: "password",
      authAgeSeconds: 601,
      maxAuthAgeSeconds: 600,
      operation: "disabling two-factor authentication",
    });
  });

  test("parses Retry-After values and formats them for display", () => {
    expect(parseRetryAfter("120")).toBe(120);
    expect(formatRetryAfter(75)).toBe("1 minute 15 seconds");
    expect(formatRetryAfter(1)).toBe("1 second");
  });
});
