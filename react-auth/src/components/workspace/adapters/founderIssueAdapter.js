/**
 * UI1 — Founder Workspace v1 presentation adapter.
 *
 * This is the ONLY place PLATFORM API shapes (SecurityFinding, the
 * workflow snapshot, DiagnosisReport, DeploymentApproval) are translated
 * into the founder-facing `FounderIssue` shape the workspace components
 * render. Components never reach into these raw backend fields directly.
 *
 * When a TENANT adapter exists later, it produces the same `FounderIssue`
 * shape from tenant-scoped data and every workspace component keeps
 * working unchanged:
 *
 *   platformFindingAdapter(...) -> FounderIssue
 *   tenantFindingAdapter(...)   -> FounderIssue   (future)
 *
 * Hard rule mirrored from the milestone brief: this file only reshapes
 * fields the backend already returned. It never computes a security
 * conclusion (nothing here decides "blocked", "validated", or "resolved" —
 * those come straight from backend fields, or are omitted).
 */

const SEVERITY_META = {
  CRITICAL: { label: "Critical", tone: "danger" },
  HIGH: { label: "High", tone: "danger" },
  WARNING: { label: "Medium", tone: "warn" },
  INFO: { label: "Low", tone: "info" },
};

export function getSeverityMeta(severity) {
  return SEVERITY_META[severity] || { label: severity || "Unknown", tone: "neutral" };
}

const FINDING_STATUS_META = {
  OPEN: { label: "Open" },
  ACKNOWLEDGED: { label: "In progress" },
  RESOLVED: { label: "Resolved" },
  ACCEPTED_RISK: { label: "Accepted risk" },
  FALSE_POSITIVE: { label: "Not an issue" },
};

export function getFounderFindingStatusLabel(status) {
  return FINDING_STATUS_META[status]?.label || status || "Unknown";
}

// human_attention_state values that mean a human decision is genuinely
// required right now. UI1.1 verified this precisely against the actual
// backend source (security_agents/command_query.py's
// SecurityCommandQueryService._human_attention_state), which is the
// function that genuinely backs this field -- not the wider vocabulary
// HumanAttentionBanner.jsx's TONE_BY_STATE defensively maps (that map
// includes values, like FAILED, this function never actually returns; a
// case-level FAILED status is reported as human_attention_state=BLOCKED,
// not FAILED). The real, complete vocabulary is exactly five values:
// HUMAN_APPROVAL_REQUIRED, BLOCKED, NONE, IN_PROGRESS,
// NEXT_ACTION_AVAILABLE. Only the first two ever mean "a human decision
// is what's being waited on" -- this is the ONLY signal used to decide
// "Needs You" for those two, never a client-invented flag.
const NEEDS_YOU_STATES = new Set(["HUMAN_APPROVAL_REQUIRED", "BLOCKED"]);

// current_state === DEPLOY_AUTHORIZED is a real, separate "needs you"
// case that human_attention_state alone does not capture: it reports
// NEXT_ACTION_AVAILABLE (the same value as an ordinary Gait-owned next
// step) because from the case-state-machine's point of view the human
// decision already happened -- approval was granted. But UI1 found a
// genuine resume risk here: the one-time execution token is only ever
// handed to the browser that called approve/, and if that call chain
// never reaches execute/ (tab closed, network drop), the case can sit at
// DEPLOY_AUTHORIZED indefinitely with no automatic next step. Read-only
// re-inspection of deployment_approval.py confirms a real, safe recovery
// exists (revoke the stuck APPROVED approval -> orchestration.
// reconcile_case_after_revocation rolls the case back to
// AWAITING_DEPLOY_APPROVAL -> request a fresh approval) -- so this is
// treated as needing the founder, with its own explicit reason text
// rather than reusing whatever human_attention_reason (if any) is set.
export const STUCK_DEPLOY_REASON =
  "Gait approved this deployment but hasn't started it yet. If this doesn't move within a few minutes, you can restart the approval.";

export function deriveNeedsYou(snapshot) {
  if (snapshot?.current_state === "DEPLOY_AUTHORIZED") {
    return { flag: true, reason: STUCK_DEPLOY_REASON, state: snapshot.human_attention_state || null };
  }
  if (!snapshot?.human_attention_state) {
    return { flag: false, reason: null, state: null };
  }
  return {
    flag: NEEDS_YOU_STATES.has(snapshot.human_attention_state),
    reason: snapshot.human_attention_reason || snapshot.human_attention_label || null,
    state: snapshot.human_attention_state,
  };
}

// Which approval surface (if any) current_state points at. Three real
// cases exist on the backend today (security_agents/models.py
// SecurityAgentCase.Status): AWAITING_REPAIR_APPROVAL,
// AWAITING_DEPLOY_APPROVAL, and DEPLOY_AUTHORIZED-stuck-without-progress.
// Only the deploy-approval and deploy-stuck cases have frontend-callable
// endpoints (security-agents/deployment-approvals/*) as of this
// milestone -- see BACKEND_UI_CONTRACT_GAP: REPAIR_APPROVAL_ACTION in the
// UI1.1 report for the repair gate, which stays read-only/non-interactive.
export function deriveApprovalKind(snapshot) {
  if (snapshot?.current_state === "AWAITING_DEPLOY_APPROVAL") {
    return "deploy";
  }
  if (snapshot?.current_state === "DEPLOY_AUTHORIZED") {
    return "deploy_stuck";
  }
  if (snapshot?.current_state === "AWAITING_REPAIR_APPROVAL") {
    return "repair";
  }
  return null;
}

// The founder-facing lifecycle is derived entirely from the same
// authoritative fields WorkflowProgress.jsx already renders
// (snapshot.specialists[*].status, snapshot.human_attention_state) plus
// the finding's own durable `status`/`resolution_summary` for the final
// "Resolved" step. No step is ever marked done without a real backend
// signal saying so.
const STAGE_DEFS = [
  { key: "detected", label: "Detected" },
  { key: "investigated", label: "Investigated" },
  { key: "reproduced", label: "Reproduced" },
  { key: "fix_prepared", label: "Fix prepared" },
  { key: "validated", label: "Validated" },
  { key: "needs_you", label: "Needs you" },
  { key: "deploying", label: "Deploying" },
  { key: "resolved", label: "Resolved" },
];

function specialistState(specialists, key) {
  return specialists?.[key]?.status || null;
}

export function deriveLifecycle({ hasCase, snapshot, findingStatus }) {
  const specialists = snapshot?.specialists;
  const investigator = specialistState(specialists, "investigator");
  const redTeam = specialistState(specialists, "red_team");
  const repair = specialistState(specialists, "repair");
  const validator = specialistState(specialists, "validator");
  const deployer = specialistState(specialists, "deployer");
  const needsYou = deriveNeedsYou(snapshot);
  const isResolved = findingStatus === "RESOLVED";

  function stateFor(value, doneValues, activeValues) {
    if (doneValues.includes(value)) return "done";
    if (activeValues.includes(value)) return "active";
    return "pending";
  }

  const steps = [
    {
      ...STAGE_DEFS[0],
      state: hasCase || findingStatus ? "done" : "pending",
    },
    {
      ...STAGE_DEFS[1],
      state: stateFor(investigator, ["COMPLETE"], ["RUNNING"]),
    },
    {
      ...STAGE_DEFS[2],
      state: stateFor(redTeam, ["COMPLETE"], ["RUNNING"]),
    },
    {
      ...STAGE_DEFS[3],
      state: stateFor(repair, ["COMPLETE"], ["RUNNING"]),
    },
    {
      ...STAGE_DEFS[4],
      state: stateFor(validator, ["COMPLETE"], ["RUNNING"]),
    },
    {
      ...STAGE_DEFS[5],
      state: needsYou.flag ? "active" : deployer === "RUNNING" || deployer === "COMPLETE" ? "done" : "pending",
    },
    {
      ...STAGE_DEFS[6],
      state: stateFor(deployer, ["COMPLETE"], ["RUNNING"]),
    },
    {
      ...STAGE_DEFS[7],
      state: isResolved ? "done" : "pending",
    },
  ];

  return steps;
}

/**
 * Build the founder-facing summary text for an issue. Every field here is
 * either a direct backend value or `null` -- never a generated sentence
 * standing in for a conclusion the backend hasn't made. Components must
 * render nothing (not a fabricated placeholder) when a field is null.
 */
export function platformFindingAdapter({ finding, matchingCase, snapshot, diagnosis, investigationSummary } = {}) {
  if (!finding) {
    return null;
  }

  const severityMeta = getSeverityMeta(finding.severity);
  const needsYou = deriveNeedsYou(snapshot);
  const approvalKind = deriveApprovalKind(snapshot);

  return {
    id: finding.id,
    findingKey: finding.finding_key,
    caseId: matchingCase?.id || null,
    hasCase: Boolean(matchingCase),

    title: finding.title,
    severity: finding.severity,
    severityLabel: severityMeta.label,
    severityTone: severityMeta.tone,
    statusLabel: getFounderFindingStatusLabel(finding.status),
    isResolved: finding.status === "RESOLVED",
    isAcceptedRisk: finding.status === "ACCEPTED_RISK",
    isFalsePositive: finding.status === "FALSE_POSITIVE",

    environment: finding.environment || null,
    affectedSystem: finding.affected_system || null,
    affectedComponent: finding.affected_component || null,

    // Level 1 — plain-English story. Only ever real backend text.
    whatHappened: finding.description || finding.observed_behavior || null,
    whyItMatters: finding.expected_behavior || null,
    whatGaitFound: diagnosis?.summary || diagnosis?.probable_root_cause || null,
    recommendation: diagnosis?.recommended_next_action || null,
    resolutionSummary: finding.status === "RESOLVED" ? finding.resolution_summary || null : null,

    specialistDisplayName: investigationSummary?.specialist_display_name || null,

    needsYou: needsYou.flag,
    needsYouReason: needsYou.reason,
    humanAttentionState: needsYou.state,
    approvalKind,
    currentState: snapshot?.current_state || null,
    hasDeploymentFailed: snapshot?.current_state === "DEPLOYMENT_FAILED",
    isInvestigating: specialistState(snapshot?.specialists, "investigator") === "RUNNING",
    isActiveCase: Boolean(matchingCase) && finding.status !== "RESOLVED" && finding.status !== "FALSE_POSITIVE",

    lifecycle: deriveLifecycle({
      hasCase: Boolean(matchingCase),
      snapshot,
      findingStatus: finding.status,
    }),

    firstSeenAt: finding.first_seen_at || null,
    lastSeenAt: finding.last_seen_at || null,
    resolvedAt: finding.resolved_at || null,

    // Level 3 — audit/technical identifiers, never shown by default.
    _raw: { finding, matchingCase, snapshot, diagnosis, investigationSummary },
  };
}
