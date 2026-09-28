import React, { useState } from "react";
import { useApplicationCredential } from "../../../hooks/useApplicationCredential";
import { AuthHeading } from "../../../ds/AuthLayout";
import { Alert, Button } from "../../../ds/components";
import { FRAMEWORKS, buildSetupSteps } from "./sdkInstructions";

function describeError(error) {
  if (error?.response?.status === 403) {
    return "You don't have permission to generate a Connection Key for this App.";
  }
  if (error?.response?.data?.detail) {
    return String(error.response.data.detail);
  }
  return "Something went wrong generating your Connection Key. Please try again.";
}

function FrameworkPicker({ frameworkKey, onChoose, stepLabel }) {
  return (
    <>
      <AuthHeading
        eyebrow={stepLabel}
        title="What is this App built with?"
        lede="This only decides which setup instructions to show you — Gait doesn't store it."
      />
      <div className="ds-choices" role="group" aria-label="Framework">
        {FRAMEWORKS.map((framework) => (
          <button
            key={framework.key}
            type="button"
            className="ds-choice"
            aria-pressed={frameworkKey === framework.key}
            onClick={() => onChoose(framework.key)}
          >
            {framework.label}
          </button>
        ))}
      </div>
    </>
  );
}

function SetupInstructions({ frameworkKey, onChangeFramework, connectionKey, onGenerateKey, isIssuing, keyError, stepLabel }) {
  const steps = buildSetupSteps({ frameworkKey, connectionKey });

  return (
    <>
      <div className="ds-head-row">
        <AuthHeading eyebrow={stepLabel} title="Set up the Gait SDK" focusOnMount />
        <button type="button" className="ds-link ds-link--quiet" onClick={onChangeFramework}>
          Change framework
        </button>
      </div>

      {!connectionKey && (
        <div className="ds-alert">
          <span className="ds-alert-mark" aria-hidden="true">i</span>
          <div className="ds-form">
            <p className="ds-text">
              You'll need a Connection Key for step 2 below. It's shown exactly once — if you've already generated and
              saved one for this App, you don't need another.
            </p>
            <div className="ds-row-actions">
              <Button small onClick={onGenerateKey} disabled={isIssuing}>
                {isIssuing ? "Generating…" : "Generate Connection Key"}
              </Button>
            </div>
            {keyError && <p className="ds-error" role="alert">{describeError(keyError)}</p>}
          </div>
        </div>
      )}

      {/* New tab: navigating away here would lose the wizard's place. */}
      <p className="ds-hint">
        Full guide:{" "}
        <a className="ds-link ds-link--quiet" href="/docs/connecting-your-software" target="_blank" rel="noopener noreferrer">
          Connecting your software
        </a>{" "}
        (opens in a new tab)
      </p>

      <ol className="ds-steps-list">
        {steps.map((step) => (
          <li key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            {step.code && <pre className="ds-code-block">{step.code}</pre>}
            {step.note && <p className="ds-hint">{step.note}</p>}
          </li>
        ))}
      </ol>
    </>
  );
}

function ConnectionKeyScreen({ credential, onAcknowledge }) {
  const [copyState, setCopyState] = useState("idle");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(credential.rawSecret);
      setCopyState("copied");
    } catch {
      setCopyState("idle");
    }
  };

  return (
    <>
      <AuthHeading eyebrow="Connection Key" title="Save this key now." lede="Gait will not show it again." focusOnMount />

      <div className="ds-secret" role="group" aria-label="Connection Key">
        <code>{credential.rawSecret}</code>
      </div>

      <div className="ds-row-actions">
        <Button kind="secondary" small onClick={handleCopy}>
          {copyState === "copied" ? "Copied" : "Copy key"}
        </Button>
      </div>
      <p className="ds-visually-hidden" role="status" aria-live="polite">{copyState === "copied" ? "Copied the key." : ""}</p>

      <Alert kind="warning">
        This is a backend secret. Never put it in frontend code, a browser, a build-time <code>.env</code> file, or
        source control — set it as a server-side environment variable only.
      </Alert>

      <label className="ds-check">
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
        <span>I saved my Connection Key</span>
      </label>

      <div className="ds-actions">
        <Button disabled={!acknowledged} onClick={onAcknowledge}>
          Continue
        </Button>
      </div>
    </>
  );
}

/**
 * Setup steps 3–4, combined and reused by both the onboarding wizard and the
 * standalone /workspace/apps/:id/setup route: framework choice (UI-only,
 * never sent to the backend) -> SDK install instructions -> Connection Key
 * issuance and one-time display.
 */
export function AppSetupFlow({ organizationSlug, application, onDone, stepLabel = "App setup" }) {
  const [frameworkKey, setFrameworkKey] = useState(null);
  const { credential, isIssuing, error: keyError, issueCredential, forgetCredential } = useApplicationCredential(
    organizationSlug,
    application?.id
  );

  if (!frameworkKey) {
    return <FrameworkPicker frameworkKey={frameworkKey} onChoose={setFrameworkKey} stepLabel={stepLabel} />;
  }

  if (credential) {
    return (
      <ConnectionKeyScreen
        credential={credential}
        onAcknowledge={() => {
          // Deliberate, explicit discard — the raw secret leaves memory the
          // moment the founder confirms they've saved it. There is no path
          // back to viewing it again from here.
          forgetCredential();
          onDone?.();
        }}
      />
    );
  }

  return (
    <SetupInstructions
      frameworkKey={frameworkKey}
      onChangeFramework={() => setFrameworkKey(null)}
      connectionKey={null}
      onGenerateKey={() => issueCredential().catch(() => {})}
      isIssuing={isIssuing}
      keyError={keyError}
      stepLabel={stepLabel}
    />
  );
}

export default AppSetupFlow;
