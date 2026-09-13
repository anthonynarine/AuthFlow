import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityControlsFilters } from "./SecurityControlsFilters";
import { SecurityControlsTable } from "./SecurityControlsTable";
import { SecurityControlDetailModal } from "./SecurityControlDetailModal";

// SecurityControlDetailModal now navigates to Security Command for its
// B-UX3 "Teach this" action, so every render needs a Router ancestor.
function render(ui) {
  return rtlRender(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// SecurityControlDetailModal renders SecurityInfoButton, whose "Learn more"
// affordance lazily imports the real authAxios client via this hook; stub
// it so these tests never touch the network (or the real, unmockable axios
// package Jest can't parse here).
jest.mock("../../hooks/useSecurityLearning", () => ({
  fetchLearningTopic: jest.fn(() => Promise.reject(new Error("not mocked in this test"))),
  useSecurityLearningIndex: () => ({ topics: [], isLoading: false, error: null, retry: jest.fn() }),
  __resetSecurityLearningCacheForTests: jest.fn(),
}));

const domains = [
  { key: "MFA", label: "Multi-factor authentication" },
  { key: "SESSION", label: "Session" },
];

const baseControl = {
  id: "control-1",
  control_key: "GAIT.MFA.TOTP",
  domain: "MFA",
  domain_label: "Multi-factor authentication",
  title: "TOTP multi-factor authentication",
  description: "Users may enroll a TOTP authenticator.",
  control_type: "LIVE",
  control_type_label: "Live",
  lifecycle: "IMPLEMENTED",
  lifecycle_label: "Implemented",
  status: "NEEDS_ATTENTION",
  status_label: "Needs attention",
  status_reason: "Evidence is stale.",
  severity_if_failed: "HIGH",
  severity_if_failed_label: "High",
  last_evaluated_at: "2026-08-30T00:00:00Z",
  last_evidence_at: "2026-08-29T00:00:00Z",
  next_review_at: "2026-09-30T00:00:00Z",
};

describe("SecurityControlsTable", () => {
  test("list renders control rows with domain, key, and status", () => {
    render(
      <SecurityControlsTable
        controls={[baseControl]}
        isLoading={false}
        error={null}
        onSelectControl={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("TOTP multi-factor authentication")).toBeInTheDocument();
    expect(screen.getByText("GAIT.MFA.TOTP")).toBeInTheDocument();
    expect(screen.getByText("Multi-factor authentication")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  test("uses the backend status_label instead of client-side title-casing", () => {
    render(
      <SecurityControlsTable
        controls={[baseControl]}
        isLoading={false}
        error={null}
        onSelectControl={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.queryByText("Needs Attention")).not.toBeInTheDocument();
  });

  test("UNKNOWN control does not render as healthy", () => {
    const unknownControl = { ...baseControl, status: "UNKNOWN", status_label: "Unknown" };
    const { container } = render(
      <SecurityControlsTable
        controls={[unknownControl]}
        isLoading={false}
        error={null}
        onSelectControl={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText("Healthy")).not.toBeInTheDocument();
    expect(container.querySelector(".control-status-unknown")).toBeInTheDocument();
    expect(container.querySelector(".control-status-healthy")).not.toBeInTheDocument();
  });

  test("Domain column header explains the domain glossary in plain language", () => {
    render(
      <SecurityControlsTable
        controls={[baseControl]}
        isLoading={false}
        error={null}
        onSelectControl={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain Security Domains" }));
    expect(screen.getByRole("dialog", { name: "Security Domains" })).toBeInTheDocument();
    expect(
      screen.getByText("A second proof of identity beyond just a password.")
    ).toBeInTheDocument();
  });

  test("Type column header explains the control-type glossary in plain language", () => {
    render(
      <SecurityControlsTable
        controls={[baseControl]}
        isLoading={false}
        error={null}
        onSelectControl={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain Control Types" }));
    expect(screen.getByRole("dialog", { name: "Control Types" })).toBeInTheDocument();
    expect(screen.getByText("Continuously or operationally evaluated.")).toBeInTheDocument();
  });

  test("empty state is shown when no controls match filters", () => {
    render(
      <SecurityControlsTable controls={[]} isLoading={false} error={null} onSelectControl={jest.fn()} onRetry={jest.fn()} />
    );

    expect(screen.getByText("No controls match the current filters.")).toBeInTheDocument();
  });
});

describe("SecurityControlsFilters", () => {
  test("domain, status, and type changes call onChange with backend filter values", () => {
    const onChange = jest.fn();
    render(
      <SecurityControlsFilters
        filters={{ domain: "", status: "", control_type: "" }}
        domains={domains}
        onChange={onChange}
        onReset={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "MFA" } });
    expect(onChange).toHaveBeenCalledWith("domain", "MFA");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "CONTROL_FAILURE" } });
    expect(onChange).toHaveBeenCalledWith("status", "CONTROL_FAILURE");

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "MANUAL" } });
    expect(onChange).toHaveBeenCalledWith("control_type", "MANUAL");
  });

  test("reset button calls onReset", () => {
    const onReset = jest.fn();
    render(
      <SecurityControlsFilters
        filters={{ domain: "", status: "", control_type: "" }}
        domains={domains}
        onChange={jest.fn()}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByText("Reset"));
    expect(onReset).toHaveBeenCalled();
  });
});

describe("SecurityControlDetailModal", () => {
  test("renders control sections, related evidence, and related findings", async () => {
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = {
      ...baseControl,
      recent_evidence: [
        {
          id: "evidence-1",
          title: "TOTP verification succeeded",
          evidence_type_label: "Automated test",
          result: "PASS",
          result_label: "Pass",
          observed_at: "2026-08-29T00:00:00Z",
          is_stale: false,
        },
      ],
      open_findings: [
        {
          id: "finding-1",
          title: "TOTP secret rotation overdue",
          severity: "WARNING",
          status: "OPEN",
          status_label: "Open",
          first_seen_at: "2026-08-01T00:00:00Z",
          last_seen_at: "2026-08-29T00:00:00Z",
        },
      ],
    };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("GAIT.MFA.TOTP"));
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Evidence is stale.")).toBeInTheDocument();
    expect(screen.getByText("TOTP verification succeeded")).toBeInTheDocument();
    expect(screen.getByText("TOTP secret rotation overdue")).toBeInTheDocument();
  });

  test("B-UX3 Teach this asks Sage a status-aware question for an unhealthy control", async () => {
    mockNavigate.mockReset();
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = { ...baseControl, recent_evidence: [], open_findings: [] };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Teach this" }));

    expect(mockNavigate).toHaveBeenCalledWith("/security-command", {
      state: { sagePrompt: "Why is TOTP multi-factor authentication needs attention?" },
    });
  });

  test("B-UX3 Teach this asks a plain explain question for a healthy control", async () => {
    mockNavigate.mockReset();
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = { ...baseControl, status: "HEALTHY", status_label: "Healthy", recent_evidence: [], open_findings: [] };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Teach this" }));

    expect(mockNavigate).toHaveBeenCalledWith("/security-command", {
      state: { sagePrompt: "Explain TOTP multi-factor authentication" },
    });
  });

  test("shows an empty state when a control has no evidence or findings yet", async () => {
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = { ...baseControl, recent_evidence: [], open_findings: [] };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(screen.getByText("No evidence has been recorded for this control yet.")).toBeInTheDocument();
    expect(screen.getByText("No findings match the current filters.")).toBeInTheDocument();
  });

  test("renders a control-level info button when the control has authored help", async () => {
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = {
      ...baseControl,
      recent_evidence: [],
      open_findings: [],
      help: {
        title: "TOTP Multi-Factor Authentication Enforcement",
        short_description: "Accounts with TOTP enabled must complete the additional factor.",
        healthy_means: "Accounts with TOTP enabled cannot complete authentication without a valid one-time code.",
        status_explanation: "Trusted evidence shows the latest evidence is stale.",
      },
    };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    const infoButton = screen.getByRole("button", { name: "Explain TOTP Multi-Factor Authentication Enforcement" });
    fireEvent.click(infoButton);

    expect(
      screen.getByRole("dialog", { name: "TOTP Multi-Factor Authentication Enforcement" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Accounts with TOTP enabled must complete the additional factor.")
    ).toBeInTheDocument();
    expect(screen.getByText("What does HEALTHY mean?")).toBeInTheDocument();
    expect(screen.getByText("What does the current status mean?")).toBeInTheDocument();
    expect(screen.getByText("Trusted evidence shows the latest evidence is stale.")).toBeInTheDocument();
  });

  test("omits the info button rather than breaking the row when a control has no authored help", async () => {
    const onLoad = jest.fn().mockResolvedValue(baseControl);
    const control = { ...baseControl, recent_evidence: [], open_findings: [], help: null };

    render(
      <SecurityControlDetailModal
        controlKey="GAIT.MFA.TOTP"
        control={control}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(screen.getByText("TOTP multi-factor authentication")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Explain /i })).not.toBeInTheDocument();
  });
});
