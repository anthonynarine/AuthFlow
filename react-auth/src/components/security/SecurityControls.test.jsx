import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityControlsFilters } from "./SecurityControlsFilters";
import { SecurityControlsTable } from "./SecurityControlsTable";
import { SecurityControlDetailModal } from "./SecurityControlDetailModal";

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
});
