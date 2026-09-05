import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { SecurityFindingsTable } from "./SecurityFindingsTable";
import { SecurityFindingDetailModal } from "./SecurityFindingDetailModal";

function makeFinding(overrides = {}) {
  return {
    id: "finding-1",
    finding_key: "GAIT.MFA.TOTP.ROTATION_OVERDUE",
    control: "control-1",
    control_key: "GAIT.MFA.TOTP",
    control_title: "TOTP multi-factor authentication",
    domain: "MFA",
    domain_label: "Multi-factor authentication",
    severity: "WARNING",
    status: "OPEN",
    status_label: "Open",
    title: "TOTP secret rotation overdue",
    description: "The TOTP secret has not rotated within policy.",
    expected_behavior: "Secrets rotate every 180 days.",
    observed_behavior: "Secret has not rotated in 210 days.",
    affected_system: "django_auth",
    affected_component: "user.totp",
    source_type: "AUTOMATED_TEST",
    source_reference: "run-456",
    first_seen_at: "2026-07-01T00:00:00Z",
    last_seen_at: "2026-08-29T00:00:00Z",
    resolved_at: null,
    resolution_summary: "",
    metadata: {},
    evidence_ids: ["evidence-1", "evidence-2"],
    related_event_ids: ["event-1"],
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-08-29T00:00:00Z",
    ...overrides,
  };
}

describe("SecurityFindingsTable", () => {
  test("list renders finding title, control, severity, and status", () => {
    render(
      <SecurityFindingsTable
        findings={[makeFinding()]}
        count={1}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectFinding={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("TOTP secret rotation overdue")).toBeInTheDocument();
    expect(screen.getByText("GAIT.MFA.TOTP")).toBeInTheDocument();
    expect(screen.getByText("WARNING")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  test("accepted risk and false positive findings remain visible, not hidden", () => {
    const findings = [
      makeFinding({ id: "f-accepted", status: "ACCEPTED_RISK", status_label: "Accepted risk", title: "Accepted risk finding" }),
      makeFinding({ id: "f-false", status: "FALSE_POSITIVE", status_label: "False positive", title: "False positive finding" }),
    ];

    render(
      <SecurityFindingsTable
        findings={findings}
        count={findings.length}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectFinding={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Accepted risk finding")).toBeInTheDocument();
    expect(screen.getByText("False positive finding")).toBeInTheDocument();
    expect(screen.getByText("Accepted risk")).toBeInTheDocument();
    expect(screen.getByText("False positive")).toBeInTheDocument();
  });

  test("empty state is shown when no findings match filters", () => {
    render(
      <SecurityFindingsTable
        findings={[]}
        count={0}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectFinding={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("No findings match the current filters.")).toBeInTheDocument();
  });
});

describe("SecurityFindingDetailModal", () => {
  test("renders finding sections, first/last seen, and related record ids", async () => {
    const onLoad = jest.fn().mockResolvedValue({});
    const finding = makeFinding();

    render(
      <SecurityFindingDetailModal
        findingId="finding-1"
        finding={finding}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("finding-1"));
    expect(screen.getByText("Expected behavior")).toBeInTheDocument();
    expect(screen.getByText("Secrets rotate every 180 days.")).toBeInTheDocument();
    expect(screen.getByText("Secret has not rotated in 210 days.")).toBeInTheDocument();
    expect(screen.getByText("First seen")).toBeInTheDocument();
    expect(screen.getByText("Last seen")).toBeInTheDocument();
    expect(screen.getByText("Related evidence")).toBeInTheDocument();
    expect(screen.getByText("Related security events")).toBeInTheDocument();
    expect(screen.queryByText(/occurrence/i)).not.toBeInTheDocument();
  });

  test("shows empty states when a finding has no related evidence or events", async () => {
    const onLoad = jest.fn().mockResolvedValue({});
    const finding = makeFinding({ evidence_ids: [], related_event_ids: [] });

    render(
      <SecurityFindingDetailModal
        findingId="finding-1"
        finding={finding}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(screen.getByText("No evidence has been recorded for this finding yet.")).toBeInTheDocument();
    expect(screen.getByText("No related security events recorded.")).toBeInTheDocument();
  });
});
