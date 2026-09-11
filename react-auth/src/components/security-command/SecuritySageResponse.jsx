import React, { useState } from "react";
import { AnswerBasisBadge } from "./AnswerBasisBadge";
import { SageCurrentTruthCard } from "./SageCurrentTruthCard";
import { SageSourceDrawer } from "./SageSourceDrawer";
import { normalizeSecurityRoleText } from "./roleTerminology";
import { buildQuizRevealPrompt, getLearningModeLabel, getSageMeta } from "./sageResponse";

const SEQUENCED_MODES = new Set(["CODE_WALK", "PRACTICE"]);

function ExcerptCard({ excerpt, index, numbered }) {
  const heading = Array.isArray(excerpt.heading_path) ? excerpt.heading_path.join(" / ") : "";
  return (
    <li className="sage-excerpt-card">
      <p className="sage-excerpt-title">
        {numbered && <span className="sage-excerpt-index">{index + 1}.</span>}
        {excerpt.title}
        {heading && <span className="sage-excerpt-heading"> — {heading}</span>}
      </p>
      <p className="sage-excerpt-text">{normalizeSecurityRoleText(excerpt.text)}</p>
    </li>
  );
}

/**
 * Renders one grounded B-KNOW3 Sage answer: basis, an always-separate
 * Current Truth section for MIXED responses, the knowledge material
 * itself, limitations, next reading, and a Sources drawer trigger. Only
 * renders when `getSageMeta` recognizes the response as Sage-handled
 * (`information_need` present) -- never for a plain CURRENT_TRUTH-only
 * or ACTION response, which keep their existing rendering untouched.
 *
 * `onAsk(promptText)` sends a new message through the same Copilot the
 * rest of this panel already uses (Reveal Answer, next-reading follow-
 * ups) -- this component never talks to any API directly.
 */
export function SecuritySageResponse({ response, originalMessage, onAsk }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const meta = getSageMeta(response);
  if (!meta) {
    return null;
  }

  const {
    basis,
    learningMode,
    knowledgeAnswer,
    knowledgeExcerpts,
    citations,
    limitations,
    nextReading,
    fallbackUsed,
    hasCurrentTruth,
    currentTruthFacts,
    currentTruthInterpretation,
    currentTruthSources,
  } = meta;

  const modeLabel = getLearningModeLabel(learningMode);
  const numbered = SEQUENCED_MODES.has(learningMode);
  const hasExcerpts = knowledgeExcerpts.length > 0;

  return (
    <div className="sage-response">
      <div className="sage-response-head">
        <AnswerBasisBadge basis={basis} />
        {modeLabel && <span className="sage-mode-chip">{modeLabel}</span>}
      </div>

      {hasCurrentTruth && (
        <SageCurrentTruthCard
          facts={currentTruthFacts}
          interpretation={currentTruthInterpretation}
          sources={currentTruthSources}
        />
      )}

      <section className="sage-knowledge" aria-label="Knowledge">
        {hasCurrentTruth && <p className="sage-section-label">Why This Matters</p>}

        {hasExcerpts ? (
          <ul className="sage-excerpt-list">
            {knowledgeExcerpts.map((excerpt, index) => (
              <ExcerptCard key={excerpt.source_key + index} excerpt={excerpt} index={index} numbered={numbered} />
            ))}
          </ul>
        ) : (
          <p className="sage-knowledge-answer">{normalizeSecurityRoleText(knowledgeAnswer)}</p>
        )}

        {fallbackUsed && hasExcerpts && (
          <p className="security-muted sage-fallback-note">
            Gait couldn't synthesize a full explanation, but these canonical sources are relevant.
          </p>
        )}
      </section>

      {learningMode === "QUIZ" && (
        <div className="sage-quiz-actions">
          <button type="button" className="security-button secondary" onClick={() => onAsk(buildQuizRevealPrompt(originalMessage))}>
            Reveal Answer
          </button>
        </div>
      )}

      {limitations.length > 0 && (
        <ul className="sage-limitations">
          {limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {nextReading.length > 0 && (
        <div className="sage-next-reading">
          <p className="sage-section-label">Next reading</p>
          <div className="sage-next-reading-list">
            {nextReading.map((item) => (
              <button
                key={item.source_key}
                type="button"
                className="copilot-suggestion"
                onClick={() => onAsk(`Explain ${item.title}`)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <button type="button" className="link-button sage-sources-trigger" onClick={() => setSourcesOpen(true)}>
          Sources ({citations.length})
        </button>
      )}

      {sourcesOpen && (
        <SageSourceDrawer
          citations={citations}
          knowledgeExcerpts={knowledgeExcerpts}
          onClose={() => setSourcesOpen(false)}
        />
      )}
    </div>
  );
}

export default SecuritySageResponse;
