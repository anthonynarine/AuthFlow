import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const PLAYBOOK = {
  key: "auth.refresh_token_replay",
  version: 1,
  title: "Refresh Token Replay",
  allowed_environments: ["test", "staging"],
  target_controls: [{ control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION", title: "Refresh Replay Protection" }],
  implementation_status: "IMPLEMENTED",
  executable: true,
};

function makeSchedule(overrides = {}) {
  return {
    id: "sched-1",
    name: "Refresh Replay Daily",
    playbook_key: "auth.refresh_token_replay",
    playbook_version: 1,
    environment: "test",
    target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
    cadence: "DAILY",
    enabled: true,
    next_run_at: "2026-09-12T08:00:00Z",
    created_by_display: "operator@example.test",
    last_occurrence_at: null,
    last_run_id: null,
    created_at: "2026-09-10T08:00:00Z",
    updated_at: "2026-09-10T08:00:00Z",
    ...overrides,
  };
}

describe("ScheduleDetailModal", () => {
  beforeEach(() => {
    authAxios.patch.mockReset();
  });

  test("renders nothing when no schedule is selected", () => {
    const { container } = render(
      <ScheduleDetailModal schedule={null} playbooks={[PLAYBOOK]} canManage onClose={jest.fn()} onUpdated={jest.fn()} onViewOccurrences={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the schedule's fields", () => {
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={jest.fn()}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Refresh Replay Daily")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText(/Refresh Token Replay v1/)).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
  });

  test("a non-managing (non-staff) viewer sees no Edit or Enable/Disable controls", () => {
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage={false}
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={jest.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable Schedule" })).not.toBeInTheDocument();
  });

  test("Disable Schedule requires confirmation, then PATCHes enabled=false", async () => {
    authAxios.patch.mockResolvedValue({ data: makeSchedule({ enabled: false }) });
    const onUpdated = jest.fn();
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={onUpdated}
        onViewOccurrences={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Disable Schedule" }));
    expect(authAxios.patch).not.toHaveBeenCalled();
    expect(screen.getByText("Disable this schedule?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Disable" }));

    await waitFor(() => expect(authAxios.patch).toHaveBeenCalledWith("/security-exercises/schedules/sched-1/", { enabled: false }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ enabled: false })));
  });

  test("Enable Schedule PATCHes enabled=true and never claims the exercise will definitely execute", async () => {
    authAxios.patch.mockResolvedValue({ data: makeSchedule({ enabled: true }) });
    render(
      <ScheduleDetailModal
        schedule={makeSchedule({ enabled: false })}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={jest.fn()}
      />
    );

    expect(screen.getByText(/Future due occurrences may be requested/i)).toBeInTheDocument();
    expect(screen.queryByText(/will definitely execute/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enable Schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Enable" }));

    await waitFor(() => expect(authAxios.patch).toHaveBeenCalledWith("/security-exercises/schedules/sched-1/", { enabled: true }));
  });

  test("disabling does not delete or hide occurrence history access", () => {
    render(
      <ScheduleDetailModal
        schedule={makeSchedule({ enabled: false })}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "View Occurrences" })).toBeInTheDocument();
  });

  test("Edit only changes future-facing fields via PATCH, and shows a future-occurrences-only note", async () => {
    authAxios.patch.mockResolvedValue({ data: makeSchedule({ name: "Updated Name" }) });
    const onUpdated = jest.fn();
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={onUpdated}
        onViewOccurrences={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText(/future occurrences only/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Schedule Name"), { target: { value: "Updated Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(authAxios.patch).toHaveBeenCalledTimes(1));
    const [url, body] = authAxios.patch.mock.calls[0];
    expect(url).toBe("/security-exercises/schedules/sched-1/");
    expect(body).toEqual(
      expect.objectContaining({
        name: "Updated Name",
        cadence: "DAILY",
        environment: "test",
      })
    );
    expect(body).not.toHaveProperty("playbook_key");
    expect(body).not.toHaveProperty("playbook_version");
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  test("a PATCH validation error surfaces safely", async () => {
    authAxios.patch.mockRejectedValue({
      response: { status: 400, data: { error: "INVALID_CADENCE", detail: "Security Exercise schedule cadence is invalid." } },
    });
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Security Exercise schedule cadence is invalid.")).toBeInTheDocument();
  });

  test("View Occurrences calls onViewOccurrences with the schedule", () => {
    const onViewOccurrences = jest.fn();
    render(
      <ScheduleDetailModal
        schedule={makeSchedule()}
        playbooks={[PLAYBOOK]}
        canManage
        onClose={jest.fn()}
        onUpdated={jest.fn()}
        onViewOccurrences={onViewOccurrences}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "View Occurrences" }));
    expect(onViewOccurrences).toHaveBeenCalledWith(makeSchedule());
  });
});
