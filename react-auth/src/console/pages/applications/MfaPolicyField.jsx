import React, { useId } from "react";

export function isMfaPolicy(value) {
    return value === "optional" || value === "required";
}

export const MFA_DOWNGRADE_ACKNOWLEDGMENT = "Changing Required to Optional allows users without MFA to sign in with a password. Users who enabled MFA must still complete it.";

export function MfaPolicyField({ value, onChange, disabled }) {
    const id = useId();
    if (!isMfaPolicy(value)) return <p>MFA policy is unavailable on this deployment. No policy change will be submitted.</p>;
    return <>
        <label htmlFor={id}>Multi-factor authentication (MFA)</label>
        <select id={id} className="gc-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-describedby={`${id}-description`}>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
        </select>
        <p id={`${id}-description`}>{value === "optional"
            ? "Users can sign in with a password without setting up MFA. Anyone who enables two-step verification on their account must still complete it."
            : "Users must set up MFA and complete it to sign in to this application."}</p>
    </>;
}
