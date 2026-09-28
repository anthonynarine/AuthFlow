import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useTwoFactorAuth } from "../../hooks/useTwoFactorAuth";
import { INVITE_ACCEPT_PATH, safeReturnTo } from "../../auth/returnTo";
import { getPendingInvite } from "../../console/invites/pendingInvite";
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, PasswordField, TextField } from "../../ds/components";
import { SecondFactorField, secondFactorReady } from "../../account/SecondFactorField";

/**
 * Sign in (DS-AUTH). Step 1: email and password. If the account has two-step
 * verification, step 2 of the same card asks for the code (no modal); focus
 * moves to its heading. A recovery code works there too (lost phone).
 * `returnTo` (allowlisted) survives both steps.
 */
export const LoginPage = () => {
    const location = useLocation();
    // Where to go after signing in (checked against an allowlist later).
    const returnTo = location.state?.returnTo || location.state?.from;
    const safeReturn = safeReturnTo(returnTo);
    const { login, is2FARequired, cancelTwoFactor, error, isLoading } = useBasicAuthServices();
    const { verify2FA, twoFactorError, sessionExpired, isLoading: verifying } = useTwoFactorAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [factor, setFactor] = useState("code"); // code | recovery
    const [recoveryCode, setRecoveryCode] = useState("");

    // Arriving from an invite: say which address and workspace it's for.
    const invite = safeReturn === INVITE_ACCEPT_PATH ? getPendingInvite()?.preview : null;

    const onSignIn = async (event) => {
        event.preventDefault();
        if (!email || !password) return;
        await login({ email, password }, { returnTo });
    };

    const ready = secondFactorReady(factor, code, recoveryCode);

    const onVerify = async (event) => {
        event.preventDefault();
        if (!ready) return;
        const recovery = factor === "recovery";
        await verify2FA(recovery ? recoveryCode : code, { returnTo, recovery });
        setCode("");
        setRecoveryCode("");
    };

    if (is2FARequired) {
        return (
            <AuthLayout>
                <AuthHeading
                    eyebrow="Two-step verification"
                    title="Enter your code"
                    lede={
                        factor === "recovery"
                            ? "Enter one of the recovery codes you saved. It works once, then it's used up."
                            : <>Open your authenticator app and enter the 6-digit code for <strong>Gait</strong>.</>
                    }
                    focusOnMount
                />
                <form className="ds-form" onSubmit={onVerify} noValidate>
                    <SecondFactorField
                        mode={factor}
                        onModeChange={setFactor}
                        code={code}
                        onCodeChange={setCode}
                        recoveryCode={recoveryCode}
                        onRecoveryCodeChange={setRecoveryCode}
                        error={twoFactorError || undefined}
                    />
                    <div className="ds-actions">
                        <Button type="submit" disabled={verifying || !ready}>
                            {verifying ? "Checking…" : "Verify"}
                        </Button>
                        <button type="button" className="ds-link ds-link--quiet" onClick={cancelTwoFactor}>
                            Use a different account
                        </button>
                    </div>
                </form>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <AuthHeading eyebrow="Gait account" title="Sign in" lede="Use the email and password for your Gait account." />
            {invite ? (
                <Alert>
                    Sign in with <strong>{invite.invited_email}</strong> to join the <strong>{invite.organization_name}</strong>{" "}
                    workspace. You'll come straight back to the invite.
                </Alert>
            ) : null}
            {error ? <Alert kind="danger">{error}</Alert> : null}
            {!error && sessionExpired ? <Alert kind="warning">That sign-in timed out. Enter your password again.</Alert> : null}
            <form className="ds-form" onSubmit={onSignIn} noValidate>
                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <PasswordField
                    label="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <div className="ds-field-action">
                    <Link className="ds-link ds-link--quiet" to="/forgot-password">Forgot password?</Link>
                </div>
                <div className="ds-actions">
                    <Button type="submit" disabled={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</Button>
                </div>
            </form>
            <div className="ds-divider">New to Gait?</div>
            <Link
                className="ds-btn ds-btn--secondary"
                to="/register"
                state={safeReturn ? { returnTo: safeReturn } : undefined}
            >
                Create an account
            </Link>
        </AuthLayout>
    );
};

export default LoginPage;
