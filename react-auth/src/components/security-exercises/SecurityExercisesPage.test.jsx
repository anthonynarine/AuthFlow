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
  },
}));

// `mockUser` is reassigned per test to exercise different is_staff/role
// combinations. Jest hoists jest.mock() above this declaration, but the
// factory's arrow function body only runs later, when a rendered component
// actually calls useBasicAuthServices() -- by which point mockUser already
// holds the value the test set. (Variable must be prefixed "mock" for
// Jest's out-of-scope-reference allowlist to permit this.)
//
// Gait Security Exercise access is is_staff only -- role is Lumen's own
// business-role model and must never gate Minato. The default role here is
// deliberately a non-admin one to prove that.
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

// window.crypto is not implemented at all in this project's jsdom test
// environment (jsdom 16); every submission path needs a UUID source.
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
  threat_class: "Token replay",
  threat_summary: "Verifies a rotated refresh token cannot be reused.",
  allowed_environments: ["test"],
  required_capability: "exercise.auth.refresh_replay",
  required_authority: { level: 2, label: "L2 Bounded Probe" },
  expected_secure_behavior: "The replayed refresh token is rejected.",
  failure_condition: "The replayed refresh token is accepted.",
  evidence_type: "AUTOMATED_TEST",
  evidence_summary: "Captures the HTTP response.",
  timeout_seconds: 30,
  resource_budget: { max_requests: 5, concurrency_limit: 1, max_runtime_seconds: 30 },
  risk_level: "LOW",
  tags: ["auth"],
  applicability: [],
  prerequisites: [],
  implementation_status: "IMPLEMENTED",
  executable: true,
};

const PLANNED_PLAYBOOK = {
  ...READY_PLAYBOOK,
  key: "deployment.approval_replay",
  title: "Deployment Approval Replay",
  category: "DEPLOYMENT_SECURITY",
  target_controls: [],
  implementation_status: "PLANNED",
  executable: false,
};

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

function mockCatalogAndHistory({ catalog = [READY_PLAYBOOK, PLANNED_PLAYBOOK], runs = [RUN] } = {}) {
  authAxios.get.mockImplementation((url) => {
    if (url === "/security-exercises/playbooks/") {
      return Promise.resolve({ data: catalog });
    }
    if (url === "/security-exercises/runs/") {
      return Promise.resolve({ data: runs });
    }
    if (url.startsWith("/security-exercises/runs/")) {
      return Promise.resolve({ data: runs[0] });
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

describe("SecurityExercisesPage catalog", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
    authAxios.post.mockReset();
    mockUser = {
      first_name: "Security",
      last_name: "Admin",
      email: "admin@example.test",
      is_staff: true,
      role: "admin",
    };
  });

  test("loads the catalog and renders category, control, and environment info", async () => {
    mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
    renderPage();

    const title = await screen.findByText("Refresh Token Replay");
    const card = title.closest("article");
    expect(within(card).getByText("Authentication")).toBeInTheDocument();
    expect(within(card).getByText("Refresh Replay Protection")).toBeInTheDocument();
    expect(within(card).getByText("Test")).toBeInTheDocument();
  });

  test("distinguishes a Ready (implemented) exercise from a Planned one, and only Ready offers Run", async () => {
    mockCatalogAndHistory();
    renderPage();

    await screen.findByText("Refresh Token Replay");
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();

    const runButtons = screen.getAllByRole("button", { name: "Run Exercise" });
    expect(runButtons).toHaveLength(1);

    const plannedCard = screen.getByText("Deployment Approval Replay").closest("article");
    expect(plannedCard).not.toBeNull();
    expect(within(plannedCard).queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
  });

  test("a catalog request failure does not blank run history", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security-exercises/playbooks/") {
        return Promise.reject({ response: { status: 500 } });
      }
      if (url === "/security-exercises/runs/") {
        return Promise.resolve({ data: [RUN] });
      }
      return Promise.reject(new Error("unexpected"));
    });
    renderPage();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run History" }));
    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
  });

  test("a history request failure does not blank the catalog", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security-exercises/playbooks/") {
        return Promise.resolve({ data: [READY_PLAYBOOK] });
      }
      if (url === "/security-exercises/runs/") {
        return Promise.reject({ response: { status: 500 } });
      }
      return Promise.reject(new Error("unexpected"));
    });
    renderPage();

    expect(await screen.findByText("Refresh Token Replay")).toBeInTheDocument();
  });

  test("category filter requests the backend with the selected category", async () => {
    mockCatalogAndHistory();
    renderPage();
    await screen.findByText("Refresh Token Replay");

    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "AUTHENTICATION" } });

    await waitFor(() =>
      expect(authAxios.get).toHaveBeenCalledWith("/security-exercises/playbooks/", {
        params: { category: "AUTHENTICATION" },
      })
    );
  });

  test("View Details opens the real backend playbook content in a dialog", async () => {
    mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
    renderPage();
    await screen.findByText("Refresh Token Replay");

    fireEvent.click(screen.getByRole("button", { name: "View Details" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Refresh Token Replay")).toBeInTheDocument();
    expect(within(dialog).getByText(READY_PLAYBOOK.threat_summary)).toBeInTheDocument();
  });

  test("Run Exercise from within the detail dialog opens the confirmation and submits only safe fields", async () => {
    mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
    authAxios.post.mockResolvedValue({
      data: { id: "run-9", playbook_key: READY_PLAYBOOK.key, playbook_version: 1, environment: "test", status: "PASSED", requested_at: new Date().toISOString() },
    });
    renderPage();
    await screen.findByText("Refresh Token Replay");

    fireEvent.click(screen.getByRole("button", { name: "View Details" }));
    const detailDialog = await screen.findByRole("dialog");
    fireEvent.click(within(detailDialog).getByRole("button", { name: "Run Exercise" }));

    // The detail dialog closes and the run-confirmation dialog takes over.
    const runDialog = await screen.findByRole("dialog", { name: "Refresh Token Replay" });
    expect(within(runDialog).getByText(/Incident Commander/)).toBeInTheDocument();

    fireEvent.click(within(runDialog).getByRole("button", { name: "Confirm and Run" }));

    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(1));
    expect(authAxios.post).toHaveBeenCalledWith(
      "/security-exercises/runs/",
      {
        playbook_key: "auth.refresh_token_replay",
        playbook_version: 1,
        environment: "test",
        target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
      },
      { headers: { "Idempotency-Key": expect.any(String) } }
    );
  });
});

describe("SecurityExercisesPage Run Exercise visibility (is_staff only, never Lumen role)", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
    authAxios.post.mockReset();
  });

  test.each(["technologist", "physician", "admin"])(
    "staff %s sees Run Exercise on a Ready, executable playbook",
    async (role) => {
      mockUser = { ...mockUser, is_staff: true, role };
      mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
      renderPage();

      await screen.findByText("Refresh Token Replay");
      expect(screen.getByRole("button", { name: "Run Exercise" })).toBeInTheDocument();
      expect(screen.queryByText("View only")).not.toBeInTheDocument();
    }
  );

  test.each(["technologist", "physician", "admin", undefined])(
    "non-staff denies Run Exercise regardless of role (role=%s)",
    async (role) => {
      mockUser = { ...mockUser, is_staff: false, role };
      mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
      renderPage();

      await screen.findByText("Refresh Token Replay");
      expect(screen.queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
      expect(screen.getByText("View only")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "View Details" })).toBeInTheDocument();
    }
  );

  test("a staff user still never sees Run Exercise on a Planned playbook", async () => {
    mockUser = { ...mockUser, is_staff: true, role: "technologist" };
    mockCatalogAndHistory({ catalog: [PLANNED_PLAYBOOK] });
    renderPage();

    await screen.findByText("Deployment Approval Replay");
    expect(screen.queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
  });

  test("a staff user still never sees Run Exercise when executable is false", async () => {
    mockUser = { ...mockUser, is_staff: true, role: "technologist" };
    const notExecutable = { ...READY_PLAYBOOK, key: "auth.step_up_bypass", title: "Step-Up Bypass", executable: false };
    mockCatalogAndHistory({ catalog: [notExecutable] });
    renderPage();

    await screen.findByText("Step-Up Bypass");
    expect(screen.queryByRole("button", { name: "Run Exercise" })).not.toBeInTheDocument();
  });

  test("Run Exercise submission still POSTs only the safe playbook-level fields for a non-admin staff operator", async () => {
    mockUser = { ...mockUser, is_staff: true, role: "technologist" };
    mockCatalogAndHistory({ catalog: [READY_PLAYBOOK] });
    authAxios.post.mockResolvedValue({
      data: { id: "run-9", playbook_key: READY_PLAYBOOK.key, playbook_version: 1, environment: "test", status: "PASSED", requested_at: new Date().toISOString() },
    });
    renderPage();

    await screen.findByText("Refresh Token Replay");
    fireEvent.click(screen.getByRole("button", { name: "Run Exercise" }));
    const runDialog = await screen.findByRole("dialog", { name: "Refresh Token Replay" });
    fireEvent.click(within(runDialog).getByRole("button", { name: "Confirm and Run" }));

    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(1));
    expect(authAxios.post).toHaveBeenCalledWith(
      "/security-exercises/runs/",
      {
        playbook_key: "auth.refresh_token_replay",
        playbook_version: 1,
        environment: "test",
        target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
      },
      { headers: { "Idempotency-Key": expect.any(String) } }
    );
  });

  test("production is never offered as an environment, regardless of staff role", async () => {
    mockUser = { ...mockUser, is_staff: true, role: "physician" };
    const unsafePlaybook = { ...READY_PLAYBOOK, allowed_environments: ["test", "staging", "production"] };
    mockCatalogAndHistory({ catalog: [unsafePlaybook] });
    renderPage();

    await screen.findByText("Refresh Token Replay");
    fireEvent.click(screen.getByRole("button", { name: "Run Exercise" }));
    const runDialog = await screen.findByRole("dialog", { name: "Refresh Token Replay" });
    const select = within(runDialog).getByRole("combobox");
    expect(within(select).queryByRole("option", { name: "Production" })).not.toBeInTheDocument();
  });
});

describe("SecurityExercisesPage run history", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
    mockUser = {
      first_name: "Security",
      last_name: "Admin",
      email: "admin@example.test",
      is_staff: true,
      role: "admin",
    };
  });

  test("renders past runs and opens a run's detail with Security Truth separation", async () => {
    mockCatalogAndHistory();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Run History" }));
    fireEvent.click(await screen.findByText("Refresh Token Replay"));

    expect(await screen.findByText(/not Security Truth/i)).toBeInTheDocument();
    expect(screen.getByText(/demonstrated the expected secure behavior/i)).toBeInTheDocument();
  });
});
