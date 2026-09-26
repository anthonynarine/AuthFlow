import React, { useState } from "react";
import { useApplicationCredential } from "../../../hooks/useApplicationCredential";
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
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">{stepLabel}</p>
      <h1 className="onboarding-title">What is this App built with?</h1>
      <p className="onboarding-sub">This only decides which setup instructions to show you — Gait doesn't store it.</p>
      <div className="onboarding-framework-grid">
        {FRAMEWORKS.map((framework) => (
          <button
            key={framework.key}
            type="button"
            className={`onboarding-framework-card${frameworkKey === framework.key ? " is-selected" : ""}`}
            onClick={() => onChoose(framework.key)}
          >
            {framework.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SetupInstructions({ frameworkKey, onChangeFramework, connectionKey, onGenerateKey, isIssuing, keyError, stepLabel }) {
  const steps = buildSetupSteps({ frameworkKey, connectionKey });

  return (
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">{stepLabel}</p>
      <div className="onboarding-title-row">
        <h1 className="onboarding-title">Set up the Gait SDK</h1>
        <button type="button" className="onboarding-link-button" onClick={onChangeFramework}>
          Change framework
        </button>
      </div>

      {!connectionKey && (
        <div className="onboarding-callout">
          <p>
            You'll need a Connection Key for step 2 below. It's shown exactly once — if you've already generated and
            saved one for this App, you don't need another.
          </p>
          <button type="button" className="fw-btn primary" onClick={onGenerateKey} disabled={isIssuing}>
            {isIssuing ? "Generating…" : "Generate Connection Key"}
          </button>
          {keyError && <p className="onboarding-error">{describeError(keyError)}</p>}
        </div>
      )}

      {/* New tab: navigating away here would lose the wizard's place. */}
      <p className="onboarding-note">
        Full guide:{" "}
        <a href="/docs/connecting-your-software" target="_blank" rel="noopener noreferrer">
          Connecting your software
        </a>{" "}
        (opens in a new tab)
      </p>

      <ol className="onboarding-setup-steps">
        {steps.map((step) => (
          <li key={step.title} className="onboarding-setup-step">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {step.code && <pre className="onboarding-code">{step.code}</pre>}
            {step.note && <p className="onboarding-note">{step.note}</p>}
          </li>
        ))}
      </ol>
    </div>
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
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">Connection Key</p>
      <h1 className="onboarding-title">Save this key now.</h1>
      <p className="onboarding-sub">Gait will not show it again.</p>

      <div className="onboarding-secret-box" role="group" aria-label="Connection Key">
        <code>{credential.rawSecret}</code>
      </div>

      <div className="onboarding-secret-actions">
        <button type="button" className="fw-btn" onClick={handleCopy}>
          {copyState === "copied" ? "Copied" : "Copy key"}
        </button>
      </div>

      <p className="onboarding-secret-warning">
        This is a backend secret. Never put it in frontend code, a browser, a build-time <code>.env</code> file, or
        source control — set it as a server-side environment variable only.
      </p>

      <label className="onboarding-checkbox">
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
        <span>I saved my Connection Key</span>
      </label>

      <button type="button" className="fw-btn primary" disabled={!acknowledged} onClick={onAcknowledge}>
        Continue
      </button>
    </div>
  );
}

/**
 * UI2 Steps 3–4, combined and reused by both the onboarding wizard and the
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
