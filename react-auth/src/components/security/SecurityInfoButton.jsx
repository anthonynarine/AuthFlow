import React, { useEffect, useId, useRef, useState } from "react";
import { RiInformationFill } from "react-icons/ri";
import {
  getCurrentStatusExplanationEntry,
  getHelpSections,
  getRelatedViewLabel,
  getStatusExplanationEntries,
} from "./securityHelpPresentation";
import { normalizeSecurityRoleText } from "../security-command/roleTerminology";
import { SecurityLearningDrawer } from "./SecurityLearningDrawer";
import "./SecurityLearning.css";

/**
 * Renders one backend-provided help object (a security/help_content.py
 * topic, or a SecurityControlSerializer `help` payload) as a scannable
 * popup body. This component owns presentation only -- headings, order,
 * and layout -- never the explanatory text itself, which is rendered
 * verbatim (through the canonical-role-terminology normalizer only).
 *
 * When the backend attaches `learning_topic_key` (B-UX2A), a restrained
 * "Learn more" action is shown that hands off to the deeper
 * SecurityLearningDrawer -- this popup itself stays a quick explanation.
 */
function SecurityHelpContent({ help, currentStatus, onLearnMore }) {
  const sections = getHelpSections(help);
  const currentStatusEntry = getCurrentStatusExplanationEntry(help, currentStatus);
  const statusEntries = currentStatus ? [] : getStatusExplanationEntries(help);
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
      {currentStatusEntry && (
        <div className="help-section help-status-section">
          <h3>Current status meaning</h3>
          <dl className="help-status-list">
            <div>
              <dt>{currentStatusEntry.statusLabel}</dt>
              <dd>{normalizeSecurityRoleText(currentStatusEntry.text)}</dd>
            </div>
          </dl>
        </div>
      )}
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
      {onLearnMore && (
        <button type="button" className="help-learn-more" onClick={onLearnMore}>
          Learn more →
        </button>
      )}
    </>
  );
}

export function SecurityInfoButton({ title, children, label, content, currentStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const [learningTopicKey, setLearningTopicKey] = useState(null);
  const titleId = useId();
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
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

  const handleLearnMore = () => {
    setIsOpen(false);
    setLearningTopicKey(content.learning_topic_key);
  };

  const closeLearningDrawer = () => {
    setLearningTopicKey(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <button
        ref={triggerRef}
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
              {content ? (
                <SecurityHelpContent
                  help={content}
                  currentStatus={currentStatus}
                  onLearnMore={content.learning_topic_key ? handleLearnMore : null}
                />
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      )}
      {learningTopicKey && (
        <SecurityLearningDrawer topicKey={learningTopicKey} onClose={closeLearningDrawer} />
      )}
    </>
  );
}

export default SecurityInfoButton;
