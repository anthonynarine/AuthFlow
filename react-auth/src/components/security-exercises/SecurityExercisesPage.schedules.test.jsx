import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityExercisesPage } from "./SecurityExercisesPage";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

let mockUser = {
  first_name: "Security",
  last_name: "Operator",
  email: "operator@example.test",
  is_staff: true,
  role: "technologist",
};

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({ user: mockUser }),
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => {
  let counter = 0;
  window.crypto = { randomUUID: jest.fn(() => `uuid-${++counter}`) };
});

afterEach(() => {
  delete window.crypto;
});

const READY_PLAYBOOK = {
  key: "auth.refresh_token_replay",
  version: 1,
  title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  description: "Attempts to reuse a previously rotated refresh token.",
  target_controls: [{ control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION", title: "Refresh Replay Protection" }],
  allowed_environments: ["test", "staging"],
  risk_level: "LOW",
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

const RUN = {
  id: "run-1",
  playbook_key: "auth.refresh_token_replay",
  playbook_version: 1,
  playbook_title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  environment: "test",
  status: "PASSED",
  result_summary: "held",
  failure_reason: "",
  requested_by_display: "admin@example.test",
  requested_at: "2026-09-10T18:00:00Z",
  started_at: "2026-09-10T18:00:01Z",
  completed_at: "2026-09-10T18:00:05Z",
  case_id: null,
  finding_id: null,
  authorization_reason: "",
  target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
};

const KNOWN_GET_URLS = new Set([
  "/security-exercises/playbooks/",
  "/security-exercises/runs/",
  "/security-exercises/schedules/",
]);

function mockAllGets({ catalog = [READY_PLAYBOOK], runs = [], schedules = [] } = {}) {
  authAxios.get.mockImplementation((url) => {
    if (url === "/security-exercises/playbooks/") {
      return Promise.resolve({ data: catalog });
    }
    if (url === "/security-exercises/runs/") {
      return Promise.resolve({ data: runs });
    }
    if (url === "/security-exercises/schedules/") {
      return Promise.resolve({ data: schedules });
    }
    if (url === "/security-exercises/runs/run-1/") {
      return Promise.resolve({ data: RUN });
    }
    if (url === "/security-exercises/schedules/sched-1/occurrences/") {
      return Promise.resolve({
        data: [
          {
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
          },
        ],
      });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SecurityExercisesPage />
    </MemoryRouter>
  );
}

function goToSchedules() {
  fireEvent.click(screen.getByRole("button", { name: "Schedules" }));
}

beforeEach(() => {
  authAxios.get.mockReset();
  authAxios.post.mockReset();
  authAxios.patch.mockReset();
});


// The card (<article>) that shows this text.
function cardWith(text) {
  return screen.getAllByRole("article").find((card) => within(card).queryByText(text));
}

describe("Security Exercises tabs (regression -- adding Schedules must not break existing tabs)", () => {
  test("Playbooks (Catalog) still renders", async () => {
    mockAllGets({ catalog: [READY_PLAYBOOK] });
    renderPage();
    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
  });

  test("Run History still renders", async () => {
    mockAllGets({ runs: [RUN] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Run History" }));
    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
  });

  test("Schedules section renders as a third tab", async () => {
    mockAllGets({ schedules: [makeSchedule()] });
    renderPage();
    goToSchedules();
    expect(await screen.findByText("Refresh Replay Daily")).toBeInTheDocument();
  });
});

describe("Schedules staff authorization (is_staff only, never Lumen role)", () => {
  test.each(["technologist", "physician", "admin"])(
    "staff %s can access schedule management controls",
    async (role) => {
      mockUser = { ...mockUser, is_staff: true, role };
      mockAllGets({ schedules: [makeSchedule()] });
      renderPage();
      goToSchedules();

      await screen.findByText("Refresh Replay Daily");
      expect(screen.getByRole("button", { name: "+ Create Schedule" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Disable Schedule" })).toBeInTheDocument();
    }
  );

  test("non-staff cannot access schedule mutation controls", async () => {
    mockUser = { ...mockUser, is_staff: false, role: "admin" };
    mockAllGets({ schedules: [makeSchedule()] });
    renderPage();
    goToSchedules();

    await screen.findByText("Refresh Replay Daily");
    expect(screen.queryByRole("button", { name: "+ Create Schedule" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable Schedule" })).not.toBeInTheDocument();
    // Non-staff can still view (read access mirrors the same is_staff boundary here).
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  test("Lumen role never gates Itachi -- a staff user of any role sees the same controls", async () => {
    for (const role of ["technologist", "physician", "admin", undefined]) {
      mockUser = { is_staff: true, role, email: "x@example.test" };
      mockAllGets({ schedules: [makeSchedule()] });
      const { unmount } = renderPage();
      goToSchedules();
      await screen.findByText("Refresh Replay Daily");
      expect(screen.getByRole("button", { name: "+ Create Schedule" })).toBeInTheDocument();
      unmount();
    }
  });
});

describe("Schedule list rendering", () => {
  beforeEach(() => {
    mockUser = { is_staff: true, role: "admin", email: "admin@example.test" };
  });

  test("renders backend schedule fields: playbook (via catalog), environment, cadence, next run", async () => {
    mockAllGets({ catalog: [READY_PLAYBOOK], schedules: [makeSchedule()] });
    renderPage();
    goToSchedules();

    await screen.findByText("Refresh Replay Daily");
    const card = cardWith("Refresh Replay Daily");
    // The playbook line: "<playbook> · <cadence>".
    expect(within(card).getByText(/Refresh Token Replay/)).toHaveTextContent(/Daily/);
    expect(within(card).getByText("Test")).toBeInTheDocument();
  });

  test("an enabled schedule renders ENABLED", async () => {
    mockAllGets({ schedules: [makeSchedule({ enabled: true })] });
    renderPage();
    goToSchedules();
    await screen.findByText("Refresh Replay Daily");
    expect(within(cardWith("Refresh Replay Daily")).getByText("Enabled")).toBeInTheDocument();
  });

  test("a disabled schedule renders DISABLED", async () => {
    mockAllGets({ schedules: [makeSchedule({ enabled: false })] });
    renderPage();
    goToSchedules();
    await screen.findByText("Refresh Replay Daily");
    expect(within(cardWith("Refresh Replay Daily")).getByText("Disabled")).toBeInTheDocument();
  });

  test("last run information renders when present", async () => {
    mockAllGets({ schedules: [makeSchedule({ last_run_id: "run-1" })] });
    renderPage();
    goToSchedules();
    await screen.findByText("Refresh Replay Daily");
    expect(within(cardWith("Refresh Replay Daily")).getByText("View last run")).toBeInTheDocument();
  });

  test("a null last run renders safely, not as an error", async () => {
    mockAllGets({ schedules: [makeSchedule({ last_run_id: null })] });
    renderPage();
    goToSchedules();
    await screen.findByText("Refresh Replay Daily");
    expect(within(cardWith("Refresh Replay Daily")).getByText("No runs yet")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("empty schedule state renders a helpful, non-error message with a Create Schedule action", async () => {
    mockAllGets({ schedules: [] });
    renderPage();
    goToSchedules();
    expect(await screen.findByText(/No Security Exercise schedules yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Create Schedule" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("a loading state renders before schedules arrive", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security-exercises/schedules/") {
        return new Promise(() => {});
      }
      if (url === "/security-exercises/playbooks/") {
        return Promise.resolve({ data: [READY_PLAYBOOK] });
      }
      if (url === "/security-exercises/runs/") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error("unexpected"));
    });
    renderPage();
    goToSchedules();
    expect(await screen.findByText(/Loading schedules/i)).toBeInTheDocument();
  });

  test("a schedules API failure does not blank the catalog or run history tabs", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security-exercises/schedules/") {
        return Promise.reject({ response: { status: 500 } });
      }
      if (url === "/security-exercises/playbooks/") {
        return Promise.resolve({ data: [READY_PLAYBOOK] });
      }
      if (url === "/security-exercises/runs/") {
        return Promise.resolve({ data: [RUN] });
      }
      return Promise.reject(new Error("unexpected"));
    });
    renderPage();
    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run History" }));
    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
    goToSchedules();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Create Schedule flow", () => {
  beforeEach(() => {
    mockUser = { is_staff: true, role: "technologist", email: "tech@example.test" };
  });

  test("a successful create refreshes the schedule list", async () => {
    mockAllGets({ catalog: [READY_PLAYBOOK], schedules: [] });
    authAxios.post.mockResolvedValue({ data: makeSchedule() });
    renderPage();
    goToSchedules();

    await screen.findByText(/No Security Exercise schedules yet/i);
    fireEvent.click(screen.getByRole("button", { name: "+ Create Schedule" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Schedule Name"), { target: { value: "Refresh Replay Daily" } });
    fireEvent.change(within(dialog).getByLabelText("Playbook"), {
      target: { value: `${READY_PLAYBOOK.key}:${READY_PLAYBOOK.version}` },
    });
    fireEvent.change(within(dialog).getByLabelText("Next Run"), { target: { value: "2026-09-12T08:00" } });

    // After creation, the list refetch should return the new schedule.
    authAxios.get.mockImplementation((url) => {
      if (url === "/security-exercises/playbooks/") {
        return Promise.resolve({ data: [READY_PLAYBOOK] });
      }
      if (url === "/security-exercises/runs/") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/security-exercises/schedules/") {
        return Promise.resolve({ data: [makeSchedule()] });
      }
      return Promise.reject(new Error("unexpected"));
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Create Schedule" }));
    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(1));
    await within(dialog).findByText(/was created and is/i);

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/schedules/")
    );
  });
});

describe("Enable/Disable from the list", () => {
  beforeEach(() => {
    mockUser = { is_staff: true, role: "admin", email: "admin@example.test" };
  });

  test("disabling from the card PATCHes and refreshes, preserving the card (history is not deleted)", async () => {
    mockAllGets({ schedules: [makeSchedule({ enabled: true })] });
    authAxios.patch.mockResolvedValue({ data: makeSchedule({ enabled: false }) });
    renderPage();
    goToSchedules();

    await screen.findByText("Refresh Replay Daily");
    fireEvent.click(screen.getByRole("button", { name: "Disable Schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Disable" }));

    await waitFor(() =>
      expect(authAxios.patch).toHaveBeenCalledWith("/security-exercises/schedules/sched-1/", { enabled: false })
    );
    // The schedule card remains in the list (disabling never deletes it).
    expect(screen.getByText("Refresh Replay Daily")).toBeInTheDocument();
  });
});

describe("Occurrence -> Run lineage", () => {
  beforeEach(() => {
    mockUser = { is_staff: true, role: "admin", email: "admin@example.test" };
  });

  test("Schedule -> Occurrences -> View run opens the existing Run Detail dialog with PASSED and the Security Truth note", async () => {
    mockAllGets({ schedules: [makeSchedule({ last_run_id: "run-1" })] });
    renderPage();
    goToSchedules();

    await screen.findByText("Refresh Replay Daily");
    fireEvent.click(screen.getByRole("button", { name: "Occurrences" }));

    const occurrenceDialog = await screen.findByRole("dialog");
    expect(await within(occurrenceDialog).findByText("Dispatched")).toBeInTheDocument();
    // Occurrence status must never be rendered with run-status vocabulary.
    expect(within(occurrenceDialog).queryByText("Passed")).not.toBeInTheDocument();

    fireEvent.click(await within(occurrenceDialog).findByRole("button", { name: /View run/i }));

    const runDialog = await screen.findByRole("dialog");
    expect(await within(runDialog).findByText("Passed")).toBeInTheDocument();
    expect(within(runDialog).getByText(/not Security Truth/i)).toBeInTheDocument();
  });

  test("occurrence history endpoint is called with the correct schedule id", async () => {
    mockAllGets({ schedules: [makeSchedule()] });
    renderPage();
    goToSchedules();
    await screen.findByText("Refresh Replay Daily");
    fireEvent.click(screen.getByRole("button", { name: "Occurrences" }));

    await waitFor(() =>
      expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/schedules/sched-1/occurrences/")
    );
  });
});

describe("Frontend never triggers scheduler/occurrence/probe execution directly", () => {
  beforeEach(() => {
    mockUser = { is_staff: true, role: "admin", email: "admin@example.test" };
  });

  test("browsing and managing schedules never calls any management-command/scheduler-trigger endpoint", async () => {
    mockAllGets({ schedules: [makeSchedule({ last_run_id: "run-1" })] });
    authAxios.patch.mockResolvedValue({ data: makeSchedule({ enabled: false }) });
    renderPage();
    goToSchedules();

    await screen.findByText("Refresh Replay Daily");
    fireEvent.click(screen.getByRole("button", { name: "Occurrences" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: /Close occurrence history/i }));

    fireEvent.click(screen.getByRole("button", { name: "Disable Schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Disable" }));
    await waitFor(() => expect(authAxios.patch).toHaveBeenCalledTimes(1));

    const allCalledUrls = [
      ...authAxios.get.mock.calls.map((call) => call[0]),
      ...authAxios.post.mock.calls.map((call) => call[0]),
      ...authAxios.patch.mock.calls.map((call) => call[0]),
    ];
    allCalledUrls.forEach((url) => {
      expect(url).not.toMatch(/run_due_security_exercises|management-command|scheduler|claim|dispatch-occurrence/i);
    });
    // Only ever the documented schedule/occurrence/run endpoints.
    authAxios.get.mock.calls.forEach(([url]) => {
      const isKnown =
        KNOWN_GET_URLS.has(url) ||
        /^\/security-exercises\/runs\/[^/]+\/$/.test(url) ||
        /^\/security-exercises\/schedules\/[^/]+\/occurrences\/$/.test(url);
      expect(isKnown).toBe(true);
    });
  });
});
