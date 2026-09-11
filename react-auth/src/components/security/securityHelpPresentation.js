// Presentation-only formatting for B-UX1 security help content. This module
// defines frontend section headings and layout order; it must never define
// or rewrite the explanatory values themselves -- those come verbatim from
// the backend (security/help_content.py via /security/help/).
import { humanizeEnum } from "./securityLabels";

// Ordered so the popup reads: what it is, why it matters, how it's
// determined/verified, then per-status meanings. Fields not present on a
// given topic/control are simply skipped -- no heading is invented for
// missing content.
const SECTION_FIELD_ORDER = [
  ["what_it_is", "What is this?"],
  ["protects_against", "What does this protect?"],
  ["why_it_matters", "Why does it matter?"],
  ["how_it_is_determined", "How is it determined?"],
  ["verification_summary", "How is it verified?"],
  ["healthy_means", "What does HEALTHY mean?"],
  ["failure_means", "What would failure mean?"],
  ["what_to_look_for", "What should I look for?"],
  ["status_explanation", "What does the current status mean?"],
  ["data_source", "Data source"],
  ["operator_guidance", "Operator guidance"],
];

/**
 * Returns an ordered list of { key, heading, body } sections for whichever
 * fields are actually present on the help object. Does not render
 * short_description (treated as a lede by the caller) or status_explanations
 * (a labeled map, handled separately by getStatusExplanationEntries).
 */
export function getHelpSections(help) {
  if (!help || typeof help !== "object") {
    return [];
  }

  return SECTION_FIELD_ORDER.filter(([field]) => Boolean(help[field])).map(([field, heading]) => ({
    key: field,
    heading,
    body: help[field],
  }));
}

/**
 * status_explanations is a backend-provided { STATUS_KEY: "explanation" }
 * map (e.g. control/session/validation statuses). Formats only the status
 * key for display -- the explanation text is rendered verbatim.
 */
export function getStatusExplanationEntries(help) {
  const statusExplanations = help?.status_explanations;
  if (!statusExplanations || typeof statusExplanations !== "object") {
    return [];
  }

  return Object.entries(statusExplanations).map(([statusKey, text]) => ({
    statusKey,
    statusLabel: humanizeEnum(statusKey).toUpperCase(),
    text,
  }));
}

/**
 * Looks up the explanation for one known backend status key. This is exact
 * by design: callers pass the status value they received from the backend,
 * and we do not normalize or substitute another security meaning.
 */
export function getCurrentStatusExplanationEntry(help, currentStatus) {
  const statusExplanations = help?.status_explanations;
  if (!currentStatus || !statusExplanations || typeof statusExplanations !== "object") {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(statusExplanations, currentStatus)) {
    return null;
  }

  return {
    statusKey: currentStatus,
    statusLabel: humanizeEnum(currentStatus).toUpperCase(),
    text: statusExplanations[currentStatus],
  };
}

/** Formats a related_view topic key into a readable label. Not a route. */
export function getRelatedViewLabel(relatedView) {
  if (!relatedView) {
    return null;
  }
  return humanizeEnum(relatedView);
}
