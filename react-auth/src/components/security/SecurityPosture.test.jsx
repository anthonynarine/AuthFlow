import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PostureOverview } from "./PostureOverview";

const healthyPosture = {
  overall_status: "HEALTHY",
  overall_status_label: "Healthy",
  controls: { healthy: 11, needs_attention: 0, control_failure: 0, unknown: 0, not_applicable: 0 },
  open_findings: { critical: 0, high: 0, warning: 0, info: 0 },
  last_evaluated_at: "2026-08-31T00:00:00Z",
};

describe("PostureOverview", () => {
  test("posture loads and renders overall status plus counts", () => {
    render(<PostureOverview posture={healthyPosture} isLoading={false} error={null} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/Overall:\s*Healthy/);
    expect(screen.getByText("Controls")).toBeInTheDocument();
    expect(screen.getByText("Open findings")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  test("UNKNOWN posture is shown honestly, not translated to healthy", () => {
    const posture = {
      ...healthyPosture,
      overall_status: "UNKNOWN",
      overall_status_label: "Unknown",
      controls: { healthy: 0, needs_attention: 0, control_failure: 0, unknown: 8, not_applicable: 0 },
    };

    render(<PostureOverview posture={posture} isLoading={false} error={null} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/Overall:\s*Unknown/);
    expect(heading.textContent).not.toMatch(/Overall:\s*Healthy/);
    expect(screen.getByText(/no current evidence proves this control's health/i)).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  test("CONTROL_FAILURE posture is visible", () => {
    const posture = {
      ...healthyPosture,
      overall_status: "CONTROL_FAILURE",
      overall_status_label: "Control failure",
      controls: { healthy: 0, needs_attention: 3, control_failure: 1, unknown: 7, not_applicable: 0 },
      open_findings: { critical: 1, high: 0, warning: 0, info: 0 },
    };

    render(<PostureOverview posture={posture} isLoading={false} error={null} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/Overall:\s*Control failure/);
    expect(screen.getByText("Control failures")).toBeInTheDocument();
  });

  test("never renders a numeric security score", () => {
    render(<PostureOverview posture={healthyPosture} isLoading={false} error={null} />);

    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  test("permission denied is shown when posture fails to load with 403", () => {
    render(<PostureOverview posture={null} isLoading={false} error={{ response: { status: 403 } }} />);

    expect(screen.getByText("Permission denied")).toBeInTheDocument();
  });

  test("generic API error is shown when posture fails to load", () => {
    render(<PostureOverview posture={null} isLoading={false} error={{ response: { status: 500 } }} />);

    expect(screen.getByText("Request failed")).toBeInTheDocument();
  });
});
