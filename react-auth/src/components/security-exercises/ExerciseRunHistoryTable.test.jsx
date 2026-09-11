import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExerciseRunHistoryTable } from "./ExerciseRunHistoryTable";

const RUNS = [
  {
    id: "run-1",
    playbook_key: "auth.refresh_token_replay",
    playbook_version: 1,
    playbook_title: "Refresh Token Replay",
    status: "PASSED",
    requested_at: "2026-09-10T18:00:00Z",
    requested_by_display: "security@example.test",
    case_id: "22222222-2222-2222-2222-222222222222",
    finding_id: null,
  },
  {
    id: "run-2",
    playbook_key: "auth.step_up_bypass",
    playbook_version: 1,
    playbook_title: "Step-Up Bypass",
    status: "DENIED",
    requested_at: "2026-09-10T17:00:00Z",
    requested_by_display: "security@example.test",
    case_id: null,
    finding_id: null,
  },
];

describe("ExerciseRunHistoryTable", () => {
  test("renders past runs and lets an operator select one", () => {
    const onSelectRun = jest.fn();
    render(
      <ExerciseRunHistoryTable runs={RUNS} isLoading={false} error={null} isStale={false} onRetry={jest.fn()} onSelectRun={onSelectRun} />
    );

    expect(screen.getByText("Refresh Token Replay")).toBeInTheDocument();
    expect(screen.getByText("Step-Up Bypass")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("Denied")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Refresh Token Replay"));
    expect(onSelectRun).toHaveBeenCalledWith(RUNS[0]);
  });

  test("renders provenance safely, and omits it entirely when absent", () => {
    render(
      <ExerciseRunHistoryTable runs={RUNS} isLoading={false} error={null} isStale={false} onRetry={jest.fn()} onSelectRun={jest.fn()} />
    );

    expect(screen.getByText(/^Case /)).toBeInTheDocument();
    // run-2 has no case/finding -- nothing crashes, and no stray "Case"/"Finding" text is invented for it.
  });

  test("an empty history shows an empty state, not an error", () => {
    render(<ExerciseRunHistoryTable runs={[]} isLoading={false} error={null} isStale={false} onRetry={jest.fn()} onSelectRun={jest.fn()} />);
    expect(screen.getByText("No Security Exercise runs yet.")).toBeInTheDocument();
  });

  test("a history refresh failure with existing data preserves the last-known runs", () => {
    render(
      <ExerciseRunHistoryTable
        runs={RUNS}
        isLoading={false}
        error={{ response: { status: 500 } }}
        isStale
        onRetry={jest.fn()}
        onSelectRun={jest.fn()}
      />
    );

    expect(screen.getByText("Refresh Token Replay")).toBeInTheDocument();
    expect(screen.getByText(/Showing the last known run history/)).toBeInTheDocument();
  });

  test("a failure with no prior data shows a retryable error state", () => {
    const onRetry = jest.fn();
    render(
      <ExerciseRunHistoryTable
        runs={[]}
        isLoading={false}
        error={{ response: { status: 500 } }}
        isStale={false}
        onRetry={onRetry}
        onSelectRun={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
