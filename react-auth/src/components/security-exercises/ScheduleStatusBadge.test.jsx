import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";

describe("ScheduleStatusBadge", () => {
  test("renders ENABLED as 'Enabled'", () => {
    render(<ScheduleStatusBadge enabled />);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  test("renders DISABLED as 'Disabled'", () => {
    render(<ScheduleStatusBadge enabled={false} />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  test("never labels a schedule PASSED, FAILED, or HEALTHY -- those are not schedule states", () => {
    const { container: enabled } = render(<ScheduleStatusBadge enabled />);
    const { container: disabled } = render(<ScheduleStatusBadge enabled={false} />);
    expect(enabled.textContent).not.toMatch(/PASSED|FAILED|HEALTHY/i);
    expect(disabled.textContent).not.toMatch(/PASSED|FAILED|HEALTHY/i);
  });

  test("enabled and disabled render visually distinct tones", () => {
    const { container: enabled } = render(<ScheduleStatusBadge enabled />);
    const { container: disabled } = render(<ScheduleStatusBadge enabled={false} />);
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the badge's own element and tone class are what this test checks
    expect(enabled.querySelector("span").className).not.toBe(disabled.querySelector("span").className);
  });
});
