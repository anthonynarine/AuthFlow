import {
  ANSWER_BASIS,
  buildAskAboutPrompt,
  buildQuizRevealPrompt,
  getBasisLabel,
  getBasisTooltip,
  getLearningModeLabel,
  getSageMeta,
  isSageResponse,
  LEARNING_MODES,
} from "./sageResponse";

const KNOWLEDGE_RESPONSE = {
  answer: "[The Gateway -- Overview]\nThe Gateway is the single authorization chokepoint...",
  facts: ["Canonical knowledge grounded this answer with 2 citation(s)."],
  interpretation: [],
  sources: [],
  intent: "sage_knowledge",
  information_need: "KNOWLEDGE",
  basis: "KNOWLEDGE",
  learning_mode: "EXPLAIN",
  citations: [
    {
      source_key: "arch.gateway",
      title: "The Gateway",
      heading_path: ["Overview"],
      origin: { origin_kind: "FILE", path: "docs/architecture/gateway.md", registry_module: null, registry_name: null, registry_key: null, commit_sha: "abc123" },
      content_hash: "hash1",
      chunk_id: "chunk-1",
    },
  ],
  limitations: [],
  next_reading: [{ source_key: "arch.policy", title: "Policy", heading_path: [] }],
  context: {
    sage: {
      answer: "The Gateway is the single authorization chokepoint...",
      information_need: "KNOWLEDGE",
      basis: "KNOWLEDGE",
      learning_mode: "EXPLAIN",
      current_truth: null,
      knowledge_excerpts: [
        {
          source_key: "arch.gateway",
          title: "The Gateway",
          heading_path: ["Overview"],
          text: "The Gateway is the single authorization chokepoint...",
          domain: "AGENT_SECURITY",
          canonicality: "CANONICAL",
        },
      ],
      citations: [],
      limitations: [],
      next_reading: [],
      truncated: false,
      provider_used: "deterministic",
      fallback_used: false,
    },
  },
};

const MIXED_RESPONSE = {
  ...KNOWLEDGE_RESPONSE,
  answer: "CURRENT STATE\nRefresh Replay Detection is CONTROL_FAILURE.\n\nHOW IT WORKS\nRefresh replay detection works by...",
  facts: ["Refresh Replay Detection is CONTROL_FAILURE.", "Evidence updated 2026-09-11."],
  interpretation: ["This control needs attention."],
  sources: [{ type: "SecurityControl", id: "42" }],
  information_need: "MIXED_READ_ONLY",
  basis: "MIXED",
  context: {
    sage: {
      ...KNOWLEDGE_RESPONSE.context.sage,
      answer: "Refresh replay detection works by...",
      basis: "KNOWLEDGE",
    },
    current_truth: { control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION" },
  },
};

const HISTORY_RESPONSE = {
  answer: "General historical operational retrieval ... not available yet ...",
  facts: [],
  interpretation: [],
  sources: [],
  information_need: "HISTORY_UNAVAILABLE",
  basis: "UNAVAILABLE_HISTORY",
  learning_mode: null,
  citations: [],
  limitations: ["General historical retrieval is deferred to B-KNOW4 and is not implemented."],
  next_reading: [],
  context: {
    sage: {
      answer: "General historical operational retrieval ... not available yet ...",
      knowledge_excerpts: [],
      truncated: false,
      fallback_used: false,
    },
  },
};

const ACTION_RESPONSE = {
  answer: "Incident Commander dispatched Blue Team.",
  action_status: "DISPATCHED",
  specialist: "blue_team",
};

const PLAIN_CURRENT_TRUTH_RESPONSE = {
  answer: "Two findings need attention.",
  facts: ["2 open findings."],
  interpretation: [],
  sources: [],
  intent: "attention",
};

describe("isSageResponse", () => {
  test("true only when information_need is present", () => {
    expect(isSageResponse(KNOWLEDGE_RESPONSE)).toBe(true);
    expect(isSageResponse(MIXED_RESPONSE)).toBe(true);
    expect(isSageResponse(HISTORY_RESPONSE)).toBe(true);
    expect(isSageResponse(ACTION_RESPONSE)).toBe(false);
    expect(isSageResponse(PLAIN_CURRENT_TRUTH_RESPONSE)).toBe(false);
    expect(isSageResponse(null)).toBe(false);
    expect(isSageResponse(undefined)).toBe(false);
  });
});

describe("getSageMeta", () => {
  test("returns null for a non-Sage response (action or plain current-truth)", () => {
    expect(getSageMeta(ACTION_RESPONSE)).toBeNull();
    expect(getSageMeta(PLAIN_CURRENT_TRUTH_RESPONSE)).toBeNull();
  });

  test("a KNOWLEDGE response has no current-truth section", () => {
    const meta = getSageMeta(KNOWLEDGE_RESPONSE);
    expect(meta.basis).toBe("KNOWLEDGE");
    expect(meta.hasCurrentTruth).toBe(false);
    expect(meta.currentTruthFacts).toEqual([]);
    expect(meta.knowledgeExcerpts).toHaveLength(1);
    expect(meta.citations).toHaveLength(1);
    expect(meta.nextReading).toEqual([{ source_key: "arch.policy", title: "Policy", heading_path: [] }]);
  });

  test("uses the pure Sage answer, not the top-level combined answer string, as knowledgeAnswer", () => {
    const meta = getSageMeta(KNOWLEDGE_RESPONSE);
    expect(meta.knowledgeAnswer).toBe(KNOWLEDGE_RESPONSE.context.sage.answer);
    expect(meta.knowledgeAnswer).not.toContain("[The Gateway");
  });

  test("a MIXED response surfaces structured current-truth facts/interpretation/sources, never parsed from prose", () => {
    const meta = getSageMeta(MIXED_RESPONSE);
    expect(meta.basis).toBe("MIXED");
    expect(meta.hasCurrentTruth).toBe(true);
    expect(meta.currentTruthFacts).toEqual(["Refresh Replay Detection is CONTROL_FAILURE.", "Evidence updated 2026-09-11."]);
    expect(meta.currentTruthInterpretation).toEqual(["This control needs attention."]);
    expect(meta.currentTruthSources).toEqual([{ type: "SecurityControl", id: "42" }]);
    // The Knowledge half is still the pure Sage prose, not "CURRENT STATE\n...".
    expect(meta.knowledgeAnswer).toBe("Refresh replay detection works by...");
  });

  test("HISTORY_UNAVAILABLE has empty excerpts/citations and a limitations entry", () => {
    const meta = getSageMeta(HISTORY_RESPONSE);
    expect(meta.basis).toBe("UNAVAILABLE_HISTORY");
    expect(meta.knowledgeExcerpts).toEqual([]);
    expect(meta.citations).toEqual([]);
    expect(meta.limitations.length).toBeGreaterThan(0);
    expect(meta.hasCurrentTruth).toBe(false);
  });

  test("tolerates a response with a missing context object entirely", () => {
    const meta = getSageMeta({ information_need: "KNOWLEDGE", basis: "KNOWLEDGE", answer: "fallback text" });
    expect(meta).not.toBeNull();
    expect(meta.knowledgeExcerpts).toEqual([]);
    expect(meta.knowledgeAnswer).toBe("fallback text");
  });
});

describe("basis labels/tooltips", () => {
  test("every real AnswerBasis value has a label and a tooltip", () => {
    Object.values(ANSWER_BASIS).forEach((basis) => {
      expect(getBasisLabel(basis)).toEqual(expect.any(String));
      expect(getBasisLabel(basis).length).toBeGreaterThan(0);
      expect(getBasisTooltip(basis).length).toBeGreaterThan(0);
    });
  });

  test("an unrecognized basis value fails safe instead of throwing", () => {
    expect(() => getBasisLabel("SOMETHING_NEW")).not.toThrow();
    expect(getBasisLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(getBasisTooltip("SOMETHING_NEW")).toBe("");
  });
});

describe("learning mode prompt builders", () => {
  test("every mode has a label, a leadIn, and a working buildPrompt", () => {
    LEARNING_MODES.forEach((mode) => {
      expect(mode.label.length).toBeGreaterThan(0);
      expect(mode.leadIn.length).toBeGreaterThan(0);
      expect(mode.buildPrompt("the Gateway")).toContain("the Gateway");
    });
    expect(getLearningModeLabel("QUIZ")).toBe("Quiz");
  });

  test("buildQuizRevealPrompt appends an explicit reveal request the backend's wants_quiz_answer() recognizes", () => {
    expect(buildQuizRevealPrompt("Quiz me on token families.")).toBe("Quiz me on token families. Show me the answer.");
    expect(buildQuizRevealPrompt("")).toBe("Show me the answer.");
  });

  test("buildAskAboutPrompt produces an EXPLAIN-shaped message", () => {
    expect(buildAskAboutPrompt("the Gateway")).toBe("Explain the Gateway");
  });
});
