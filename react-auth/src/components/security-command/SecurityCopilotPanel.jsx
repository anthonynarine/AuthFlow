import React, { useEffect, useRef, useState } from "react";
import { useSecurityCopilot } from "../../hooks/useSecurityCopilot";
import { CopilotMessage } from "./CopilotMessage";
import { LEARNING_MODES, SUGGESTED_MASTERY_PROMPTS } from "./sageResponse";

const BASE_PROMPTS = ["What's happening?", "What needs my attention?", "Explain finding", "Show evidence"];

const OPERATIONAL_PROMPT_BY_ACTION = {
  INVESTIGATE: "Ask Blue Team to investigate",
  RED_TEAM_REPRODUCE: "Have Red Team reproduce",
  PREPARE_REPAIR: "Ask Green Team to prepare repair",
  VALIDATE_REPAIR: "Ask Security Validator to verify",
};

// Incident Commander action_status values that mean a request actually reached
// the workflow engine and may have changed backend state. FAILED is included
// deliberately: a live test proved Gateway can deny execution after a
// task/run/audit row already exists, so "the operation failed" is not the
// same as "nothing changed." SUGGESTED and NO_ACTION never reach Incident
// Commander routing, so they are intentionally excluded.
const OPERATIONAL_REFRESH_ACTION_STATUSES = new Set([
  "DISPATCHED",
  "FAILED",
  "ALREADY_COMPLETE",
  "NOT_ELIGIBLE",
  "DENIED",
]);

function isOperationalRefreshResponse(response) {
  return Boolean(response && OPERATIONAL_REFRESH_ACTION_STATUSES.has(response.action_status));
}

/**
 * `initialPrompt`: B-UX3's "Ask Gait about this" / "Teach this" hand-off
 * from elsewhere in the app (B-UX2 drawer, a security object's Teach
 * This action). Sent once, automatically, on mount/change; the caller
 * (SecurityCommandPage) is responsible for clearing whatever navigation
 * state produced it via `onInitialPromptConsumed` so it isn't resent on
 * a later remount (e.g. browser back).
 */
export function SecurityCopilotPanel({
  caseId,
  findingId,
  nextAvailableAction,
  onOperationalResponse,
  initialPrompt,
  onInitialPromptConsumed,
}) {
  const { messages, send, isSending } = useSecurityCopilot({ caseId, findingId });
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const consumedInitialPromptRef = useRef(false);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestedPrompts = [...BASE_PROMPTS];
  const operationalPrompt = OPERATIONAL_PROMPT_BY_ACTION[nextAvailableAction];
  if (operationalPrompt) {
    suggestedPrompts.push(operationalPrompt);
  }
  const masteryPrompts = messages.length === 0 ? SUGGESTED_MASTERY_PROMPTS : [];

  // The backend response is trusted state about whether the request changed
  // anything -- Incident Commander's action_status, not the prose answer.
  // On a match, tell SecurityCommandPage to refetch trusted workflow state
  // immediately instead of waiting for the next poll. A copilot request
  // failure (network/HTTP) is already handled inside useSecurityCopilot and
  // must not trigger a refresh here.
  const dispatch = (message) => {
    send(message)
      .then((response) => {
        if (isOperationalRefreshResponse(response)) {
          onOperationalResponse?.();
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!initialPrompt || consumedInitialPromptRef.current) {
      return;
    }
    consumedInitialPromptRef.current = true;
    dispatch(initialPrompt);
    onInitialPromptConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.trim() || isSending) {
      return;
    }
    dispatch(draft);
    setDraft("");
  };

  const handleSuggestion = (prompt) => {
    if (isSending) {
      return;
    }
    dispatch(prompt);
  };

  // A mastery mode button either sends immediately (draft already has a
  // topic in it) or, with an empty draft, fills in the mode's lead-in
  // phrase and focuses the input so the operator can type the topic --
  // never a hidden request field, never a client-side mode classifier.
  const handleMode = (mode) => {
    if (isSending) {
      return;
    }
    const topic = draft.trim();
    if (topic) {
      dispatch(mode.buildPrompt(topic));
      setDraft("");
    } else {
      setDraft(mode.leadIn);
      inputRef.current?.focus();
    }
  };

  const handleAsk = (prompt) => {
    if (isSending) {
      return;
    }
    dispatch(prompt);
  };

  return (
    <div className="copilot-panel">
      <div className="copilot-panel-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="copilot-panel-empty">
            Ask Gait what needs attention, request a workflow step like "Ask Blue Team to investigate," or ask it to
            teach you a concept, like "Teach me the Gateway."
          </p>
        ) : (
          messages.map((message, index) => (
            <CopilotMessage
              key={message.id}
              message={message}
              originalMessage={message.role === "gait" ? messages[index - 1]?.text : undefined}
              onAsk={handleAsk}
            />
          ))
        )}
        {isSending && <p className="copilot-panel-typing">Gait is thinking…</p>}
      </div>

      <div className="copilot-mode-controls" role="group" aria-label="Learning modes">
        {LEARNING_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className="copilot-mode-button"
            onClick={() => handleMode(mode)}
            disabled={isSending}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="copilot-panel-suggestions">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="copilot-suggestion"
            onClick={() => handleSuggestion(prompt)}
            disabled={isSending}
          >
            {prompt}
          </button>
        ))}
      </div>

      {masteryPrompts.length > 0 && (
        <div className="copilot-panel-suggestions copilot-panel-suggestions--mastery">
          {masteryPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="copilot-suggestion copilot-suggestion--mastery"
              onClick={() => handleSuggestion(prompt)}
              disabled={isSending}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form className="copilot-panel-form" onSubmit={handleSubmit}>
        <label htmlFor="copilot-input" className="sr-only">
          Ask Security Copilot
        </label>
        <input
          id="copilot-input"
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Gait…"
          disabled={isSending}
          autoComplete="off"
        />
        <button type="submit" className="security-button primary" disabled={isSending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
