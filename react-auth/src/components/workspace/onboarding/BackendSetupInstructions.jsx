import React, { useRef, useState } from "react";
import "./backendSetup.css";
import { FRAMEWORKS, buildSetupSteps } from "./sdkInstructions";

function SetupCode({ code, title }) {
    const ref = useRef(null);
    const [status, setStatus] = useState("");
    const copy = async () => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(code);
            if (!ref.current) return;
            setStatus("Copied to clipboard.");
        } catch {
            if (!ref.current) return;
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(ref.current);
            selection.removeAllRanges();
            selection.addRange(range);
            setStatus("Clipboard unavailable. The snippet is selected: copy it manually.");
        }
    };
    return (
        <div className="gc-setup-code">
            <button type="button" className="gc-button gc-button--ghost" aria-label={`Copy ${title}`} onClick={copy}>Copy</button>
            <pre ref={ref} tabIndex={0}>{code}</pre>
            <span role="status" aria-live="polite" className="gc-muted">{status}</span>
        </div>
    );
}

/** Instructions contain placeholders only; the one-time key stays in its own field. */
export function BackendSetupInstructions({ frameworkKey, onChoose, organizationSlug, application, hideFrameworkChoice = false, stepIndex }) {
    const allSteps = buildSetupSteps({ frameworkKey, organizationSlug, application }).slice(0, 4);
    const steps = stepIndex === undefined ? allSteps : allSteps.filter((_, index) => index === stepIndex);
    return (
        <section className="gc-backend-setup" aria-label="Backend setup">
            {!hideFrameworkChoice ? <div className="gc-secret-actions" role="group" aria-label="Backend framework">
                {FRAMEWORKS.map((framework) => (
                    <button key={framework.key} type="button" className="gc-button gc-button--ghost"
                        aria-pressed={framework.key === frameworkKey} onClick={() => onChoose(framework.key)}>
                        {framework.label}
                    </button>
                ))}
            </div> : null}
            <ol className="gc-setup-steps" start={stepIndex === undefined ? 1 : stepIndex + 1}>
                {steps.map((step) => (
                    <li key={step.title}>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                        {step.code ? <SetupCode key={step.code} code={step.code} title={step.title} /> : null}
                    </li>
                ))}
            </ol>
            <p className="gc-muted">Verification runs in your backend terminal. Application identity and user sign-in are separate setups.</p>
            <a href="/docs/connecting-your-software" target="_blank" rel="noopener noreferrer">Full connection guide (opens in a new tab)</a>
        </section>
    );
}
