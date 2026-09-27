import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AiBudgetCountdown } from "./AiBudgetCountdown";

// AiBudgetCountdown renders SecurityInfoButton, whose "Learn more"
// affordance lazily imports the real authAxios client via this hook;
// stub it so these tests never touch the network.
jest.mock("../../hooks/useSecurityLearning", () => ({
  fetchLearningTopic: jest.fn(() => Promise.reject(new Error("not mocked in this test"))),
  useSecurityLearningIndex: () => ({ topics: [], isLoading: false, error: null, retry: jest.fn() }),
  __resetSecurityLearningCacheForTests: jest.fn(),
}));

const normalBudget = {
  period_key: "2026-09",
  monthly_limit_usd: "10.00",
  amount_spent_usd: "1.50",
  amount_reserved_usd: "0",
  amount_remaining_usd: "8.50",
  percent_consumed: "15.00",
  total_input_tokens: 4000,
  total_output_tokens: 1200,
  model_call_count: 3,
  investigation_count: 3,
  status: "NORMAL",
  requires_attention: false,
  reset_at: "2026-10-01T00:00:00+00:00",
  seconds_until_reset: 864000,
};

describe("AiBudgetCountdown", () => {
  test("renders every required Observatory field", () => {
    render(<AiBudgetCountdown budget={normalBudget} isLoading={false} error={null} />);

    // $ remaining is the biggest, primary figure.
    expect(screen.getByText("$8.50")).toBeInTheDocument();
    expect(screen.getByText(/of \$10\.00 monthly budget/i)).toBeInTheDocument();
    expect(screen.getByText("$1.50")).toBeInTheDocument();
    expect(screen.getByText(/15\.00% used/i)).toBeInTheDocument();
    expect(screen.getByText("4000")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getByText(/resets in/i)).toBeInTheDocument();
  });

  test("usage is shown as an accessible progress bar, not color alone", () => {
    render(<AiBudgetCountdown budget={normalBudget} isLoading={false} error={null} />);

    const progressBar = screen.getByRole("progressbar", { name: /monthly ai budget consumed/i });
    expect(progressBar).toHaveAttribute("aria-valuenow", "15");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  test("NORMAL status shows no attention banner and no elevated styling", () => {
    const { container } = render(<AiBudgetCountdown budget={normalBudget} isLoading={false} error={null} />);

    expect(screen.queryByText(/automatic AI investigations are paused/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/new LLM calls are blocked/i)).not.toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the elevated-styling class is what this test checks
    expect(container.querySelector(".ai-budget-panel--attention")).not.toBeInTheDocument();
  });

  test("AUTO_PAUSED status visibly shows automatic investigation is paused, without a hardcoded threshold", () => {
    const budget = { ...normalBudget, status: "AUTO_PAUSED", requires_attention: true, percent_consumed: "92.00" };
    const { container } = render(<AiBudgetCountdown budget={budget} isLoading={false} error={null} />);

    expect(screen.getByText(/automatic AI investigations are paused/i)).toBeInTheDocument();
    expect(screen.queryByText(/90%/)).not.toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the elevated-styling class is what this test checks
    expect(container.querySelector(".ai-budget-panel--attention")).toBeInTheDocument();
  });

  test("AUTO_PAUSED does not claim all security monitoring stopped", () => {
    const budget = { ...normalBudget, status: "AUTO_PAUSED", requires_attention: true };
    render(<AiBudgetCountdown budget={budget} isLoading={false} error={null} />);

    expect(screen.getByText(/security monitoring and deterministic controls -- is unaffected/i)).toBeInTheDocument();
  });

  test("EXHAUSTED status visibly shows new LLM calls are blocked, and the Observatory remains active", () => {
    const budget = {
      ...normalBudget,
      status: "EXHAUSTED",
      requires_attention: true,
      amount_remaining_usd: "0",
      percent_consumed: "100.00",
    };
    render(<AiBudgetCountdown budget={budget} isLoading={false} error={null} />);

    expect(screen.getByText(/new LLM calls are blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/security monitoring and deterministic security controls continue operating/i)).toBeInTheDocument();
  });

  test("never implies the frontend itself decides authorization", () => {
    render(<AiBudgetCountdown budget={normalBudget} isLoading={false} error={null} />);
    expect(screen.getByText(/computed and enforced entirely by the backend/i)).toBeInTheDocument();
  });

  test("zero usage is shown as real zero counts, not missing data", () => {
    const budget = {
      ...normalBudget,
      amount_spent_usd: "0",
      amount_remaining_usd: "10.00",
      percent_consumed: "0.00",
      total_input_tokens: 0,
      total_output_tokens: 0,
      model_call_count: 0,
      investigation_count: 0,
    };
    render(<AiBudgetCountdown budget={budget} isLoading={false} error={null} />);

    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  test("permission denied is shown when the budget fails to load with 403", () => {
    render(<AiBudgetCountdown budget={null} isLoading={false} error={{ response: { status: 403 } }} />);
    expect(screen.getByText("Permission denied")).toBeInTheDocument();
  });

  test("API failure shows unavailable, never a fabricated $0 remaining or EXHAUSTED state", () => {
    render(<AiBudgetCountdown budget={null} isLoading={false} error={{ message: "Network Error" }} />);
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
    expect(screen.queryByText(/exhausted/i)).not.toBeInTheDocument();
  });

  test("loading state is shown before any budget data exists", () => {
    render(<AiBudgetCountdown budget={null} isLoading={true} error={null} />);
    expect(screen.getByText("Loading AI budget status")).toBeInTheDocument();
  });
});
