import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "../console/components/ui/Dialog";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { Alert, Button, PasswordField } from "../ds/components";
import { SecondFactorField, secondFactorReady } from "./SecondFactorField";

/**
 * "Confirm it's you": the step-up Gait asks for before a password change or a
 * two-step change. Asks for a code as well when Gait needs two-step strength
 * or the account has two-step on (Gait's /reauthenticate/ then always wants
 * one); a recovery code works there too, for someone who lost their phone.
 * Driven by useStepUpRetry().dialog.
 */
export function ConfirmItsYouDialog({ state, confirm, cancel }) {
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState("code");
    const [otp, setOtp] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const passwordRef = useRef(null);
    const { user } = useBasicAuthServices();
    const needsCode = state.requiredStrength === "mfa" || Boolean(user?.is_2fa_enabled);
    const busy = state.status === "submitting";
    const ready = Boolean(password) && (!needsCode || secondFactorReady(mode, otp, recoveryCode));

    useEffect(() => {
        if (!state.isOpen) {
            setPassword("");
            setOtp("");
            setRecoveryCode("");
            setMode("code");
        }
    }, [state.isOpen]);

    if (!state.isOpen) return null;

    const onSubmit = async (event) => {
        event.preventDefault();
        if (!ready) return;
        const result = await confirm({
            currentPassword: password,
            otp: mode === "code" ? otp : undefined,
            recoveryCode: mode === "recovery" ? recoveryCode : undefined,
        });
        if (!result.ok) {
            setOtp("");
            setRecoveryCode("");
        }
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
                {needsCode ? (
                    <SecondFactorField
                        mode={mode}
                        onModeChange={setMode}
                        code={otp}
                        onCodeChange={setOtp}
                        recoveryCode={recoveryCode}
                        onRecoveryCodeChange={setRecoveryCode}
                    />
                ) : null}
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || !ready}>
                        {busy ? "Checking…" : "Confirm"}
                    </Button>
                    <Button kind="secondary" onClick={cancel} disabled={busy}>Cancel</Button>
                </div>
            </form>
        </Dialog>
    );
}

export default ConfirmItsYouDialog;
