import React from "react";
import { normalizeSecurityRoleText } from "./roleTerminology";

/**
 * Renders the live, authoritative half of a MIXED Sage answer. Sourced
 * only from the backend's own structured `facts`/`interpretation`/
 * `sources` arrays -- never parsed out of prose, never inferred from
 * citations or documentation, per B-UX3's core "never blur Current Truth
 * with Knowledge" principle. Visually separate from the Knowledge
 * section it's always paired with in a MIXED response.
 */
export function SageCurrentTruthCard({ facts, interpretation, sources }) {
  const hasFacts = Array.isArray(facts) && facts.length > 0;
  const hasInterpretation = Array.isArray(interpretation) && interpretation.length > 0;
  const hasSources = Array.isArray(sources) && sources.length > 0;

  if (!hasFacts && !hasInterpretation && !hasSources) {
    return null;
  }

  return (
    <section className="sage-current-truth" aria-label="Current Truth">
      <p className="sage-section-label">Current Truth</p>
      {hasFacts && (
        <ul className="sage-fact-list">
          {facts.map((fact) => (
            <li key={fact}>{normalizeSecurityRoleText(fact)}</li>
          ))}
        </ul>
      )}
      {hasInterpretation && (
        <ul className="sage-fact-list sage-interpretation-list">
          {interpretation.map((item) => (
            <li key={item}>{normalizeSecurityRoleText(item)}</li>
          ))}
        </ul>
      )}
      {hasSources && (
        <ul className="related-id-list">
          {sources.map((source, index) => (
            <li key={`${source.type || "source"}-${source.id || index}`}>
              {source.type ? `${source.type} #${source.id ?? "?"}` : String(source.id ?? source)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SageCurrentTruthCard;
