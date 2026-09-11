import React from "react";
import { CommanderDecision } from "./CommanderDecision";
import { SageErrorBoundary } from "./SageErrorBoundary";
import { SecuritySageResponse } from "./SecuritySageResponse";
import { isSageResponse } from "./sageResponse";
import { normalizeSecurityRoleText } from "./roleTerminology";

export function CopilotMessage({ message, originalMessage, onAsk }) {
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
      {isSageResponse(response) ? (
        <SageErrorBoundary fallbackAnswer={response.answer}>
          <SecuritySageResponse response={response} originalMessage={originalMessage} onAsk={onAsk} />
        </SageErrorBoundary>
      ) : (
        <p className="copilot-message-answer">{normalizeSecurityRoleText(response.answer)}</p>
      )}
      <CommanderDecision response={response} />
    </div>
  );
}
