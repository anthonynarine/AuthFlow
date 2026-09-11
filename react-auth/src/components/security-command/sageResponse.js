/**
 * B-UX3 (Sage): normalizes the additive B-KNOW3 fields on a
 * `POST /security/copilot/query/` response into one shape every Sage UI
 * component reads from, instead of scattering `response.context.sage.*`
 * lookups across components. Mirrors the real backend contract in
 * `security/copilot.py::SecurityCopilotService._sage_response` and
 * `security_knowledge/sage/contracts.py::SageAnswer` verbatim -- no field
 * is invented, relabeled, or guessed here.
 *
 * A response is Sage-handled iff `information_need` is present. Action
 * responses (`action_status` present) always return *before* Sage
 * classification ever runs (`answer()`'s command_routing short-circuit),
 * so the two are mutually exclusive on every real response -- this
 * module and CommanderDecision never both claim the same message.
 */

// ---------------------------------------------------------------------------
// Answer basis
// ---------------------------------------------------------------------------

export const ANSWER_BASIS = {
  KNOWLEDGE: "KNOWLEDGE",
  CURRENT_TRUTH: "CURRENT_TRUTH",
  MIXED: "MIXED",
  ACTION_ROUTED: "ACTION_ROUTED",
  UNAVAILABLE_HISTORY: "UNAVAILABLE_HISTORY",
};

const BASIS_LABELS = {
  [ANSWER_BASIS.KNOWLEDGE]: "Knowledge",
  [ANSWER_BASIS.CURRENT_TRUTH]: "Current Truth",
  [ANSWER_BASIS.MIXED]: "Mixed",
  [ANSWER_BASIS.ACTION_ROUTED]: "Action Routed",
  [ANSWER_BASIS.UNAVAILABLE_HISTORY]: "History Unavailable",
};

const BASIS_TOOLTIPS = {
  [ANSWER_BASIS.KNOWLEDGE]: "Canonical documentation retrieved through Vault.",
  [ANSWER_BASIS.CURRENT_TRUTH]: "Live authoritative system state.",
  [ANSWER_BASIS.MIXED]: "A combination of live state and canonical explanation.",
  [ANSWER_BASIS.ACTION_ROUTED]: "Operational intent handled through Incident Commander/Gateway.",
  [ANSWER_BASIS.UNAVAILABLE_HISTORY]: "General historical retrieval is not implemented yet.",
};

export function getBasisLabel(basis) {
  return BASIS_LABELS[basis] || basis || "Unknown";
}

export function getBasisTooltip(basis) {
  return BASIS_TOOLTIPS[basis] || "";
}

// ---------------------------------------------------------------------------
// Learning modes -- these are UI-side prompt templates only. There is no
// backend `learning_mode` request parameter (confirmed against
// `SecurityCopilotService.answer()` and `sage_service.answer_knowledge_query`
// in the b-know3/sage-grounded-copilot worktree): mode is classified
// entirely from message phrasing by `sage.routing.classify_learning_mode`.
// So "selecting a mode" here means building a message the backend's own
// classifier will recognize -- never a hidden field, never a JS
// reimplementation of the classifier itself.
// ---------------------------------------------------------------------------

export const LEARNING_MODES = [
  { key: "EXPLAIN", label: "Explain", leadIn: "Explain ", buildPrompt: (topic) => `Explain ${topic}` },
  {
    key: "DEEP_DIVE",
    label: "Deep Dive",
    leadIn: "Give me a deep dive on ",
    buildPrompt: (topic) => `Give me a deep dive on ${topic}`,
  },
  {
    key: "CODE_WALK",
    label: "Code Walk",
    leadIn: "Which files should I read to understand ",
    buildPrompt: (topic) => `Which files should I read to understand ${topic}?`,
  },
  { key: "QUIZ", label: "Quiz Me", leadIn: "Quiz me on ", buildPrompt: (topic) => `Quiz me on ${topic}` },
  {
    key: "PRACTICE",
    label: "Practice",
    leadIn: "Give me a practice exercise about ",
    buildPrompt: (topic) => `Give me a practice exercise about ${topic}`,
  },
  { key: "COMPARE", label: "Compare", leadIn: "Compare ", buildPrompt: (topic) => `Compare ${topic}` },
];

const LEARNING_MODE_LABELS = {
  EXPLAIN: "Explain",
  DEEP_DIVE: "Deep Dive",
  CODE_WALK: "Code Walk",
  QUIZ: "Quiz",
  PRACTICE: "Practice",
  COMPARE: "Compare",
};

export function getLearningModeLabel(mode) {
  return LEARNING_MODE_LABELS[mode] || null;
}

/** Appends an explicit reveal request -- matches
 * `learning_sources.wants_quiz_answer`'s substring check on "answer"
 * exactly, so this reliably lifts the backend's own QUIZ answer-guide
 * exclusion rather than a frontend guess at the answer. */
export function buildQuizRevealPrompt(originalMessage) {
  const trimmed = (originalMessage || "").trim();
  if (!trimmed) {
    return "Show me the answer.";
  }
  return `${trimmed} Show me the answer.`;
}

// A curated set of starter prompts shown when the Copilot conversation is
// empty (B-UX3 section 19). These are only starters typed by a human into
// the same free-text input every other message goes through -- never a
// hardcoded response, and never a hidden mode parameter.
export const SUGGESTED_MASTERY_PROMPTS = [
  "Teach me the Gateway",
  "Explain Security Truth",
  "Quiz me on session security",
  "Give me a refresh replay exercise",
  "Which files should I read to understand deployment?",
  "Why can't Incident Commander deploy?",
];

export function buildTeachPrompt(topic) {
  return `Teach me about ${topic}.`;
}

export function buildAskAboutPrompt(topic) {
  return `Explain ${topic}`;
}

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

export function isSageResponse(response) {
  return Boolean(response && response.information_need);
}

/**
 * Pulls every B-KNOW3 field out of one Copilot response into a flat,
 * component-friendly shape. Returns null for a non-Sage response so
 * callers can `if (!sage) return null` instead of null-checking every
 * field individually.
 */
export function getSageMeta(response) {
  if (!isSageResponse(response)) {
    return null;
  }

  const sageData = (response.context && response.context.sage) || {};
  const basis = response.basis || sageData.basis || null;
  const hasCurrentTruth = basis === ANSWER_BASIS.MIXED;

  return {
    informationNeed: response.information_need,
    basis,
    learningMode: response.learning_mode || null,
    // The pure knowledge/teaching text, deliberately NOT the combined
    // "CURRENT STATE\n...\n\nHOW IT WORKS\n..." string copilot.py puts in
    // the top-level `answer` for MIXED responses -- that string exists as
    // a convenience for plain-text consumers, but this UI renders Current
    // Truth and Knowledge as visually separate structured sections
    // instead of parsing prose.
    knowledgeAnswer: sageData.answer || response.answer || "",
    knowledgeExcerpts: Array.isArray(sageData.knowledge_excerpts) ? sageData.knowledge_excerpts : [],
    citations: Array.isArray(response.citations) ? response.citations : [],
    limitations: Array.isArray(response.limitations) ? response.limitations : [],
    nextReading: Array.isArray(response.next_reading) ? response.next_reading : [],
    truncated: Boolean(sageData.truncated),
    fallbackUsed: Boolean(sageData.fallback_used),
    hasCurrentTruth,
    // Structured, backend-owned current-truth fields (never parsed out of
    // prose): for a MIXED response these top-level facts/interpretation/
    // sources ARE the live current-truth context
    // (`_sage_response` extends them from the same `CopilotContext` a
    // plain CURRENT_TRUTH-only answer would have used). For a
    // KNOWLEDGE-only response `facts` is just a citation-count line and
    // interpretation/sources are empty, so this is only surfaced when
    // hasCurrentTruth is true.
    currentTruthFacts: hasCurrentTruth && Array.isArray(response.facts) ? response.facts : [],
    currentTruthInterpretation: hasCurrentTruth && Array.isArray(response.interpretation) ? response.interpretation : [],
    currentTruthSources: hasCurrentTruth && Array.isArray(response.sources) ? response.sources : [],
  };
}
