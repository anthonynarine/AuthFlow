import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SecurityCommandPage from "./SecurityCommandPage";
import { authAxios } from "../../interceptors/axios";
import { __resetSecurityHelpCacheForTests } from "../../hooks/useSecurityHelp";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({
    user: { first_name: "Security", last_name: "Staff", email: "security@example.test" },
  }),
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("../../hooks/useSecurityPosture", () => ({
  useSecurityPosture: () => ({
    posture: {
      overall_status: "needs_attention",
      overall_status_label: "Needs attention",
      last_evaluated_at: "2026-09-07T18:00:00Z",
      controls: {
        healthy: 2,
        needs_attention: 0,
        control_failure: 3,
        unknown: 7,
        not_applicable: 0,
      },
      open_findings: {
        critical: 0,
        high: 4,
        warning: 0,
        info: 0,
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useActiveSecurityCases", () => ({
  useActiveSecurityCases: () => ({
    cases: [
      {
        id: "case-1234567890",
        finding_id: "finding-1234567890",
        finding_title: "Refresh Replay Failure",
        status_label: "Awaiting approval",
        updated_at: "2026-09-07T18:10:00Z",
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityCaseSnapshot", () => ({
  useSecurityCaseSnapshot: () => ({
    snapshot: {
      current_state_label: "Awaiting deployment approval",
      human_attention_state: "HUMAN_APPROVAL_REQUIRED",
      human_attention_label: "Human approval required",
      human_attention_reason: "Validated repair is ready for human review.",
      next_available_action: null,
      next_available_action_label: "Human Approval",
      specialists: {
        investigator: { status: "COMPLETE", label: "Complete" },
        red_team: { status: "COMPLETE", label: "Reproduced" },
        repair: { status: "COMPLETE", label: "Complete" },
        validator: { status: "COMPLETE", label: "Valid" },
        deployer: { status: "LOCKED", label: "Locked" },
      },
    },
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityCaseTimeline", () => ({
  useSecurityCaseTimeline: () => ({
    events: [],
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityCopilot", () => ({
  useSecurityCopilot: () => ({
    messages: [],
    send: jest.fn(),
    clear: jest.fn(),
    isSending: false,
    error: null,
  }),
}));

const HELP_TOPICS = [
  {
    key: "security_posture",
    title: "Security Posture",
    short_description: "Gait's current summary of registered security-control health.",
    why_it_matters: "It is the fastest way to see whether Gait's security controls are functioning as expected.",
    status_explanations: {
      HEALTHY: "Trusted evidence currently satisfies this control's evaluation requirements.",
      CONTROL_FAILURE: "The latest authoritative evidence indicates the expected protection is not satisfied.",
    },
  },
  {
    key: "active_cases",
    title: "Active Cases",
    short_description: "The security workflows currently in progress.",
    why_it_matters: "This is the operator's queue: what is currently in flight.",
  },
  {
    key: "human_attention",
    title: "Human Attention",
    short_description: "Whether a human decision or action is actually required right now.",
    why_it_matters: "The model does not decide when human approval is required.",
    status_explanations: {
      HUMAN_APPROVAL_REQUIRED: "A Human Approver must review the exact validated artifact before release.",
      NO_ACTION_REQUIRED: "No human decision is currently waiting.",
    },
  },
  {
    key: "selected_case",
    title: "Selected Case",
    short_description: "The one security case currently open for detailed review.",
  },
  {
    key: "specialist_workflow",
    title: "Specialist Workflow",
    short_description: "The fixed chain of specialists that handle a security case.",
    what_it_is:
      "Every case moves through a deterministic chain: Incident Commander coordinates and routes; Blue Team investigates and diagnoses; Red Team safely reproduces the weakness; Green Team proposes a repair; Security Validator independently verifies it; a Human Approver authorizes it; Release Engineer deploys it.",
  },
  {
    key: "case_timeline",
    title: "Case Timeline",
    short_description: "The ordered history of everything that happened on one case.",
  },
  {
    key: "security_copilot",
    title: "Security Copilot",
    short_description: "A read-only, natural-language explanation layer over trusted Gait state.",
    why_it_matters: "Security Copilot cannot approve or deploy anything from chat.",
  },
  {
    key: "human_review",
    title: "Human Review",
    short_description: "What a human should inspect before approving an exact artifact.",
  },
  {
    key: "security_validation",
    title: "Security Validation",
    short_description: "Independent verification of one exact proposed repair.",
    why_it_matters: "Repair proposes. Validation verifies. Neither can deploy.",
  },
  {
    key: "deployment",
    title: "Deployment",
    short_description: "Releasing one exact, human-approved artifact -- never arbitrary code.",
  },
  {
    key: "post_deploy_verification",
    title: "Post-Deploy Verification",
    short_description: "Deployment succeeding is not the same as the security issue being fixed.",
    status_explanations: {
      SUCCEEDED: "The control was independently re-evaluated as healthy from trusted evidence, and the finding was resolved.",
      FAILED: "The control is still not healthy after deployment. The finding remains open and needs further investigation.",
    },
  },
];

describe("Security Command page info controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityHelpCacheForTests();
    authAxios.get.mockResolvedValue({ data: HELP_TOPICS });
  });

  test("wires backend help metadata to every major command container", async () => {
    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    const labels = [
      "Explain Security Posture",
      "Explain Active Cases",
      "Explain Human Approver Attention",
      "Explain Selected Case",
      "Explain Specialist Workflow",
      "Explain Case Timeline",
      "Explain Security Copilot",
      "Explain Human Review",
      "Explain Security Validation",
      "Explain Deployment",
      "Explain Post-Deploy Verification",
    ];

    for (const label of labels) {
      expect(await screen.findByRole("button", { name: label })).toBeInTheDocument();
    }

    expect(authAxios.get).toHaveBeenCalledWith("/security/help/");
    // The registry is fetched once and shared across every SecurityInfoButton on the page.
    expect(authAxios.get.mock.calls.filter(([url]) => url === "/security/help/")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Explain Security Copilot" }));
    expect(screen.getByRole("dialog", { name: "Security Copilot" })).toBeInTheDocument();
    expect(screen.getByText(/Security Copilot cannot approve or deploy anything from chat/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Explain Specialist Workflow" }));
    expect(screen.getByText(/Incident Commander coordinates and routes/i)).toBeInTheDocument();
    expect(screen.getByText(/Blue Team investigates and diagnoses/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Human Approver/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Explain Human Approver Attention" }));
    expect(screen.getByText("Current status meaning")).toBeInTheDocument();
    expect(screen.getByText("HUMAN APPROVAL REQUIRED")).toBeInTheDocument();
    expect(
      screen.getByText("A Human Approver must review the exact validated artifact before release.")
    ).toBeInTheDocument();
    expect(screen.queryByText("No human decision is currently waiting.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Explain Post-Deploy Verification" }));
    expect(screen.getByRole("dialog", { name: "Post-Deploy Verification" })).toBeInTheDocument();
    expect(
      screen.getByText(/Deployment succeeding is not the same as the security issue being fixed/i)
    ).toBeInTheDocument();
  });

  test("does not fabricate validation/deployment/post-deploy help when those topics are absent", async () => {
    authAxios.get.mockResolvedValue({
      data: HELP_TOPICS.filter(
        (topic) => !["security_validation", "deployment", "post_deploy_verification"].includes(topic.key)
      ),
    });

    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("VALIDATION")).toBeInTheDocument();
    expect(screen.getByText("POST-DEPLOY VERIFICATION")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explain Security Validation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explain Deployment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explain Post-Deploy Verification" })).not.toBeInTheDocument();
  });

  test("does not break Security Command when the help API fails", async () => {
    authAxios.get.mockRejectedValue({ response: { status: 500 } });

    render(
      <MemoryRouter>
        <SecurityCommandPage />
      </MemoryRouter>
    );

    // Real security state still renders.
    expect((await screen.findAllByText("Refresh Replay Failure")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs attention").length).toBeGreaterThan(0);

    // No info buttons are shown for topics that never loaded -- omitted, not broken.
    expect(screen.queryByRole("button", { name: "Explain Security Posture" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explain Active Cases" })).not.toBeInTheDocument();
  });
});
