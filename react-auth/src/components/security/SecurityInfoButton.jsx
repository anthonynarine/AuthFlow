import React, { useEffect, useId, useRef, useState } from "react";
import { RiInformationFill } from "react-icons/ri";
import { getHelpSections, getRelatedViewLabel, getStatusExplanationEntries } from "./securityHelpPresentation";
import { normalizeSecurityRoleText } from "../security-command/roleTerminology";

/**
 * Renders one backend-provided help object (a security/help_content.py
 * topic, or a SecurityControlSerializer `help` payload) as a scannable
 * popup body. This component owns presentation only -- headings, order,
 * and layout -- never the explanatory text itself, which is rendered
 * verbatim (through the canonical-role-terminology normalizer only).
 */
function SecurityHelpContent({ help }) {
  const sections = getHelpSections(help);
  const statusEntries = getStatusExplanationEntries(help);
  const relatedViewLabel = getRelatedViewLabel(help.related_view);

  return (
    <>
      {help.short_description && <p className="help-lede">{normalizeSecurityRoleText(help.short_description)}</p>}
      {sections.map((section) => (
        <div className="help-section" key={section.key}>
          <h3>{section.heading}</h3>
          <p>{normalizeSecurityRoleText(section.body)}</p>
        </div>
      ))}
      {statusEntries.length > 0 && (
        <div className="help-section help-status-section">
          <h3>Status meanings</h3>
          <dl className="help-status-list">
            {statusEntries.map((entry) => (
              <div key={entry.statusKey}>
                <dt>{entry.statusLabel}</dt>
                <dd>{normalizeSecurityRoleText(entry.text)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {relatedViewLabel && <p className="help-related">Related: {relatedViewLabel}</p>}
    </>
  );
}

export function SecurityInfoButton({ title, children, label, content }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef(null);
  const resolvedTitle = title || content?.title;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="security-info-button"
        onClick={() => setIsOpen(true)}
        aria-label={label || `Explain ${resolvedTitle}`}
        title={label || `Explain ${resolvedTitle}`}
      >
        <RiInformationFill aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="security-info-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div
            className="security-info-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="security-info-dialog-head">
              <h2 id={titleId}>{resolvedTitle}</h2>
              <button
                ref={closeRef}
                type="button"
                className="security-button secondary"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="security-info-dialog-body">
              {content ? <SecurityHelpContent help={content} /> : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SecurityInfoButton;
