import React from "react";
import { normalizeSecurityRoleText } from "../security-command/roleTerminology";
import { humanizeEnum } from "./securityLabels";
import { SecurityLearningDiagram } from "./SecurityLearningDiagram";

// Ordered so a lesson reads: why it exists, how it works, how Gait actually
// uses it, a concrete example, then what can go wrong. Fields absent on a
// given topic are simply skipped -- no heading is invented for missing
// content (mirrors securityHelpPresentation.js's own rule for B-UX1).
const SECTION_FIELD_ORDER = [
  ["why_it_exists", "Why it exists"],
  ["how_it_works", "How it works"],
  ["how_gait_uses_it", "How Gait uses it"],
  ["example", "Example"],
  ["failure_scenario", "What can go wrong"],
];

/**
 * Renders one full B-UX2A LearningTopic (security/learning_content.py) as a
 * scannable deep-dive lesson. Presentation only -- every field is rendered
 * verbatim (through the same canonical-role-terminology normalizer B-UX1
 * uses), and this component owns headings/order/layout only, never the
 * teaching text itself.
 */
export function SecurityLearningView({ topic, onSelectRelated }) {
  if (!topic) {
    return null;
  }

  const sections = SECTION_FIELD_ORDER.filter(([field]) => Boolean(topic[field]));
  const keyTakeaways = Array.isArray(topic.key_takeaways) ? topic.key_takeaways : [];
  const relatedTopics = Array.isArray(topic.related_topics) ? topic.related_topics : [];
  const implementationReferences = Array.isArray(topic.implementation_references)
    ? topic.implementation_references
    : [];

  return (
    <article className="learning-view">
      <header className="learning-view-header">
        <div className="learning-view-header-top">
          {topic.category && <p className="learning-eyebrow">{normalizeSecurityRoleText(topic.category)}</p>}
          {topic.classification && <span className="learning-classification">{topic.classification}</span>}
        </div>
        <h2 className="learning-title">{normalizeSecurityRoleText(topic.title)}</h2>
        {topic.short_summary && <p className="learning-summary">{normalizeSecurityRoleText(topic.short_summary)}</p>}
      </header>

      {sections.map(([field, heading]) => (
        <section className="learning-section" key={field}>
          <h3>{heading}</h3>
          <p>{normalizeSecurityRoleText(topic[field])}</p>
        </section>
      ))}

      {topic.security_invariant && (
        <section className="learning-section learning-invariant">
          <h3>Security invariant</h3>
          <p>{normalizeSecurityRoleText(topic.security_invariant)}</p>
        </section>
      )}

      {keyTakeaways.length > 0 && (
        <section className="learning-section learning-takeaways">
          <h3>Key takeaways</h3>
          <ul>
            {keyTakeaways.map((point) => (
              <li key={point}>{normalizeSecurityRoleText(point)}</li>
            ))}
          </ul>
        </section>
      )}

      {topic.diagram && (
        <section className="learning-section learning-diagram-section">
          <h3>Architecture diagram</h3>
          <SecurityLearningDiagram diagram={topic.diagram} />
        </section>
      )}

      {relatedTopics.length > 0 && (
        <section className="learning-section learning-related">
          <h3>Related concepts</h3>
          <div className="learning-related-list">
            {relatedTopics.map((relatedKey) => (
              <button
                type="button"
                key={relatedKey}
                className="learning-related-chip"
                onClick={() => onSelectRelated?.(relatedKey)}
              >
                {humanizeEnum(relatedKey)}
              </button>
            ))}
          </div>
        </section>
      )}

      {implementationReferences.length > 0 && (
        <section className="learning-section learning-references">
          <h3>Implementation references</h3>
          <ul className="learning-reference-list">
            {implementationReferences.map((reference) => (
              <li key={reference}>
                <code>{reference}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default SecurityLearningView;
