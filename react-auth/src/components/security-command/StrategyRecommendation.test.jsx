import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { StrategyRecommendationCard } from "./StrategyRecommendationCard";
import { CommanderHandoffCard } from "./CommanderHandoffCard";

let mockHelpTopics = {};

jest.mock("../../hooks/useSecurityHelp", () => ({
  useSecurityHelp: () => ({
    isLoading: false,
    error: null,
    getTopic: (key) => mockHelpTopics[key] || null,
    retry: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityLearning", () => ({
  fetchLearningTopic: jest.fn(() => Promise.reject(new Error("not mocked in this test"))),
  useSecurityLearningIndex: () => ({ topics: [], isLoading: false, error: null, retry: jest.fn() }),
  __resetSecurityLearningCacheForTests: jest.fn(),
}));

function makeRecommendation(overrides = {}) {
  return {
    id: "rec-1",
    status: "VALIDATED",
    recommendation_type: "INVESTIGATE",
    scope: "FINDING",
    scope_reference: "finding-1",
    finding_ids: ["finding-1"],
    title: "Investigate refresh replay",
    priority: "HIGH",
    confidence: "MEDIUM",
    rationale: "A replay-protection regression test failed twice under concurrent refresh requests.",
    threat_keys: ["THREAT.REFRESH_REPLAY"],
    attack_surface_keys: ["SURFACE.AUTH_REFRESH"],
    control_keys: ["GAIT.AUTH.REFRESH_REPLAY"],
    generated_at: "2026-09-12T10:00:00Z",
    decided_at: null,
    rejection_reason: null,
    recommended_campaign: null,
    recommended_assessments: [],
    commander_handoff: null,
    provider_name: "gait-strategy-v1",
    model_identifier: "model-x",
    context_hash: "abc123",
    ...overrides,
  };
}

describe("StrategyRecommendationCard", () => {
  beforeEach(() => {
    mockHelpTopics = {};
  });

  test("empty state when no recommendation has been generated", () => {
    render(<StrategyRecommendationCard recommendation={null} isLoading={false} error={null} canAct />);
    expect(screen.getByText("AI-assisted recommendation")).toBeInTheDocument();
    expect(
      screen.getByText("No strategy recommendation has been generated for this security concern.")
    ).toBeInTheDocument();
  });

  test("empty state offers a Generate action to staff, wired to onGenerate", () => {
    const onGenerate = jest.fn();
    render(<StrategyRecommendationCard recommendation={null} canAct onGenerate={onGenerate} />);

    const button = screen.getByRole("button", { name: "Generate Strategy Recommendation" });
    fireEvent.click(button);
    expect(onGenerate).toHaveBeenCalled();
  });

  test("empty state hides the Generate action for non-staff operators", () => {
    render(<StrategyRecommendationCard recommendation={null} canAct={false} onGenerate={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "Generate Strategy Recommendation" })).not.toBeInTheDocument();
  });

  test("empty state disables Generate and shows a waiting message while submitting", () => {
    render(<StrategyRecommendationCard recommendation={null} canAct onGenerate={jest.fn()} isSubmitting />);
    expect(screen.getByRole("button", { name: "Requesting a strategy recommendation…" })).toBeDisabled();
  });

  test("empty state shows a mapped error message when generation fails", () => {
    render(
      <StrategyRecommendationCard
        recommendation={null}
        canAct
        onGenerate={jest.fn()}
        actionError={{ response: { status: 403 } }}
        lastAction="generate"
      />
    );
    expect(
      screen.getByText("You do not have permission to request a strategy recommendation.")
    ).toBeInTheDocument();
  });

  test("VALIDATED recommendation renders type, priority, rationale, confidence, and references", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation()}
        isLoading={false}
        error={null}
        canAct
        isSubmitting={false}
        onAccept={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText("Investigate refresh replay")).toBeInTheDocument();
    expect(screen.getByText("Investigate")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    expect(
      screen.getByText("A replay-protection regression test failed twice under concurrent refresh requests.")
    ).toBeInTheDocument();
    expect(screen.getByText("THREAT.REFRESH_REPLAY")).toBeInTheDocument();
    expect(screen.getByText("SURFACE.AUTH_REFRESH")).toBeInTheDocument();
    expect(screen.getByText("GAIT.AUTH.REFRESH_REPLAY")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Recommendation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  test("campaign recommendation shows the recommended campaign identifiers", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation({
          recommendation_type: "RUN_PENTEST_CAMPAIGN",
          recommended_campaign: { campaign_key: "auth.refresh_replay", campaign_version: 2, environment: "staging" },
        })}
        canAct
      />
    );

    expect(screen.getByText(/Recommended campaign: auth\.refresh_replay/)).toBeInTheDocument();
    expect(screen.getByText(/v2 in staging/)).toBeInTheDocument();
  });

  test("a NO_ACTION recommendation with a blank recommended_campaign placeholder does not render a fake campaign line", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation({
          recommendation_type: "NO_ACTION",
          recommended_campaign: { campaign_key: "", campaign_version: null, environment: "" },
          recommended_assessments: [{ adapter_key: "", target_key: "", environment: "" }],
        })}
        canAct
      />
    );

    expect(screen.queryByText(/Recommended campaign/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommended assessment/)).not.toBeInTheDocument();
  });

  test("assessment recommendation shows adapter and target", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation({
          recommendation_type: "RUN_SECURITY_ASSESSMENT",
          recommended_assessments: [{ adapter_key: "zap", target_key: "api-gateway", environment: "staging" }],
        })}
        canAct
      />
    );

    expect(screen.getByText(/Recommended assessment: zap on api-gateway/)).toBeInTheDocument();
  });

  test("REJECTED recommendation shows the rejection reason and no accept action", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation({ status: "REJECTED", rejection_reason: "Confidence below threshold." })}
        canAct
      />
    );

    expect(screen.getByText("Confidence below threshold.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept Recommendation" })).not.toBeInTheDocument();
  });

  test("DISMISSED recommendation remains visible with no accept action", () => {
    render(<StrategyRecommendationCard recommendation={makeRecommendation({ status: "DISMISSED" })} canAct />);

    expect(screen.getByText("Investigate refresh replay")).toBeInTheDocument();
    expect(screen.getByText("Dismissed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept Recommendation" })).not.toBeInTheDocument();
  });

  test("an unrecognized status renders safely instead of crashing", () => {
    render(<StrategyRecommendationCard recommendation={makeRecommendation({ status: undefined })} canAct />);
    expect(screen.getByText("Unknown status")).toBeInTheDocument();
  });

  test("Accept and Dismiss call their handlers with the recommendation", () => {
    const onAccept = jest.fn();
    const onDismiss = jest.fn();
    const recommendation = makeRecommendation();
    render(
      <StrategyRecommendationCard recommendation={recommendation} canAct onAccept={onAccept} onDismiss={onDismiss} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept Recommendation" }));
    expect(onAccept).toHaveBeenCalledWith(recommendation);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledWith(recommendation);
  });

  test("disables actions and shows a waiting message while a submission is pending", () => {
    render(<StrategyRecommendationCard recommendation={makeRecommendation()} canAct isSubmitting />);

    const acceptButton = screen.getByRole("button", { name: "Handing recommendation to Commander…" });
    expect(acceptButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeDisabled();
  });

  test("non-staff operators never see Accept or Dismiss, even on a VALIDATED recommendation", () => {
    render(<StrategyRecommendationCard recommendation={makeRecommendation()} canAct={false} />);
    expect(screen.queryByRole("button", { name: "Accept Recommendation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  test.each([
    ["RECOMMENDATION_ALREADY_DISMISSED", "This recommendation was dismissed and cannot be accepted."],
    ["RECOMMENDATION_NOT_VALIDATED", "This recommendation has not passed validation and cannot be accepted."],
    [
      "STALE_RECOMMENDATION",
      "This recommendation is no longer valid because the underlying security state changed. Generate a new recommendation.",
    ],
  ])("a failed accept with %s renders its mapped explanation", (code, expectedMessage) => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation()}
        canAct
        actionError={{ response: { status: 409, data: { error: code } } }}
        lastAction="accept"
      />
    );
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });

  test("a failed dismiss renders the dismiss error message, not the accept one", () => {
    render(
      <StrategyRecommendationCard
        recommendation={makeRecommendation()}
        canAct
        actionError={{ response: { status: 403 } }}
        lastAction="dismiss"
      />
    );
    expect(screen.getByText("You do not have permission to dismiss this recommendation.")).toBeInTheDocument();
  });

  test("renders the AI Strategy Recommendation help button only when the backend provides that topic", () => {
    const { rerender } = render(<StrategyRecommendationCard recommendation={makeRecommendation()} canAct />);
    expect(screen.queryByRole("button", { name: "Explain AI Strategy Recommendation" })).not.toBeInTheDocument();

    mockHelpTopics = { security_strategy_recommendation: { title: "AI Strategy Recommendation", short_description: "x" } };
    rerender(<StrategyRecommendationCard recommendation={makeRecommendation()} canAct />);
    expect(screen.getByRole("button", { name: "Explain AI Strategy Recommendation" })).toBeInTheDocument();
  });
});

describe("CommanderHandoffCard", () => {
  test("no handoff and not accepted NO_ACTION shows the not-accepted empty state", () => {
    render(<CommanderHandoffCard recommendation={makeRecommendation({ commander_handoff: null })} />);
    expect(screen.getByText("This recommendation has not been accepted.")).toBeInTheDocument();
  });

  test("accepted NO_ACTION with no handoff shows the no-governed-action empty state", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          recommendation_type: "NO_ACTION",
          status: "ACCEPTED",
          commander_handoff: null,
        })}
      />
    );
    expect(screen.getByText("Strategy review found no recommended governed action.")).toBeInTheDocument();
  });

  test("INVESTIGATE routes to Blue Team and points to the workflow/timeline below when complete", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          status: "HANDED_OFF",
          commander_handoff: {
            id: "h1",
            status: "COMPLETED",
            case_id: "case-1",
            created_at: "2026-09-12T10:31:00Z",
            completed_at: "2026-09-12T10:31:02Z",
          },
        })}
      />
    );

    expect(screen.getByText("Blue Team")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.getByText("Blue Team investigation detail is shown in the workflow and timeline below.")
    ).toBeInTheDocument();
  });

  test("a completed campaign handoff shows a placeholder with the run id, not fabricated detail", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          recommendation_type: "RUN_PENTEST_CAMPAIGN",
          status: "HANDED_OFF",
          commander_handoff: {
            id: "h1",
            status: "COMPLETED",
            campaign_run_id: "campaign-run-1234567890",
            created_at: "2026-09-12T10:31:00Z",
            completed_at: "2026-09-12T10:31:02Z",
          },
        })}
      />
    );

    expect(screen.getByText(/Downstream run detail isn't available in this view yet/)).toBeInTheDocument();
  });

  test("a REQUESTED handoff shows it is still being routed", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          status: "ACCEPTED",
          commander_handoff: { id: "h1", status: "REQUESTED", created_at: "2026-09-12T10:31:00Z" },
        })}
      />
    );
    expect(screen.getByText("Commander received this recommendation and is routing it.")).toBeInTheDocument();
  });

  test("a DENIED handoff clearly separates acceptance from routing failure and states the retry rule", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          status: "ACCEPTED",
          commander_handoff: {
            id: "h1",
            status: "DENIED",
            failure_reason: "DOWNSTREAM_REQUEST_DENIED:adapter disabled",
            created_at: "2026-09-12T10:31:00Z",
            completed_at: "2026-09-12T10:31:02Z",
          },
        })}
      />
    );

    expect(
      screen.getByText("Commander routed the request, but downstream governance denied execution.")
    ).toBeInTheDocument();
    expect(screen.getByText("Recommendation accepted ✓")).toBeInTheDocument();
    expect(screen.getByText("Commander handoff: Failed / denied ✕")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This governed attempt is immutable. Generate a new recommendation if you want Gait to reassess the current state."
      )
    ).toBeInTheDocument();
  });

  test("an unrecognized failure_reason code still renders the immutable-retry note safely", () => {
    render(
      <CommanderHandoffCard
        recommendation={makeRecommendation({
          status: "ACCEPTED",
          commander_handoff: {
            id: "h1",
            status: "ERROR",
            failure_reason: "SOME_FUTURE_CODE:unexpected",
            created_at: "2026-09-12T10:31:00Z",
          },
        })}
      />
    );

    expect(screen.getByText("Failure reason: SOME_FUTURE_CODE")).toBeInTheDocument();
    expect(screen.getByText("Recommendation accepted ✓")).toBeInTheDocument();
  });
});
