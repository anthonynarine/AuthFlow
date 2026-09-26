import React, { useId } from "react";

/**
 * A labelled form field. The label names the control and nothing else; the
 * hint and error are linked with aria-describedby, so a screen reader
 * announces "Name" plus its hint/error, not one run-together label.
 * `children` is a single input/select element.
 */
export function Field({ label, hint, error, children }) {
    const id = useId();
    const hintId = useId();
    const errorId = useId();
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
    return (
        <div className="gc-field">
            <label htmlFor={id} className="gc-field-label">{label}</label>
            {React.cloneElement(children, {
                id,
                "aria-describedby": describedBy,
                "aria-invalid": error ? true : undefined,
            })}
            {hint ? <span id={hintId} className="gc-field-hint">{hint}</span> : null}
            {error ? <span id={errorId} className="gc-field-error">{error}</span> : null}
        </div>
    );
}

export default Field;
