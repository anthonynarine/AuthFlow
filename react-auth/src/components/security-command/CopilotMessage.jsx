import React from "react";
import { CommanderDecision } from "./CommanderDecision";
import { normalizeSecurityRoleText } from "./roleTerminology";

export function CopilotMessage({ message }) {
  if (message.role === "operator") {
    return (
      <div className="copilot-message copilot-message--operator">
        <p>{message.text}</p>
      </div>
    );
  }

  if (message.failed) {
    return (
      <div className="copilot-message copilot-message--gait copilot-message--failed">
        <p className="copilot-message-sender">Gait</p>
        <p>Gait could not complete that request. Try again.</p>
      </div>
    );
  }

  const response = message.response || {};

  return (
    <div className="copilot-message copilot-message--gait">
      <p className="copilot-message-sender">Gait</p>
      <p className="copilot-message-answer">{normalizeSecurityRoleText(response.answer)}</p>
      <CommanderDecision response={response} />
    </div>
  );
}
