import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { OccurrenceStatusBadge } from "./OccurrenceStatusBadge";
import { OCCURRENCE_STATUSES } from "./scheduleLabels";

describe("OccurrenceStatusBadge", () => {
  test.each(OCCURRENCE_STATUSES)("renders a readable humanized text label for %s, not just a color", (status) => {
    const { container, unmount } = render(<OccurrenceStatusBadge status={status} />);
    const badge = container.querySelector("span");
    expect(badge.textContent.length).toBeGreaterThan(0);
    expect(badge.textContent).not.toBe(status);
    unmount();
  });

  test("PENDING, DISPATCHED, BLOCKED, and ERROR each render a distinct label", () => {
    const seen = new Set();
    OCCURRENCE_STATUSES.forEach((status) => {
      const { container, unmount } = render(<OccurrenceStatusBadge status={status} />);
      seen.add(container.textContent);
      unmount();
    });
    expect(seen.size).toBe(OCCURRENCE_STATUSES.length);
  });

  test("badge markup uses occurrence-status- class prefix, distinct from exercise-status- (run result)", () => {
    const { container } = render(<OccurrenceStatusBadge status="DISPATCHED" />);
    const badge = container.querySelector("span");
    expect(badge.className).toMatch(/occurrence-status-/);
    expect(badge.className).not.toMatch(/exercise-status-/);
  });

  test("BLOCKED and ERROR render visually distinct tones", () => {
    const { container: blocked } = render(<OccurrenceStatusBadge status="BLOCKED" />);
    const { container: error } = render(<OccurrenceStatusBadge status="ERROR" />);
    expect(blocked.querySelector("span").className).not.toBe(error.querySelector("span").className);
  });
});
