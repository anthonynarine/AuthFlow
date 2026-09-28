import React, { useRef, useState } from "react";
import { Dialog } from "../console/components/ui/Dialog";
import { Alert, Button, PasswordField } from "../ds/components";
import { SecondFactorField, secondFactorReady } from "./SecondFactorField";
import { accountErrorMessage } from "./accountApi";

const text = (value) => [value].flat().filter(Boolean).join(" ");

/**
 * Gait's answer to a proof, split by field: {error: {current_password | otp |
 * recovery_code: "..." | [...]}} lands on that field; anything else (a
 * throttle, a PROOF_REQUIRED 403, a network error) is one general message.
 */
export function proofErrors(error) {
    const status = error?.response?.status;
    if (status === 429) return { general: "Too many attempts. Wait a minute, then try again." };
    const payload = error?.response?.data?.error;
    if (status === 400 && payload && typeof payload === "object" && !Array.isArray(payload)) {
        const result = {
            password: text(payload.current_password) || null,
            factor: text(payload.otp) || text(payload.recovery_code) || null,
        };
        const rest = Object.entries(payload)
            .filter(([key]) => !["current_password", "otp", "recovery_code"].includes(key))
            .map(([, value]) => text(value))
            .filter(Boolean);
        if (rest.length) result.general = rest.join(" ");
        if (result.password || result.factor || result.general) return result;
    }
    return { general: error?.response?.data?.message || accountErrorMessage(error, "That didn't work. Try again.") };
}

/**
 * Turning two-step off and making new recovery codes need proof in the
 * request itself, every time (H6): the password and a code from the app, or a
 * recovery code if the phone is gone. A recent sign-in never counts, and
 * nothing is re-authenticated first (a code can't be used twice). `onSubmit`
 * gets {current_password, otp} or {current_password, recovery_code}.
 */
export function ProofDialog({ title, description, confirmLabel, busyLabel, onSubmit, onClose }) {
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState("code");
    const [otp, setOtp] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const passwordRef = useRef(null);
    const ready = Boolean(password) && secondFactorReady(mode, otp, recoveryCode);

    const submit = async (event) => {
        event.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        setErrors({});
        const proof = { current_password: password };
        if (mode === "recovery") proof.recovery_code = recoveryCode.trim();
        else proof.otp = otp;
        try {
            await onSubmit(proof);
        } catch (failure) {
            const found = proofErrors(failure);
            setErrors(found);
            setOtp("");
            setRecoveryCode("");
            if (found.password) setPassword("");
            setBusy(false);
        }
    };

    return (
        <Dialog variant="ds" title={title} description={description} onClose={onClose} closeOnBackdrop={false} initialFocusRef={passwordRef}>
            <form className="ds-form" onSubmit={submit} noValidate>
                {errors.general ? <Alert kind="danger">{errors.general}</Alert> : null}
                <PasswordField
                    label="Current password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password || undefined}
                    inputRef={passwordRef}
                />
                <SecondFactorField
                    mode={mode}
                    onModeChange={setMode}
                    code={otp}
                    onCodeChange={setOtp}
                    recoveryCode={recoveryCode}
                    onRecoveryCodeChange={setRecoveryCode}
                    error={errors.factor || undefined}
                />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || !ready}>{busy ? busyLabel : confirmLabel}</Button>
                    <Button kind="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
                </div>
            </form>
        </Dialog>
    );
}

export default ProofDialog;
