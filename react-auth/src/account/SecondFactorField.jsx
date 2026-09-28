import React from "react";
import { CodeField, RecoveryCodeField, isCompleteRecoveryCode } from "../ds/components";

/**
 * The second factor: a code from the authenticator app, or (lost phone) one
 * of the account's single-use recovery codes. `mode` is "code" | "recovery";
 * the switch below the field flips it and clears what was typed.
 */
export function SecondFactorField({ mode, onModeChange, code, onCodeChange, recoveryCode, onRecoveryCodeChange, error, codeLabel, inputRef }) {
    const switchTo = (next) => {
        onCodeChange("");
        onRecoveryCodeChange("");
        onModeChange(next);
    };
    return (
        <>
            {mode === "recovery" ? (
                <RecoveryCodeField
                    value={recoveryCode}
                    onChange={onRecoveryCodeChange}
                    error={error}
                    hint="One of the codes you saved when you turned on two-step verification. Each works once."
                    inputRef={inputRef}
                />
            ) : (
                <CodeField label={codeLabel} value={code} onChange={onCodeChange} error={error} inputRef={inputRef} />
            )}
            <button type="button" className="ds-link ds-link--quiet" style={{ alignSelf: "flex-start" }} onClick={() => switchTo(mode === "recovery" ? "code" : "recovery")}>
                {mode === "recovery" ? "Use your authenticator app instead" : "Lost your phone? Use a recovery code"}
            </button>
        </>
    );
}

/** Ready to send: six digits, or a whole recovery code. */
export const secondFactorReady = (mode, code, recoveryCode) =>
    mode === "recovery" ? isCompleteRecoveryCode(recoveryCode) : code.length === 6;

export default SecondFactorField;
