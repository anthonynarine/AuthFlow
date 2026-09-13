import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { PostureOverview } from "./PostureOverview";

// PostureOverview renders SecurityInfoButton, whose "Learn more" affordance
// lazily imports the real authAxios client via this hook; stub it so these
// tests never touch the network (or the real, unmockable axios package
// Jest can't parse here).
jest.mock("../../hooks/useSecurityLearning", () => ({
  fetchLearningTopic: jest.fn(() => Promise.reject(new Error("not mocked in this test"))),
  useSecurityLearningIndex: () => ({ topics: [], isLoading: false, error: null, retry: jest.fn() }),
  __resetSecurityLearningCacheForTests: jest.fn(),
}));

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
    expect(screen.getAllByText("11").length).toBeGreaterThan(0);
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
    expect(screen.queryByText(/no current evidence proves this control's health/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
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

  test("plain-language summary distinguishes real problems from pending evaluation", () => {
    const posture = {
      ...healthyPosture,
      overall_status: "CONTROL_FAILURE",
      overall_status_label: "Control failure",
      controls: { healthy: 3, needs_attention: 0, control_failure: 2, unknown: 21, not_applicable: 0 },
      open_findings: { critical: 0, high: 4, warning: 0, info: 3 },
    };

    render(<PostureOverview posture={posture} isLoading={false} error={null} />);

    expect(screen.getByText(/2 controls and 4 findings need attention\./)).toBeInTheDocument();
    expect(
      screen.getByText(/21 controls haven't been evaluated yet -- that's not a problem by itself/)
    ).toBeInTheDocument();
  });

  test("summary says nothing needs attention when nothing does", () => {
    render(<PostureOverview posture={healthyPosture} isLoading={false} error={null} />);
    expect(screen.getByText("Nothing needs attention right now.")).toBeInTheDocument();
  });

  test("clicking the controls-needing-attention card calls onViewControls", () => {
    const onViewControls = jest.fn();
    const posture = {
      ...healthyPosture,
      controls: { healthy: 3, needs_attention: 0, control_failure: 2, unknown: 21, not_applicable: 0 },
    };
    render(
      <PostureOverview posture={posture} isLoading={false} error={null} onViewControls={onViewControls} />
    );

    fireEvent.click(screen.getByRole("button", { name: "2 Controls needing attention" }));
    expect(onViewControls).toHaveBeenCalled();
  });

  test("attention cards are not clickable when no handler is provided (e.g. Security Command)", () => {
    render(<PostureOverview posture={healthyPosture} isLoading={false} error={null} />);
    expect(screen.queryByRole("button", { name: /controls needing attention/i })).not.toBeInTheDocument();
  });

  test("full breakdown is available but collapsed behind a disclosure", () => {
    render(<PostureOverview posture={healthyPosture} isLoading={false} error={null} />);
    expect(screen.getByText("Show full breakdown")).toBeInTheDocument();
    expect(screen.getByText("Control failures")).toBeInTheDocument();
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
