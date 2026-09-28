import React from "react";
import { Alert, Button } from "../../../ds/components";

/** A failed load, in the card: what happened, and a way to try again. */
export function LoadFailed({ error, onRetry }) {
  const forbidden = error?.response?.status === 403;
  let message = "Something went wrong loading this. Please try again.";
  if (forbidden) message = "You don't have permission to see this workspace.";
  else if (!error?.response) message = "Couldn't reach Gait. Check your connection and try again.";
  return (
    <>
      <Alert kind="danger">{message}</Alert>
      {!forbidden && onRetry ? (
        <div className="ds-row-actions">
          <Button kind="secondary" small onClick={() => onRetry()}>
            Retry
          </Button>
        </div>
      ) : null}
    </>
  );
}

export default LoadFailed;
