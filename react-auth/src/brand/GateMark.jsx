import React from "react";

// The Gait gate mark (16px grid, from the chosen logo system): two posts and a
// lintel, single ink. currentColor so it follows the surrounding text color.
// The same drawing as public/favicon.svg. Decorative: the text "Gait" beside
// it carries the name.
export function GateMark({ className = "gate-mark" }) {
  return (
    <svg
      className={className}
      data-testid="gate-mark"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 13.2V4.6" />
      <path d="M11.5 13.2V4.6" />
      <path d="M4.5 4.6h7" />
    </svg>
  );
}

export default GateMark;
