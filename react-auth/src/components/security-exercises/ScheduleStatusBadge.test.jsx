import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";

describe("ScheduleStatusBadge", () => {
  test("renders ENABLED as 'Enabled'", () => {
    const { getByText } = render(<ScheduleStatusBadge enabled />);
    expect(getByText("Enabled")).toBeInTheDocument();
  });

  test("renders DISABLED as 'Disabled'", () => {
    const { getByText } = render(<ScheduleStatusBadge enabled={false} />);
    expect(getByText("Disabled")).toBeInTheDocument();
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
    expect(enabled.querySelector("span").className).not.toBe(disabled.querySelector("span").className);
  });
});
