import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "fs";
import path from "path";
import { SpecialistCard } from "./SpecialistCard";
import { CommanderRoutingPanel } from "./CommanderRoutingPanel";
import { InvestigationBlockedNotice } from "./InvestigationBlockedNotice";
import { DiagnosisPanel } from "./DiagnosisPanel";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("SpecialistCard", () => {
  test("renders backend-provided specialist name, status, and environment", () => {
    render(
      <SpecialistCard
        specialistDisplayName="Identity Security Specialist"
        statusLabel="Diagnosed"
        environment="test"
        isPreview={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Identity Security Specialist")).toBeInTheDocument();
    expect(screen.getByText("Diagnosed")).toBeInTheDocument();
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  test("does not invent an assignment when the backend reports none", () => {
    const { container } = render(
      <SpecialistCard specialistDisplayName={null} statusLabel={null} environment={null} isPreview={false} isLoading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("does not flash a default specialist while loading", () => {
    render(<SpecialistCard specialistDisplayName={null} isLoading={true} />);
    expect(screen.queryByText("General Security Investigator")).not.toBeInTheDocument();
    expect(screen.getByText("Loading assigned specialist")).toBeInTheDocument();
  });

  test("preview assignment is labeled distinctly from a confirmed one", () => {
    render(<SpecialistCard specialistDisplayName="General Security Investigator" isPreview={true} isLoading={false} />);
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
  });
});

describe("CommanderRoutingPanel", () => {
  test("renders backend routing provenance honestly", () => {
    render(
      <CommanderRoutingPanel
        specialistDisplayName="Identity Security Specialist"
        routingReasonCode="CONTROL_MAPPING"
        routingVersion="specialist-routing-v1"
        fallbackUsed={false}
        isPreview={true}
      />
    );

    expect(screen.getByText("Identity Security Specialist")).toBeInTheDocument();
    expect(screen.getByText("Control mapping")).toBeInTheDocument();
    expect(screen.getByText("specialist-routing-v1")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  test("general fallback is shown honestly, not hidden", () => {
    render(
      <CommanderRoutingPanel
        specialistDisplayName="General Security Investigator"
        routingReasonCode="GENERAL_FALLBACK"
        routingVersion="specialist-routing-v1"
        fallbackUsed={true}
        isPreview={true}
      />
    );

    expect(screen.getByText("General fallback")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  test("an unrecognized routing reason code still renders safely", () => {
    render(
      <CommanderRoutingPanel
        specialistDisplayName="Identity Security Specialist"
        routingReasonCode="SOME_FUTURE_REASON"
        routingVersion="specialist-routing-v2"
        fallbackUsed={null}
        isPreview={false}
      />
    );
    expect(screen.getByText("Not available")).toBeInTheDocument();
  });

  test("renders nothing when the backend reports no specialist", () => {
    const { container } = render(<CommanderRoutingPanel specialistDisplayName={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("InvestigationBlockedNotice", () => {
  test("budget-related block links to the AI budget card", () => {
    renderWithRouter(<InvestigationBlockedNotice reasonCategory="BUDGET_EXCEEDED" />);
    expect(screen.getByText("AI investigation blocked")).toBeInTheDocument();
    expect(screen.getByText(/monthly ai budget threshold reached/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai intelligence budget/i })).toBeInTheDocument();
  });

  test("non-budget block does not link to the budget card", () => {
    renderWithRouter(<InvestigationBlockedNotice reasonCategory="KILL_SWITCH" />);
    expect(screen.getByText(/automatic ai execution is disabled/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("never renders a retry button that bypasses backend policy", () => {
    renderWithRouter(<InvestigationBlockedNotice reasonCategory="BUDGET_EXCEEDED" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("an unrecorded reason still renders a safe, non-crashing message", () => {
    renderWithRouter(<InvestigationBlockedNotice reasonCategory={null} />);
    expect(screen.getByText(/could not complete/i)).toBeInTheDocument();
  });
});

describe("DiagnosisPanel", () => {
  const diagnosis = {
    diagnosis_id: "d-1",
    producer_display_name: "Identity Security Specialist",
    summary: "Refresh replay evidence exists and the session remained valid.",
    confidence: 0.82,
    facts: ["Refresh replay evidence exists.", "Session remained valid after replay."],
    hypotheses: ["Family revocation may not run on the replay path."],
    probable_root_cause: "Token family revocation is not invoked on the replay-detection path.",
    recommended_next_action: "Propose a repair to invoke family revocation on replay detection.",
    dropped_evidence_reference_count: 1,
    created_at: "2026-09-12T10:00:00Z",
  };

  test("is clearly labeled advisory, never Security Truth", () => {
    render(<DiagnosisPanel diagnosis={diagnosis} isLoading={false} />);
    expect(screen.getByText(/AI Diagnosis.*Advisory/i)).toBeInTheDocument();
    expect(screen.getByText(/not verified Security Truth/i)).toBeInTheDocument();
  });

  test("renders only fields that exist on the real DiagnosisReport schema", () => {
    render(<DiagnosisPanel diagnosis={diagnosis} isLoading={false} />);
    expect(screen.getByText(diagnosis.probable_root_cause)).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText(diagnosis.recommended_next_action)).toBeInTheDocument();
  });

  test("facts and hypotheses are visually distinct lists", () => {
    render(<DiagnosisPanel diagnosis={diagnosis} isLoading={false} />);
    const listWith = (text) => screen.getAllByRole("list").find((list) => within(list).queryByText(text));
    const factsList = listWith("Refresh replay evidence exists.");
    const hypothesesList = listWith("Family revocation may not run on the replay path.");
    expect(factsList).toBeDefined();
    expect(hypothesesList).toBeDefined();
    expect(factsList).not.toBe(hypothesesList);
  });

  test("surfaces dropped/untrusted evidence references as a caveat", () => {
    render(<DiagnosisPanel diagnosis={diagnosis} isLoading={false} />);
    expect(screen.getByText(/did not resolve to a real record and were dropped, never trusted/i)).toBeInTheDocument();
  });

  test("renders nothing when there is no diagnosis yet, never a fake one", () => {
    const { container } = render(<DiagnosisPanel diagnosis={null} isLoading={false} isActivelyInvestigating={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("shows a loading state only while an investigation is actually active", () => {
    render(<DiagnosisPanel diagnosis={null} isLoading={true} isActivelyInvestigating={true} />);
    expect(screen.getByText("Loading diagnosis")).toBeInTheDocument();
  });

  test("does not show a loading state when nothing is actively investigating", () => {
    const { container } = render(<DiagnosisPanel diagnosis={null} isLoading={true} isActivelyInvestigating={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("no frontend AI budget or specialist-routing authority (structural proof)", () => {
  function readSource(relativePath) {
    return fs.readFileSync(path.join(__dirname, relativePath), "utf8");
  }

  test("AiBudgetCountdown contains no threshold-based authorization logic", () => {
    const source = readSource("../security/AiBudgetCountdown.jsx");
    expect(source).not.toMatch(/if\s*\(.*(usage|percent_consumed|remaining)\s*[<>]=?/i);
    expect(source).not.toMatch(/disable.*(ai|investigation)/i);
    expect(source).not.toMatch(/authorize|allowInvestigation|canInvestigate/i);
  });

  test("specialistLabels.js contains no control/threat/domain-to-specialist routing map", () => {
    const source = readSource("./specialistLabels.js");
    expect(source).not.toMatch(/AUTH.*IDENTITY|TENANT.*AUTHZ|IDENTITY_SECURITY\s*[:=]\s*\[/i);
    expect(source).not.toMatch(/control_key.*specialist|specialist.*control_key/i);
  });

  test("CommanderRoutingPanel and SpecialistCard render only backend-supplied specialist identity, never compute one", () => {
    const routingSource = readSource("./CommanderRoutingPanel.jsx");
    const specialistSource = readSource("./SpecialistCard.jsx");
    expect(routingSource).not.toMatch(/SpecialistKey\.|route_case_to_specialist|routeFinding/i);
    expect(specialistSource).not.toMatch(/SpecialistKey\.|route_case_to_specialist|routeFinding/i);
  });
});
