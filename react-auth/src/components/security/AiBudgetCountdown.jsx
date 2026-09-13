import React from "react";
import { StatusBadge } from "./StatusBadge";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityInfoButton } from "./SecurityInfoButton";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { formatDateTime } from "./securityLabels";

function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatUsd(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "$0.00";
  }
  return `$${amount.toFixed(2)}`;
}

function StatCard({ label, value }) {
  return (
    <div className="ai-budget-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * B-AI2 Phase 4: the Security Observatory's AI Budget Countdown. Every
 * value rendered here comes straight from the backend
 * (GET /api/security-agents/ai-budget/, security_agents.ai_budget
 * .get_ai_budget_status()) -- this component computes nothing about
 * whether AI investigation is allowed; it only displays what the
 * backend already decided. Gait's noise-vs-risk principle: the panel
 * stays visually quiet unless `requires_attention` is true.
 */
export function AiBudgetCountdown({ budget, isLoading, error, onRetry, info }) {
  if (isLoading && !budget) {
    return <SecurityLoadingState label="Loading AI budget status" />;
  }

  if (error && !budget) {
    return <SecurityErrorState error={error} onRetry={onRetry} compact />;
  }

  if (!budget) {
    return null;
  }

  const panelClassName = `security-panel ai-budget-panel${
    budget.requires_attention ? " ai-budget-panel--attention" : ""
  }`;

  return (
    <section className={panelClassName} aria-labelledby="ai-budget-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">AI Budget</p>
          <h2 id="ai-budget-heading">
            AI Budget Countdown{" "}
            <StatusBadge status={budget.status} type="ai-budget-status" />
          </h2>
        </div>
        <div className="security-section-heading-actions">
          <span className="last-updated">Resets in {formatCountdown(budget.seconds_until_reset)}</span>
          {info && (
            <SecurityInfoButton
              title={info.title}
              label={info.label}
              content={info.content}
              currentStatus={budget.status}
            />
          )}
        </div>
      </div>

      {budget.status === "AUTO_PAUSED" && (
        <p className="ai-budget-note ai-budget-note--attention">
          Automatic AI investigations are paused because the monthly AI budget threshold has been reached. The rest
          of Gait -- security monitoring and deterministic controls -- is unaffected.
        </p>
      )}
      {budget.status === "EXHAUSTED" && (
        <p className="ai-budget-note ai-budget-note--attention">
          New LLM calls are blocked because the monthly AI budget is exhausted. Security monitoring and
          deterministic security controls continue operating.
        </p>
      )}

      <div className="ai-budget-hero">
        <span className="ai-budget-hero-amount">{formatUsd(budget.amount_remaining_usd)}</span>
        <span className="ai-budget-hero-label">LEFT of {formatUsd(budget.monthly_limit_usd)} monthly budget</span>
      </div>

      <div
        className="ai-budget-progress"
        role="progressbar"
        aria-label="Monthly AI budget consumed"
        aria-valuenow={Number(budget.percent_consumed) || 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="ai-budget-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, Number(budget.percent_consumed) || 0))}%` }}
        />
      </div>
      <p className="ai-budget-progress-label">{budget.percent_consumed}% used</p>

      <div className="ai-budget-grid">
        <StatCard label="Spent" value={formatUsd(budget.amount_spent_usd)} />
        <StatCard label="Model calls" value={budget.model_call_count} />
        <StatCard label="Investigations" value={budget.investigation_count} />
        <StatCard label="Input tokens" value={budget.total_input_tokens} />
        <StatCard label="Output tokens" value={budget.total_output_tokens} />
      </div>

      <p className="security-muted">
        Resets {budget.reset_at ? formatDateTime(budget.reset_at) : "at the start of next month"}. Budget status
        is operational telemetry, computed and enforced entirely by the backend -- it is never Security Truth.
      </p>
    </section>
  );
}

export default AiBudgetCountdown;
