import React, { useId, useState } from "react";
import "./ds.css";

/**
 * DS-AUTH building blocks. Each field has a visible label; hint and error are
 * tied to the input with aria-describedby, and an error sets aria-invalid.
 */
export function Field({ label, hint, error, children }) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
    return (
        <div className="ds-field">
            <label className="ds-label" htmlFor={id}>{label}</label>
            {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
            {error ? <p className="ds-error" id={errorId}>{error}</p> : null}
            {hint ? <p className="ds-hint" id={hintId}>{hint}</p> : null}
        </div>
    );
}

export function TextField({ label, hint, error, inputRef, ...inputProps }) {
    return (
        <Field label={label} hint={hint} error={error}>
            {(aria) => <input className="ds-input" ref={inputRef} {...aria} {...inputProps} />}
        </Field>
    );
}

/** Password with a Show/Hide button after it in tab order. */
export function PasswordField({ label, hint, error, inputRef, ...inputProps }) {
    const [shown, setShown] = useState(false);
    return (
        <Field label={label} hint={hint} error={error}>
            {(aria) => (
                <div className="ds-input-wrap">
                    <input
                        className="ds-input ds-input--with-reveal"
                        type={shown ? "text" : "password"}
                        ref={inputRef}
                        {...aria}
                        {...inputProps}
                    />
                    <button
                        type="button"
                        className="ds-reveal"
                        aria-pressed={shown}
                        aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                        onClick={() => setShown((value) => !value)}
                    >
                        {shown ? "Hide" : "Show"}
                    </button>
                </div>
            )}
        </Field>
    );
}

/** One input for a 6-digit code: numeric keypad, one-time-code autofill, paste works. */
export function CodeField({ label = "6-digit code", hint, error, value, onChange, inputRef, ...rest }) {
    return (
        <Field label={label} hint={hint} error={error}>
            {(aria) => (
                <input
                    className="ds-input ds-code"
                    ref={inputRef}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={value}
                    onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    {...aria}
                    {...rest}
                />
            )}
        </Field>
    );
}

/**
 * A single-use recovery code (xxxxx-xxxxx). Gait ignores case, spaces and
 * hyphens, so the field takes it however it was written down.
 */
export function RecoveryCodeField({ label = "Recovery code", hint, error, value, onChange, inputRef, ...rest }) {
    return (
        <Field label={label} hint={hint} error={error}>
            {(aria) => (
                <input
                    className="ds-input ds-code"
                    ref={inputRef}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={24}
                    placeholder="xxxxx-xxxxx"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    {...aria}
                    {...rest}
                />
            )}
        </Field>
    );
}

/** True once a recovery code has its 10 letters and digits (separators don't count). */
export const isCompleteRecoveryCode = (value) => value.replace(/[\s-]/g, "").length === 10;

const MARKS = { danger: "!", success: "✓", warning: "…", info: "i" };

/**
 * Text plus a mark, never color alone. Errors are alerts; the rest are plain
 * notes unless `announce` (e.g. a warning that answers a form submit).
 */
export function Alert({ kind = "info", announce = false, children }) {
    return (
        <div className={`ds-alert${kind === "info" ? "" : ` ds-alert--${kind}`}`} role={kind === "danger" || announce ? "alert" : undefined}>
            <span className="ds-alert-mark" aria-hidden="true">{MARKS[kind]}</span>
            <p>{children}</p>
        </div>
    );
}

export function Badge({ kind, children }) {
    return <span className={`ds-badge${kind ? ` ds-badge--${kind}` : ""}`}>{children}</span>;
}

/** "Step 2 of 4 · Scan the code". The words carry the meaning; the bar is decorative. */
export function StepIndicator({ step, of, label }) {
    return (
        <div className="ds-steps">
            <p className="ds-eyebrow">Step {step} of {of} · {label}</p>
            <div className="ds-steps-bar" aria-hidden="true">
                {Array.from({ length: of }, (_, index) => (
                    <span key={index} className={index < step ? "is-done" : ""} />
                ))}
            </div>
        </div>
    );
}

export function StatusLine({ children }) {
    return (
        <div className="ds-status">
            <span className="ds-spinner" aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
}

export function Button({ kind = "primary", small, className = "", ...props }) {
    return (
        <button
            type="button"
            className={`ds-btn ds-btn--${kind}${small ? " ds-btn--small" : ""}${className ? ` ${className}` : ""}`}
            {...props}
        />
    );
}
