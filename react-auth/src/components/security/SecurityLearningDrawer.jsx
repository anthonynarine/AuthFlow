import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLearningTopic } from "../../hooks/useSecurityLearning";
import { SecurityLearningView } from "./SecurityLearningView";
import { buildAskAboutPrompt } from "../security-command/sageResponse";
import "./SecurityLearning.css";

/**
 * Right-side drawer presenting one full B-UX2A LearningTopic, reached via
 * "Learn more" from a B-UX1 SecurityInfoButton (or the Learn Gait catalog).
 * Owns topic-detail loading/caching (via fetchLearningTopic), related-topic
 * navigation with a simple back stack, and drawer chrome (focus, Escape,
 * backdrop click). Never fabricates lesson content -- a failed fetch always
 * shows a restrained "unavailable" message instead of placeholder text, and
 * a failed related-topic navigation leaves the currently open lesson intact.
 */
export function SecurityLearningDrawer({ topicKey, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const navigate = useNavigate();
  const [stack, setStack] = useState(() => [topicKey]);
  const [topic, setTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [navError, setNavError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const currentKey = stack[stack.length - 1];

  // Loads only the initial topic. Related-topic navigation and Back are
  // handled imperatively below so a failed navigation never clears the
  // lesson currently on screen.
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    fetchLearningTopic(currentKey)
      .then((data) => {
        if (isMounted) {
          setTopic(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const navigateTo = useCallback(
    (key) => {
      if (!key || key === currentKey || isNavigating) {
        return;
      }
      setNavError(null);
      setIsNavigating(true);
      fetchLearningTopic(key)
        .then((data) => {
          setStack((prev) => [...prev, key]);
          setTopic(data);
        })
        .catch(() => {
          setNavError("Learning content unavailable.");
        })
        .finally(() => {
          setIsNavigating(false);
        });
    },
    [currentKey, isNavigating]
  );

  // B-UX3: hands the current topic off to Sage via Security Command's
  // Copilot, the third rung of the ⓘ -> Learn more -> Ask Gait ladder.
  // Sage itself decides how to answer -- this only supplies the starting
  // message text, never a mode/routing parameter.
  const handleAskGait = useCallback(() => {
    if (!topic?.title) {
      return;
    }
    navigate("/security-command", { state: { sagePrompt: buildAskAboutPrompt(topic.title) } });
  }, [navigate, topic]);

  const goBack = useCallback(() => {
    if (stack.length <= 1 || isNavigating) {
      return;
    }
    const targetStack = stack.slice(0, -1);
    const targetKey = targetStack[targetStack.length - 1];
    setNavError(null);
    setIsNavigating(true);
    fetchLearningTopic(targetKey)
      .then((data) => {
        setStack(targetStack);
        setTopic(data);
      })
      .catch(() => {
        setNavError("Learning content unavailable.");
      })
      .finally(() => {
        setIsNavigating(false);
      });
  }, [stack, isNavigating]);

  return (
    <div className="security-learning-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-learning-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-learning-drawer-head">
          <div className="security-learning-drawer-head-actions">
            {stack.length > 1 && (
              <button
                type="button"
                className="security-button secondary"
                onClick={goBack}
                disabled={isNavigating}
              >
                ← Back
              </button>
            )}
            <span id={titleId} className="security-learning-drawer-heading">
              {topic?.title || "Learn Gait"}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close learning view"
          >
            ×
          </button>
        </div>

        <div className="security-learning-drawer-body">
          {isLoading && <p className="security-learning-status">Loading lesson…</p>}
          {!isLoading && loadError && <p className="security-learning-status">Learning content unavailable.</p>}
          {!isLoading && !loadError && (
            <>
              {navError && (
                <p className="security-learning-nav-error" role="alert">
                  {navError}
                </p>
              )}
              <SecurityLearningView topic={topic} onSelectRelated={navigateTo} />
              {topic?.title && (
                <button type="button" className="help-learn-more" onClick={handleAskGait}>
                  Ask Gait about this →
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default SecurityLearningDrawer;
