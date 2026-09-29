import {
  RUN_STATUSES,
  ACTIVE_RUN_STATUSES,
  TERMINAL_RUN_STATUSES,
  isActiveRunStatus,
  isTerminalRunStatus,
  getRunStatusLabel,
  getRunStatusExplanation,
  getNetworkErrorMessage,
  getExecutionErrorMessage,
  getSafeEnvironments,
  hasUnsafeProductionEnvironment,
  isSafelyExecutable,
  canRunSecurityExercises,
} from "./securityExerciseLabels";

describe("run status lifecycle", () => {
  test("covers exactly the eight backend SecurityExerciseRun.Status values", () => {
    expect(RUN_STATUSES).toEqual([
      "REQUESTED",
      "AUTHORIZED",
      "RUNNING",
      "PASSED",
      "FAILED",
      "DENIED",
      "ERROR",
      "CANCELLED",
    ]);
  });

  test("every status is classified as exactly one of active or terminal", () => {
    RUN_STATUSES.forEach((status) => {
      expect(isActiveRunStatus(status) !== isTerminalRunStatus(status)).toBe(true);
    });
    expect(ACTIVE_RUN_STATUSES).toEqual(["REQUESTED", "AUTHORIZED", "RUNNING"]);
    expect(TERMINAL_RUN_STATUSES).toEqual(["PASSED", "FAILED", "DENIED", "ERROR", "CANCELLED"]);
  });

  test("every status has a human label", () => {
    RUN_STATUSES.forEach((status) => {
      expect(getRunStatusLabel(status)).toEqual(expect.any(String));
      expect(getRunStatusLabel(status).length).toBeGreaterThan(0);
    });
  });

  test("PASSED, FAILED, DENIED, and ERROR each read as a distinct, unmistakable outcome", () => {
    const passed = getRunStatusExplanation("PASSED");
    const failed = getRunStatusExplanation("FAILED");
    const denied = getRunStatusExplanation("DENIED");
    const error = getRunStatusExplanation("ERROR");

    expect(passed).toMatch(/expected secure behavior/i);
    expect(failed).toMatch(/security protection was not satisfied/i);
    expect(denied).toMatch(/governance prevented execution/i);
    expect(error).toMatch(/could not establish a result/i);

    const explanations = [passed, failed, denied, error];
    expect(new Set(explanations).size).toBe(explanations.length);
  });

  test("DENIED explanation does not imply a failed security protection", () => {
    expect(getRunStatusExplanation("DENIED")).not.toMatch(/protection was not satisfied/i);
  });

  test("ERROR explanation does not imply a pass or a fail verdict", () => {
    const explanation = getRunStatusExplanation("ERROR");
    expect(explanation).toMatch(/not a pass or a fail/i);
  });

  test("REQUESTED explanation uses canonical Incident Commander terminology", () => {
    expect(getRunStatusExplanation("REQUESTED")).toMatch(/Incident Commander/);
  });

  test("active statuses (REQUESTED, AUTHORIZED, RUNNING) each have their own explanation", () => {
    const requested = getRunStatusExplanation("REQUESTED");
    const authorized = getRunStatusExplanation("AUTHORIZED");
    const running = getRunStatusExplanation("RUNNING");
    expect(new Set([requested, authorized, running]).size).toBe(3);
    [requested, authorized, running].forEach((text) => expect(text.length).toBeGreaterThan(0));
  });

  test("CANCELLED reads as neither a pass nor a fail", () => {
    const explanation = getRunStatusExplanation("CANCELLED");
    expect(explanation).not.toMatch(/expected secure behavior/i);
    expect(explanation).not.toMatch(/security protection was not satisfied/i);
  });
});

describe("error message differentiation (B-RED1C section 30)", () => {
  test("a network error (no response) reads differently for status refresh vs submission", () => {
    const networkError = { response: undefined };
    expect(getNetworkErrorMessage(networkError)).toMatch(/check your connection/i);
    expect(getExecutionErrorMessage(networkError)).toMatch(/did not reach Gait/i);
  });

  test("a 400 execution rejection surfaces the backend detail verbatim, not a generic banner", () => {
    const rejection = { response: { status: 400, data: { detail: "Security Exercises cannot run in production." } } };
    expect(getExecutionErrorMessage(rejection)).toBe("Security Exercises cannot run in production.");
  });

  test("a 403 reads as a permission message, distinct from a network or validation error", () => {
    const forbidden = { response: { status: 403 } };
    expect(getExecutionErrorMessage(forbidden)).toMatch(/permission/i);
    expect(getExecutionErrorMessage(forbidden)).not.toMatch(/did not reach Gait/i);
  });

  test("a 500 reads as a service-unavailable message", () => {
    const serverError = { response: { status: 500 } };
    expect(getExecutionErrorMessage(serverError)).toMatch(/unavailable/i);
  });
});

describe("production safety helpers (B-RED1C section 33)", () => {
  test("getSafeEnvironments always strips production", () => {
    expect(getSafeEnvironments(["test", "staging", "production"])).toEqual(["test", "staging"]);
    expect(getSafeEnvironments(["production"])).toEqual([]);
    expect(getSafeEnvironments(undefined)).toEqual([]);
  });

  test("hasUnsafeProductionEnvironment flags a playbook advertising production", () => {
    expect(hasUnsafeProductionEnvironment(["test", "production"])).toBe(true);
    expect(hasUnsafeProductionEnvironment(["test", "staging"])).toBe(false);
  });

  test("isSafelyExecutable is false when the only allowed environment is production", () => {
    expect(isSafelyExecutable({ executable: true, allowed_environments: ["production"] })).toBe(false);
    expect(isSafelyExecutable({ executable: true, allowed_environments: ["test", "production"] })).toBe(true);
    expect(isSafelyExecutable({ executable: false, allowed_environments: ["test"] })).toBe(false);
  });
});

/**
 * Gait Security Exercise access is Gait operators only (is_gait_operator). `user.role` is Lumen's
 * own business-role model (admin / physician / technologist) and must
 * never gate Minato -- a staff technologist or physician is a legitimate
 * Gait operator, same as a staff admin.
 */
describe("canRunSecurityExercises", () => {
  test("staff technologist is allowed", () => {
    expect(canRunSecurityExercises({ is_gait_operator: true, role: "technologist" })).toBe(true);
  });

  test("staff physician is allowed", () => {
    expect(canRunSecurityExercises({ is_gait_operator: true, role: "physician" })).toBe(true);
  });

  test("staff admin is allowed", () => {
    expect(canRunSecurityExercises({ is_gait_operator: true, role: "admin" })).toBe(true);
  });

  test("role is irrelevant when the user is not staff", () => {
    expect(canRunSecurityExercises({ is_gait_operator: false, role: "admin" })).toBe(false);
    expect(canRunSecurityExercises({ is_gait_operator: false, role: "technologist" })).toBe(false);
  });

  test("a user with no role at all is allowed purely on is_gait_operator", () => {
    expect(canRunSecurityExercises({ is_gait_operator: true })).toBe(true);
  });

  test("OPS1: is_staff or is_superuser without the operator flag is denied", () => {
    expect(canRunSecurityExercises({ is_staff: true, role: "admin" })).toBe(false);
    expect(canRunSecurityExercises({ is_staff: true, is_superuser: true })).toBe(false);
  });

  test("a null or undefined user is denied", () => {
    expect(canRunSecurityExercises(null)).toBe(false);
    expect(canRunSecurityExercises(undefined)).toBe(false);
  });
});
