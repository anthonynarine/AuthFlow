import {
  deriveApprovalKind,
  deriveLifecycle,
  deriveNeedsYou,
  getFounderFindingStatusLabel,
  getSeverityMeta,
  platformFindingAdapter,
} from "./founderIssueAdapter";

describe("deriveNeedsYou", () => {
  test("flags HUMAN_APPROVAL_REQUIRED as needing the founder", () => {
    const result = deriveNeedsYou({
      human_attention_state: "HUMAN_APPROVAL_REQUIRED",
      human_attention_reason: "Validator approved; human must approve exact artifact.",
    });
    expect(result.flag).toBe(true);
    expect(result.reason).toBe("Validator approved; human must approve exact artifact.");
  });

  test("flags BLOCKED as needing the founder", () => {
    // A case-level FAILED or DEPLOYMENT_FAILED status is reported by the
    // backend as human_attention_state=BLOCKED, never as "FAILED" — the
    // real, complete vocabulary (security_agents/command_query.py
    // ._human_attention_state) is exactly HUMAN_APPROVAL_REQUIRED,
    // BLOCKED, NONE, IN_PROGRESS, NEXT_ACTION_AVAILABLE. Verified
    // read-only against backend source for UI1.1.
    expect(deriveNeedsYou({ human_attention_state: "BLOCKED" }).flag).toBe(true);
  });

  test("does not flag ordinary agent workflow states — the real backend vocabulary, not an imagined one", () => {
    expect(deriveNeedsYou({ human_attention_state: "NONE" }).flag).toBe(false);
    expect(deriveNeedsYou({ human_attention_state: "IN_PROGRESS" }).flag).toBe(false);
    expect(deriveNeedsYou({ human_attention_state: "NEXT_ACTION_AVAILABLE" }).flag).toBe(false);
  });

  test("never flags anything when there is no snapshot yet", () => {
    expect(deriveNeedsYou(null)).toEqual({ flag: false, reason: null, state: null });
    expect(deriveNeedsYou(undefined)).toEqual({ flag: false, reason: null, state: null });
  });

  test("DEPLOYMENT_APPROVAL_RECOVERY: DEPLOY_AUTHORIZED needs the founder even though its own human_attention_state is NEXT_ACTION_AVAILABLE", () => {
    // This is the exact resume-risk UI1 flagged: the approval already
    // happened, so the state machine no longer reports a pending human
    // decision — but if execute/ never ran, nothing will move without
    // the founder restarting it.
    const result = deriveNeedsYou({
      current_state: "DEPLOY_AUTHORIZED",
      human_attention_state: "NEXT_ACTION_AVAILABLE",
    });
    expect(result.flag).toBe(true);
    expect(result.reason).toMatch(/hasn't started it yet/);
  });
});

describe("deriveApprovalKind", () => {
  test("distinguishes the deploy gate, the repair gate, and a stuck deploy", () => {
    expect(deriveApprovalKind({ current_state: "AWAITING_DEPLOY_APPROVAL" })).toBe("deploy");
    expect(deriveApprovalKind({ current_state: "AWAITING_REPAIR_APPROVAL" })).toBe("repair");
    expect(deriveApprovalKind({ current_state: "DEPLOY_AUTHORIZED" })).toBe("deploy_stuck");
    expect(deriveApprovalKind({ current_state: "INVESTIGATING" })).toBe(null);
    expect(deriveApprovalKind(null)).toBe(null);
  });
});

describe("deriveLifecycle — never renders a fake completed step", () => {
  test("a freshly detected finding with no case shows only Detected", () => {
    const steps = deriveLifecycle({ hasCase: false, snapshot: null, findingStatus: "OPEN" });
    const byKey = Object.fromEntries(steps.map((step) => [step.key, step.state]));
    // The finding record existing at all IS the real "detected" signal.
    expect(byKey.detected).toBe("done");
    expect(byKey.investigated).toBe("pending");
    expect(byKey.reproduced).toBe("pending");
    expect(byKey.fix_prepared).toBe("pending");
    expect(byKey.validated).toBe("pending");
    expect(byKey.resolved).toBe("pending");
  });

  test("investigation running, red team never engaged: Reproduced stays pending, not done", () => {
    const steps = deriveLifecycle({
      hasCase: true,
      snapshot: {
        specialists: {
          investigator: { status: "RUNNING" },
          red_team: { status: "WAITING" },
          repair: { status: "LOCKED" },
          validator: { status: "LOCKED" },
          deployer: { status: "LOCKED" },
        },
        human_attention_state: "NO_ACTION_REQUIRED",
      },
      findingStatus: "OPEN",
    });
    const byKey = Object.fromEntries(steps.map((step) => [step.key, step.state]));
    expect(byKey.detected).toBe("done");
    expect(byKey.investigated).toBe("active");
    expect(byKey.reproduced).toBe("pending");
    expect(byKey.fix_prepared).toBe("pending");
  });

  test("everything complete and validated, awaiting deploy approval: needs_you is active, deploying/resolved stay pending", () => {
    const steps = deriveLifecycle({
      hasCase: true,
      snapshot: {
        specialists: {
          investigator: { status: "COMPLETE" },
          red_team: { status: "COMPLETE" },
          repair: { status: "COMPLETE" },
          validator: { status: "COMPLETE" },
          deployer: { status: "LOCKED" },
        },
        human_attention_state: "HUMAN_APPROVAL_REQUIRED",
        current_state: "AWAITING_DEPLOY_APPROVAL",
      },
      findingStatus: "OPEN",
    });
    const byKey = Object.fromEntries(steps.map((step) => [step.key, step.state]));
    expect(byKey.investigated).toBe("done");
    expect(byKey.reproduced).toBe("done");
    expect(byKey.fix_prepared).toBe("done");
    expect(byKey.validated).toBe("done");
    expect(byKey.needs_you).toBe("active");
    expect(byKey.deploying).toBe("pending");
    expect(byKey.resolved).toBe("pending");
  });

  test("resolved is only ever done when the finding's own status says RESOLVED", () => {
    const deployedButNotResolved = deriveLifecycle({
      hasCase: true,
      snapshot: { specialists: { deployer: { status: "COMPLETE" } }, current_state: "DEPLOYED" },
      findingStatus: "OPEN",
    });
    expect(deployedButNotResolved.find((step) => step.key === "resolved").state).toBe("pending");

    const resolved = deriveLifecycle({
      hasCase: true,
      snapshot: { specialists: { deployer: { status: "COMPLETE" } }, current_state: "DEPLOYED" },
      findingStatus: "RESOLVED",
    });
    expect(resolved.find((step) => step.key === "resolved").state).toBe("done");
  });
});

describe("getSeverityMeta / getFounderFindingStatusLabel", () => {
  test("maps backend severities to plain founder labels", () => {
    expect(getSeverityMeta("HIGH").label).toBe("High");
    expect(getSeverityMeta("WARNING").label).toBe("Medium");
    expect(getSeverityMeta("INFO").label).toBe("Low");
  });

  test("falls back safely for an unrecognized value rather than throwing", () => {
    expect(() => getSeverityMeta(undefined)).not.toThrow();
    expect(getFounderFindingStatusLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});

describe("platformFindingAdapter", () => {
  test("returns null without a finding, and never invents fields the backend didn't send", () => {
    expect(platformFindingAdapter({})).toBe(null);

    const issue = platformFindingAdapter({
      finding: {
        id: "f-1",
        finding_key: "auth.refresh_token.replay",
        title: "Refresh-token replay protection failed",
        severity: "HIGH",
        status: "OPEN",
        description: "A reused refresh token remained valid.",
      },
      matchingCase: null,
      snapshot: null,
      diagnosis: null,
      investigationSummary: null,
    });

    expect(issue.title).toBe("Refresh-token replay protection failed");
    expect(issue.whatGaitFound).toBe(null);
    expect(issue.recommendation).toBe(null);
    expect(issue.needsYou).toBe(false);
    expect(issue.hasCase).toBe(false);
    expect(issue.resolutionSummary).toBe(null);
  });

  test("only shows a resolution summary when the finding is actually resolved", () => {
    const issue = platformFindingAdapter({
      finding: { id: "f-2", title: "X", severity: "INFO", status: "RESOLVED", resolution_summary: "Fixed in abc123." },
    });
    expect(issue.isResolved).toBe(true);
    expect(issue.resolutionSummary).toBe("Fixed in abc123.");
  });
});
