import { useCallback, useState } from "react";
import { authAxios } from "../interceptors/axios";

let messageCounter = 0;
function nextMessageId(prefix) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

/**
 * POST /security/copilot/query/ — read-only Q&A and single-step Incident Commander
 * requests through one endpoint. The request body is intentionally limited
 * to {message, case_id, finding_id}; the backend 400s on anything else
 * (tool_name, agent_principal, authority_level, approval_token, ...), so
 * this hook never constructs those fields.
 */
export function useSecurityCopilot({ caseId, findingId } = {}) {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(
    async (message) => {
      const trimmed = (message || "").trim();
      if (!trimmed) {
        return undefined;
      }

      setMessages((prev) => [...prev, { id: nextMessageId("operator"), role: "operator", text: trimmed }]);
      setIsSending(true);
      setError(null);

      try {
        const { data } = await authAxios.post("/security/copilot/query/", {
          message: trimmed,
          ...(caseId ? { case_id: caseId } : {}),
          ...(findingId ? { finding_id: findingId } : {}),
        });
        setMessages((prev) => [...prev, { id: nextMessageId("gait"), role: "gait", response: data }]);
        return data;
      } catch (requestError) {
        setError(requestError);
        setMessages((prev) => [...prev, { id: nextMessageId("gait-error"), role: "gait", failed: true }]);
        throw requestError;
      } finally {
        setIsSending(false);
      }
    },
    [caseId, findingId]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, send, clear, isSending, error };
}
