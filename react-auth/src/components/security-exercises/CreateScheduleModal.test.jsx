import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const READY_PLAYBOOK = {
  key: "auth.refresh_token_replay",
  version: 1,
  title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  allowed_environments: ["test", "staging"],
  target_controls: [{ control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION", title: "Refresh Replay Protection" }],
  implementation_status: "IMPLEMENTED",
  executable: true,
};

const PLANNED_PLAYBOOK = {
  ...READY_PLAYBOOK,
  key: "deployment.approval_replay",
  version: 1,
  title: "Deployment Approval Replay",
  target_controls: [],
  implementation_status: "PLANNED",
  executable: false,
};

const NOT_EXECUTABLE_PLAYBOOK = {
  ...READY_PLAYBOOK,
  key: "auth.step_up_bypass",
  version: 1,
  title: "Step-Up Bypass",
  implementation_status: "IMPLEMENTED",
  executable: false,
};

function scheduleResponse(overrides = {}) {
  return {
    data: {
      id: "sched-1",
      name: "Refresh Replay Daily",
      playbook_key: READY_PLAYBOOK.key,
      playbook_version: 1,
      environment: "test",
      target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
      cadence: "DAILY",
      enabled: true,
      next_run_at: new Date().toISOString(),
      created_by_display: "operator@example.test",
      last_occurrence_at: null,
      last_run_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

async function fillMinimalForm() {
  fireEvent.change(screen.getByLabelText("Schedule Name"), { target: { value: "Refresh Replay Daily" } });
  fireEvent.change(screen.getByLabelText("Playbook"), {
    target: { value: `${READY_PLAYBOOK.key}:${READY_PLAYBOOK.version}` },
  });
  await screen.findByLabelText("Environment");
  fireEvent.change(screen.getByLabelText("Next Run"), { target: { value: "2026-09-12T08:00" } });
}

describe("CreateScheduleModal", () => {
  beforeEach(() => {
    authAxios.post.mockReset();
  });

  test("renders nothing when closed", () => {
    const { container } = render(
      <CreateScheduleModal open={false} playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("opens with a dialog when open=true", () => {
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create Schedule" })).toBeInTheDocument();
  });

  test("only approved, schedulable playbooks appear in the Playbook select", () => {
    render(
      <CreateScheduleModal
        open
        playbooks={[READY_PLAYBOOK, PLANNED_PLAYBOOK, NOT_EXECUTABLE_PLAYBOOK]}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />
    );
    const select = screen.getByLabelText("Playbook");
    expect(within(select).getByRole("option", { name: /Refresh Token Replay/ })).toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: /Deployment Approval Replay/ })).not.toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: /Step-Up Bypass/ })).not.toBeInTheDocument();
  });

  test("a PLANNED playbook cannot be scheduled", () => {
    render(<CreateScheduleModal open playbooks={[PLANNED_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByText(/No approved, executable playbooks/i)).toBeInTheDocument();
  });

  test("an executable=false playbook cannot be scheduled", () => {
    render(
      <CreateScheduleModal open playbooks={[NOT_EXECUTABLE_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />
    );
    expect(screen.getByText(/No approved, executable playbooks/i)).toBeInTheDocument();
  });

  test("production is never offered as an environment", async () => {
    const unsafePlaybook = { ...READY_PLAYBOOK, allowed_environments: ["test", "staging", "production"] };
    render(<CreateScheduleModal open playbooks={[unsafePlaybook]} onClose={jest.fn()} onCreated={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Playbook"), {
      target: { value: `${unsafePlaybook.key}:${unsafePlaybook.version}` },
    });
    const envSelect = await screen.findByLabelText("Environment");
    expect(within(envSelect).queryByRole("option", { name: "Production" })).not.toBeInTheDocument();
  });

  test("Test can be selected when the playbook allows it", async () => {
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Playbook"), {
      target: { value: `${READY_PLAYBOOK.key}:${READY_PLAYBOOK.version}` },
    });
    const envSelect = await screen.findByLabelText("Environment");
    expect(within(envSelect).getByRole("option", { name: "Test" })).toBeInTheDocument();
  });

  test("Staging can be selected when the playbook allows it", async () => {
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Playbook"), {
      target: { value: `${READY_PLAYBOOK.key}:${READY_PLAYBOOK.version}` },
    });
    const envSelect = await screen.findByLabelText("Environment");
    expect(within(envSelect).getByRole("option", { name: "Staging" })).toBeInTheDocument();
  });

  test("cadence choices match the backend contract exactly", () => {
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);
    const cadenceSelect = screen.getByLabelText("Cadence");
    const options = within(cadenceSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Hourly", "Daily", "Weekly"]);
  });

  test("POST body contains only backend-supported schedule fields, nothing probe/tool/capability/authority", async () => {
    authAxios.post.mockResolvedValue(scheduleResponse());
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);

    await fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Schedule" }));

    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(1));
    const [url, body] = authAxios.post.mock.calls[0];
    expect(url).toBe("/security-exercises/schedules/");
    expect(Object.keys(body).sort()).toEqual(
      ["cadence", "enabled", "environment", "name", "next_run_at", "playbook_key", "playbook_version", "target_control_key"].sort()
    );
    expect(body).not.toHaveProperty("probe_key");
    expect(body).not.toHaveProperty("tool");
    expect(body).not.toHaveProperty("capability");
    expect(body).not.toHaveProperty("authority");
    expect(body).not.toHaveProperty("agent_principal");
    expect(body).not.toHaveProperty("idempotency_key");
    expect(body).not.toHaveProperty("occurrence_id");
    expect(body).not.toHaveProperty("run_id");
  });

  test("a successful create calls onCreated with the backend response", async () => {
    authAxios.post.mockResolvedValue(scheduleResponse());
    const onCreated = jest.fn();
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={onCreated} />);

    await fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Schedule" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/was created and is enabled/i)).toBeInTheDocument();
  });

  test("a backend validation error surfaces safely without fabricating success", async () => {
    authAxios.post.mockRejectedValue({
      response: { status: 400, data: { error: "ENVIRONMENT_NOT_ALLOWED", detail: "Environment is not allowed for this playbook." } },
    });
    render(<CreateScheduleModal open playbooks={[READY_PLAYBOOK]} onClose={jest.fn()} onCreated={jest.fn()} />);

    await fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Schedule" }));

    expect(await screen.findByText("Environment is not allowed for this playbook.")).toBeInTheDocument();
    expect(screen.queryByText(/was created and is/i)).not.toBeInTheDocument();
  });
});
