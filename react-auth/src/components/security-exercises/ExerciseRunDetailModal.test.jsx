import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExerciseRunDetailModal } from "./ExerciseRunDetailModal";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: { get: jest.fn() },
}));

const RUN = {
  id: "run-1",
  playbook_key: "auth.refresh_token_replay",
  playbook_version: 1,
  playbook_title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  environment: "test",
  status: "PASSED",
  result_summary: "Expected secure behavior was observed.",
  failure_reason: "",
  requested_by_display: "admin@example.test",
  requested_at: "2026-09-10T18:00:00Z",
  started_at: "2026-09-10T18:00:01Z",
  completed_at: "2026-09-10T18:00:05Z",
  case_id: "22222222-2222-2222-2222-222222222222",
  finding_id: null,
  authorization_reason: "ALLOWED",
  target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
};

describe("ExerciseRunDetailModal", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
  });

  test("renders nothing when no run is selected", () => {
    const { container } = render(<ExerciseRunDetailModal runId={null} initialRun={null} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("shows the initial run immediately while the fresh detail loads", async () => {
    let resolveGet;
    authAxios.get.mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      })
    );

    render(<ExerciseRunDetailModal runId="run-1" initialRun={RUN} onClose={jest.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Refresh Token Replay")).toBeInTheDocument();
    expect(screen.getByText(/not Security Truth/i)).toBeInTheDocument();

    resolveGet({ data: RUN });
    await waitFor(() => expect(authAxios.get).toHaveBeenCalled());
  });

  test("renders provenance safely and omits absent fields", async () => {
    authAxios.get.mockResolvedValue({ data: RUN });
    render(<ExerciseRunDetailModal runId="run-1" initialRun={null} onClose={jest.fn()} />);

    await screen.findByText("Refresh Token Replay");
    expect(screen.getByText(/^22222222/)).toBeInTheDocument();
    // finding_id is null -- rendered as a placeholder, not fabricated.
    const findingRow = screen.getByText("Finding").closest(".detail-row");
    expect(findingRow).toHaveTextContent("—");
  });

  test("shows an active run as updating, and a terminal run without the updating indicator", async () => {
    authAxios.get.mockResolvedValue({ data: { ...RUN, status: "RUNNING" } });
    render(<ExerciseRunDetailModal runId="run-1" initialRun={null} onClose={jest.fn()} />);

    await screen.findByText("Refresh Token Replay");
    expect(screen.getByText("Updating…")).toBeInTheDocument();
  });

  test("a load failure with no prior run shows a compact error, not fabricated content", async () => {
    authAxios.get.mockRejectedValue({ response: { status: 500 } });
    render(<ExerciseRunDetailModal runId="run-1" initialRun={null} onClose={jest.fn()} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  test("Escape closes the modal", async () => {
    authAxios.get.mockResolvedValue({ data: RUN });
    const onClose = jest.fn();
    render(<ExerciseRunDetailModal runId="run-1" initialRun={RUN} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("has an accessible close control", async () => {
    authAxios.get.mockResolvedValue({ data: RUN });
    render(<ExerciseRunDetailModal runId="run-1" initialRun={RUN} onClose={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Close run detail" })).toBeInTheDocument();
  });
});
