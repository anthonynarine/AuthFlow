import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { SecurityEvidenceTable } from "./SecurityEvidenceTable";
import { SecurityEvidenceDetailModal } from "./SecurityEvidenceDetailModal";

function makeEvidence(overrides = {}) {
  return {
    id: "evidence-1",
    control: "control-1",
    control_key: "GAIT.MFA.TOTP",
    control_title: "TOTP multi-factor authentication",
    domain: "MFA",
    domain_label: "Multi-factor authentication",
    evidence_type: "AUTOMATED_TEST",
    evidence_type_label: "Automated test",
    source_type: "ci",
    source_name: "auth-security-ci",
    source_reference: "run-123",
    title: "TOTP verification test",
    summary: "Automated verification of TOTP enrollment.",
    result: "PASS",
    result_label: "Pass",
    observed_at: "2026-08-29T00:00:00Z",
    valid_until: "2026-09-29T00:00:00Z",
    is_stale: false,
    metadata: {},
    created_at: "2026-08-29T00:05:00Z",
    ...overrides,
  };
}

describe("SecurityEvidenceTable", () => {
  test("evidence list renders title, control, and type", () => {
    render(
      <SecurityEvidenceTable
        evidence={[makeEvidence()]}
        count={1}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvidence={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("TOTP verification test")).toBeInTheDocument();
    expect(screen.getByText("TOTP multi-factor authentication")).toBeInTheDocument();
    expect(screen.getByText("GAIT.MFA.TOTP")).toBeInTheDocument();
    expect(screen.getByText("Automated test")).toBeInTheDocument();
  });

  test("renders every evidence result label distinctly", () => {
    const rows = [
      makeEvidence({ id: "e-pass", result: "PASS", result_label: "Pass" }),
      makeEvidence({ id: "e-fail", result: "FAIL", result_label: "Fail", title: "Failed check" }),
      makeEvidence({ id: "e-warn", result: "WARNING", result_label: "Warning", title: "Warning check" }),
      makeEvidence({ id: "e-info", result: "INFORMATIONAL", result_label: "Informational", title: "Informational note" }),
    ];

    render(
      <SecurityEvidenceTable
        evidence={rows}
        count={rows.length}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvidence={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Pass")).toBeInTheDocument();
    expect(screen.getByText("Fail")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Informational")).toBeInTheDocument();
  });

  test("flags expired evidence without changing the underlying result", () => {
    const expired = makeEvidence({
      result: "PASS",
      result_label: "Pass",
      is_stale: true,
      valid_until: "2020-01-01T00:00:00Z",
    });

    render(
      <SecurityEvidenceTable
        evidence={[expired]}
        count={1}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvidence={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("Pass")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  test("empty state is shown when there is no evidence yet", () => {
    render(
      <SecurityEvidenceTable
        evidence={[]}
        count={0}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvidence={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText("No evidence has been recorded yet.")).toBeInTheDocument();
  });
});

describe("SecurityEvidenceDetailModal", () => {
  test("renders detail fields and preserves sanitized metadata", async () => {
    const onLoad = jest.fn().mockResolvedValue({});
    const evidence = makeEvidence({
      metadata: { detector: "totp-verifier", access_token: "[REDACTED]" },
    });

    render(
      <SecurityEvidenceDetailModal
        evidenceId="evidence-1"
        evidence={evidence}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("evidence-1"));
    expect(screen.getByText(/TOTP multi-factor authentication/)).toBeInTheDocument();
    expect(screen.getByText(/totp-verifier/)).toBeInTheDocument();
    expect(screen.getByText(/\[REDACTED\]/)).toBeInTheDocument();
  });

  test("marks expired evidence as no longer current in the detail view", async () => {
    const onLoad = jest.fn().mockResolvedValue({});
    const expired = makeEvidence({ is_stale: true });

    render(
      <SecurityEvidenceDetailModal
        evidenceId="evidence-1"
        evidence={expired}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(screen.getByText("Evidence no longer current")).toBeInTheDocument();
  });
});
