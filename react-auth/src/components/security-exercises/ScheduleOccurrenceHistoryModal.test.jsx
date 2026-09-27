import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScheduleOccurrenceHistoryModal } from "./ScheduleOccurrenceHistoryModal";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

const SCHEDULE = { id: "sched-1", name: "Refresh Replay Daily" };

function occurrence(overrides = {}) {
  return {
    id: "occ-1",
    schedule_id: "sched-1",
    scheduled_for: "2026-09-12T08:00:00Z",
    playbook_key: "auth.refresh_token_replay",
    playbook_version: 1,
    environment: "test",
    target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
    status: "DISPATCHED",
    run_id: "run-1",
    failure_reason: "",
    created_at: "2026-09-12T08:00:00Z",
    dispatched_at: "2026-09-12T08:00:01Z",
    ...overrides,
  };
}

describe("ScheduleOccurrenceHistoryModal", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
  });

  test("renders nothing when no schedule is selected", () => {
    const { container } = render(<ScheduleOccurrenceHistoryModal schedule={null} onClose={jest.fn()} onViewRun={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("fetches occurrences using the correct schedule id", async () => {
    authAxios.get.mockResolvedValue({ data: [] });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);

    await waitFor(() =>
      expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/schedules/sched-1/occurrences/")
    );
  });

  test("shows a loading state before occurrences arrive", () => {
    authAxios.get.mockReturnValue(new Promise(() => {}));
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    expect(screen.getByText(/Loading occurrence history/i)).toBeInTheDocument();
  });

  test("an API failure renders an error state, not a blank/crashed view", async () => {
    authAxios.get.mockRejectedValue({ response: { status: 500 } });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  test("an empty occurrence list shows a non-error empty state", async () => {
    authAxios.get.mockResolvedValue({ data: [] });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    expect(await screen.findByText(/has not produced an occurrence yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test.each(["PENDING", "DISPATCHED", "BLOCKED", "ERROR"])(
    "renders a %s occurrence with its own distinct status badge",
    async (status) => {
      authAxios.get.mockResolvedValue({ data: [occurrence({ status, run_id: null })] });
      const { container } = render(
        <ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />
      );
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the status badge element is what this test checks
      await waitFor(() => expect(container.querySelector(".security-badge")).not.toBeNull());
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the status badge element is what this test checks
      const badge = container.querySelector(".security-badge");
      expect(badge.textContent.toUpperCase()).toBe(status);
    }
  );

  test("a block reason renders safely as readable text", async () => {
    authAxios.get.mockResolvedValue({
      data: [occurrence({ status: "BLOCKED", run_id: null, failure_reason: "SCHEDULE_OWNER_NOT_AUTHORIZED" })],
    });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    expect(await screen.findByText(/Schedule Owner Not Authorized/)).toBeInTheDocument();
  });

  test("occurrence status is never rendered using run-status vocabulary (PASSED/FAILED/DENIED)", async () => {
    authAxios.get.mockResolvedValue({ data: [occurrence({ status: "DISPATCHED" })] });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    await screen.findByText("Dispatched");
    expect(screen.queryByText(/^PASSED$|^FAILED$|^DENIED$/)).not.toBeInTheDocument();
  });

  test("an occurrence with a linked run opens the run via onViewRun (existing Run Detail dialog)", async () => {
    authAxios.get.mockResolvedValue({ data: [occurrence({ run_id: "run-42" })] });
    const onViewRun = jest.fn();
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={onViewRun} />);

    const runButton = await screen.findByRole("button", { name: /View run/i });
    fireEvent.click(runButton);
    expect(onViewRun).toHaveBeenCalledWith("run-42");
  });

  test("an occurrence without a run shows no run link", async () => {
    authAxios.get.mockResolvedValue({ data: [occurrence({ status: "BLOCKED", run_id: null })] });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    await screen.findByText("No run created");
    expect(screen.queryByRole("button", { name: /View run/i })).not.toBeInTheDocument();
  });

  test("Refresh re-fetches the occurrence list", async () => {
    authAxios.get.mockResolvedValue({ data: [] });
    render(<ScheduleOccurrenceHistoryModal schedule={SCHEDULE} onClose={jest.fn()} onViewRun={jest.fn()} />);
    await waitFor(() => expect(authAxios.get).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(authAxios.get).toHaveBeenCalledTimes(2));
  });
});
