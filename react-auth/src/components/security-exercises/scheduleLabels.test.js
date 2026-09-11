import {
  CADENCE_VALUES,
  OCCURRENCE_STATUSES,
  getCadenceLabel,
  getScheduleStateLabel,
  getScheduleStateTone,
  getOccurrenceStatusLabel,
  getOccurrenceStatusTone,
  getOccurrenceStatusExplanation,
  humanizeBlockReason,
  getScheduleRequestErrorMessage,
} from "./scheduleLabels";

describe("cadence (B-RED1D is intentionally bounded)", () => {
  test("covers exactly the three backend SecurityExerciseSchedule.Cadence values", () => {
    expect(CADENCE_VALUES).toEqual(["HOURLY", "DAILY", "WEEKLY"]);
  });

  test("every cadence has a human label", () => {
    CADENCE_VALUES.forEach((value) => {
      expect(getCadenceLabel(value)).toEqual(expect.any(String));
      expect(getCadenceLabel(value).length).toBeGreaterThan(0);
    });
    expect(getCadenceLabel("HOURLY")).toBe("Hourly");
    expect(getCadenceLabel("DAILY")).toBe("Daily");
    expect(getCadenceLabel("WEEKLY")).toBe("Weekly");
  });
});

describe("schedule enabled/disabled state (never a run result)", () => {
  test("labels are Enabled/Disabled, not PASSED/FAILED/HEALTHY", () => {
    expect(getScheduleStateLabel(true)).toBe("Enabled");
    expect(getScheduleStateLabel(false)).toBe("Disabled");
    expect(getScheduleStateLabel(true)).not.toMatch(/PASSED|FAILED|HEALTHY/i);
    expect(getScheduleStateLabel(false)).not.toMatch(/PASSED|FAILED|HEALTHY/i);
  });

  test("tone differs between enabled and disabled", () => {
    expect(getScheduleStateTone(true)).not.toBe(getScheduleStateTone(false));
  });
});

describe("occurrence status (B-RED1D) -- distinct vocabulary from run status", () => {
  test("covers exactly the four backend SecurityExerciseOccurrence.Status values", () => {
    expect(OCCURRENCE_STATUSES).toEqual(["PENDING", "DISPATCHED", "BLOCKED", "ERROR"]);
  });

  test("every occurrence status has a human label", () => {
    OCCURRENCE_STATUSES.forEach((status) => {
      expect(getOccurrenceStatusLabel(status)).toEqual(expect.any(String));
      expect(getOccurrenceStatusLabel(status).length).toBeGreaterThan(0);
    });
  });

  test("DISPATCHED is not toned as a success/pass -- it is not an exercise result", () => {
    expect(getOccurrenceStatusTone("DISPATCHED")).toBe("neutral");
    expect(getOccurrenceStatusTone("DISPATCHED")).not.toBe("success");
  });

  test("DISPATCHED explanation defers to the linked run for the actual result", () => {
    const explanation = getOccurrenceStatusExplanation("DISPATCHED");
    expect(explanation).toMatch(/linked run/i);
  });

  test("BLOCKED explanation never reads as a failed security protection", () => {
    const explanation = getOccurrenceStatusExplanation("BLOCKED");
    expect(explanation).not.toMatch(/security protection was not satisfied/i);
    expect(explanation).toMatch(/not an exercise result/i);
  });

  test("ERROR explanation never reads as a pass or a fail", () => {
    const explanation = getOccurrenceStatusExplanation("ERROR");
    expect(explanation).toMatch(/not an exercise result/i);
  });
});

describe("humanizeBlockReason", () => {
  test("renders a bounded backend reason code readably", () => {
    expect(humanizeBlockReason("SCHEDULE_OWNER_NOT_AUTHORIZED")).toBe("Schedule Owner Not Authorized");
  });

  test("empty/missing reason renders as empty", () => {
    expect(humanizeBlockReason("")).toBe("");
    expect(humanizeBlockReason(null)).toBe("");
  });
});

describe("getScheduleRequestErrorMessage", () => {
  test("a network error (no response) reads as unreachable", () => {
    expect(getScheduleRequestErrorMessage({ response: undefined })).toMatch(/check your connection/i);
  });

  test("a 403 reads as a permission message", () => {
    expect(getScheduleRequestErrorMessage({ response: { status: 403 } })).toMatch(/permission/i);
  });

  test("a 400 validation rejection surfaces the backend detail verbatim", () => {
    const rejection = { response: { status: 400, data: { detail: "Security Exercises cannot run in production." } } };
    expect(getScheduleRequestErrorMessage(rejection)).toBe("Security Exercises cannot run in production.");
  });

  test("a 404 surfaces the backend detail", () => {
    const notFound = { response: { status: 404, data: { detail: "Schedule was not found." } } };
    expect(getScheduleRequestErrorMessage(notFound)).toBe("Schedule was not found.");
  });

  test("a 500 reads as service-unavailable", () => {
    expect(getScheduleRequestErrorMessage({ response: { status: 500 } })).toMatch(/unavailable/i);
  });
});
