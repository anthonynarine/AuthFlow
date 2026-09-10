import React, { useEffect, useRef, useState } from "react";
import { useSecurityCopilot } from "../../hooks/useSecurityCopilot";
import { CopilotMessage } from "./CopilotMessage";

const BASE_PROMPTS = ["What's happening?", "What needs my attention?", "Explain finding", "Show evidence"];

const OPERATIONAL_PROMPT_BY_ACTION = {
  INVESTIGATE: "Ask Blue Team to investigate",
  RED_TEAM_REPRODUCE: "Have Red Team reproduce",
  PREPARE_REPAIR: "Ask Green Team to prepare repair",
  VALIDATE_REPAIR: "Ask Security Validator to verify",
};

export function SecurityCopilotPanel({ caseId, findingId, nextAvailableAction }) {
  const { messages, send, isSending } = useSecurityCopilot({ caseId, findingId });
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.trim() || isSending) {
      return;
    }
    send(draft);
    setDraft("");
  };

  const handleSuggestion = (prompt) => {
    if (isSending) {
      return;
    }
    send(prompt);
  };

  return (
    <div className="copilot-panel">
      <div className="copilot-panel-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="copilot-panel-empty">
            Ask Gait what needs attention, or request a single workflow step like "Ask Blue Team to investigate" or
            "Ask Security Validator to verify."
          </p>
        ) : (
          messages.map((message) => <CopilotMessage key={message.id} message={message} />)
        )}
        {isSending && <p className="copilot-panel-typing">Gait is thinking…</p>}
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

      <form className="copilot-panel-form" onSubmit={handleSubmit}>
        <label htmlFor="copilot-input" className="sr-only">
          Ask Security Copilot
        </label>
        <input
          id="copilot-input"
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
