import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "../console/components/ui/Dialog";
import { Alert, Button, CodeField, PasswordField } from "../ds/components";

/**
 * "Confirm it's you": the step-up Gait asks for before a password change or a
 * two-step change. Asks for a code as well when Gait needs two-step strength.
 * Driven by useStepUpRetry().dialog.
 */
export function ConfirmItsYouDialog({ state, confirm, cancel }) {
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const passwordRef = useRef(null);
    const needsCode = state.requiredStrength === "mfa";
    const busy = state.status === "submitting";

    useEffect(() => {
        if (!state.isOpen) {
            setPassword("");
            setOtp("");
        }
    }, [state.isOpen]);

    if (!state.isOpen) return null;

    const onSubmit = async (event) => {
        event.preventDefault();
        if (!password || (needsCode && otp.length !== 6)) return;
        const result = await confirm({ currentPassword: password, otp });
        if (!result.ok) setOtp("");
    };

    return (
        <Dialog
            variant="ds"
            title="Confirm it's you"
            description={
                needsCode
                    ? `Enter your password and a code from your authenticator app to continue ${state.actionLabel}.`
                    : `Enter your password again to continue ${state.actionLabel}.`
            }
            onClose={cancel}
            closeOnBackdrop={false}
            initialFocusRef={passwordRef}
        >
            <form className="ds-form" onSubmit={onSubmit} noValidate>
                {state.error ? <Alert kind={state.status === "throttled" ? "warning" : "danger"}>{state.error}</Alert> : null}
                <PasswordField
                    label="Current password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    inputRef={passwordRef}
                />
                {needsCode ? <CodeField value={otp} onChange={setOtp} /> : null}
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || !password || (needsCode && otp.length !== 6)}>
                        {busy ? "Checking…" : "Confirm"}
                    </Button>
                    <Button kind="secondary" onClick={cancel} disabled={busy}>Cancel</Button>
                </div>
            </form>
        </Dialog>
    );
}

export default ConfirmItsYouDialog;
