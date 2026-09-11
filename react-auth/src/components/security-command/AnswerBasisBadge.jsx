import React from "react";
import { getBasisLabel, getBasisTooltip } from "./sageResponse";

const BASIS_TONE = {
  KNOWLEDGE: "neutral",
  CURRENT_TRUTH: "success",
  MIXED: "attention",
  ACTION_ROUTED: "success",
  UNAVAILABLE_HISTORY: "attention",
};

/**
 * One compact badge distinguishing what a Copilot answer is actually
 * based on. The label text itself carries the meaning (never color
 * alone), and the tooltip is real title text, not a hover-only reveal.
 */
export function AnswerBasisBadge({ basis }) {
  if (!basis) {
    return null;
  }
  const tone = BASIS_TONE[basis] || "neutral";
  const label = getBasisLabel(basis);
  const tooltip = getBasisTooltip(basis);

  return (
    <span
      className={`security-badge sage-basis-badge sage-basis-${tone}`}
      title={tooltip}
      aria-label={tooltip ? `${label}: ${tooltip}` : label}
    >
      {label}
    </span>
  );
}

export default AnswerBasisBadge;
