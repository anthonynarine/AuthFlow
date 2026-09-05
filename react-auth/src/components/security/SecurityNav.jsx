import React from "react";

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "controls", label: "Controls" },
  { key: "findings", label: "Findings" },
  { key: "evidence", label: "Evidence" },
  { key: "events", label: "Events" },
  { key: "sessions", label: "Sessions" },
];

export function SecurityNav({ activeSection, onSelect }) {
  return (
    <nav className="security-nav" aria-label="Security Observatory sections">
      {SECTIONS.map((section) => {
        const isActive = section.key === activeSection;
        return (
          <button
            key={section.key}
            type="button"
            className={`security-tab${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(section.key)}
          >
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
