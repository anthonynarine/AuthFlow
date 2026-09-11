import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { ExerciseRunStatusBadge } from "./ExerciseRunStatusBadge";
import { RUN_STATUSES } from "./securityExerciseLabels";

describe("ExerciseRunStatusBadge", () => {
  test.each(RUN_STATUSES)("renders a readable humanized text label for %s, not just a color", (status) => {
    const { container, unmount } = render(<ExerciseRunStatusBadge status={status} />);
    const badge = container.querySelector("span");
    expect(badge.textContent.length).toBeGreaterThan(0);
    expect(badge.textContent).not.toBe(status); // humanized, e.g. "Requested" not "REQUESTED"
    unmount();
  });

  test("every status renders a distinct label", () => {
    const seen = new Set();
    RUN_STATUSES.forEach((status) => {
      const { container, unmount } = render(<ExerciseRunStatusBadge status={status} />);
      seen.add(container.textContent);
      unmount();
    });
    expect(seen.size).toBe(RUN_STATUSES.length);
  });

  test("PASSED and FAILED render visually distinct tones", () => {
    const { container: passed } = render(<ExerciseRunStatusBadge status="PASSED" />);
    const { container: failed } = render(<ExerciseRunStatusBadge status="FAILED" />);
    expect(passed.querySelector("span").className).not.toBe(failed.querySelector("span").className);
  });
});
