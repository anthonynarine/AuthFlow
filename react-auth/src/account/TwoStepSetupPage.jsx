import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { authAxios } from "../interceptors/axios";
import { Alert, Button, CodeField, PasswordField, StatusLine, StepIndicator } from "../ds/components";
import { AccountLayout } from "./AccountLayout";
import { ConfirmItsYouDialog } from "./ConfirmItsYouDialog";
import { RecoveryCodes } from "./RecoveryCodes";
import { useStepUpRetry } from "./useStepUpRetry";
import { accountErrorMessage, confirmTwoFactorSetup, fetchTwoFactorQrCode, startTwoFactorSetup } from "./accountApi";

/*
 * Four steps: confirm it's you (starting setup reveals a new secret, so Gait
 * wants a recent sign-in), scan the QR code or type the key, confirm a code,
 * save the recovery codes. The key and the codes live only in this page's
 * state and are gone when the person leaves it.
 */
const recoveryCodesFrom = (data) => (Array.isArray(data?.recovery_codes) ? data.recovery_codes : null);
const setupKeyFrom = (data) => (typeof data?.manual_key === "string" ? data.manual_key : null);

function Heading({ children }) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current?.focus();
    }, []);
    return (
        <h1 className="ds-title" tabIndex={-1} ref={ref}>
            {children}
        </h1>
    );
}

/** /account/two-step: turn on two-step verification, step by step. */
export function TwoStepSetupPage() {
    const { user, setUser } = useBasicAuthServices();
    const navigate = useNavigate();
    const { run, dialog } = useStepUpRetry();
    const [phase, setPhase] = useState("intro"); // intro | confirm | scan | code | codes | done
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [qrUrl, setQrUrl] = useState(null);
    const [setupKey, setSetupKey] = useState(null);
    const [codes, setCodes] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // The QR image is an object URL; free it when it's replaced or we leave.
    useEffect(() => () => {
        if (qrUrl) URL.revokeObjectURL(qrUrl);
    }, [qrUrl]);

    const total = 4;
    const [keyCopied, setKeyCopied] = useState(false);
    // Turning two-step on signs out every other session (H6): say so.
    const [signedOutElsewhere, setSignedOutElsewhere] = useState(0);
    const elsewhere = signedOutElsewhere > 0 ? " You've been signed out on other devices." : "";
    const finish = () =>
        navigate("/account", {
            replace: true,
            state: { notice: `Two-step verification is on. You'll enter a code after your password from now on.${elsewhere}` },
        });

    const onConfirmPassword = async (event) => {
        event.preventDefault();
        if (!password) return;
        setBusy(true);
        setError("");
        try {
            await authAxios.post("/reauthenticate/", { current_password: password });
            const started = await startTwoFactorSetup();
            setSetupKey(setupKeyFrom(started));
            setQrUrl(await fetchTwoFactorQrCode());
            setPassword("");
            setPhase("scan");
        } catch (failure) {
            setError(
                failure?.response?.status === 429
                    ? "Too many attempts. Wait a minute, then try again."
                    : accountErrorMessage(failure, "That password didn't work. Check it and try again.")
            );
        } finally {
            setBusy(false);
        }
    };

    const onVerify = async (event) => {
        event.preventDefault();
        if (otp.length !== 6) return;
        setBusy(true);
        setError("");
        try {
            const result = await run(() => confirmTwoFactorSetup(otp), "turning on two-step verification");
            if (!result.ok) return;
            setUser((current) => ({ ...current, is_2fa_enabled: true, is_2fa_setup_in_progress: false }));
            // The secret did its job: drop the key and the QR image now.
            setSetupKey(null);
            setQrUrl(null);
            setSignedOutElsewhere(Number(result.value?.sessions_revoked) || 0);
            const recovery = recoveryCodesFrom(result.value);
            if (recovery) {
                setCodes(recovery);
                setPhase("codes");
            } else {
                setPhase("done");
            }
        } catch (failure) {
            setOtp("");
            setError(
                failure?.response?.status === 429
                    ? "Too many attempts. Wait a minute, then enter the code showing now."
                    : "That code didn't match. Check the app shows Gait, then enter the one showing now."
            );
        } finally {
            setBusy(false);
        }
    };

    let body;
    if (user?.is_2fa_enabled && phase !== "codes" && phase !== "done") {
        body = (
            <>
                <Heading>Two-step verification is already on</Heading>
                <p className="ds-lede">You can turn it off, or set it up again with a new app, from your Account page.</p>
                <Link className="ds-btn ds-btn--primary" to="/account">Back to Account</Link>
            </>
        );
    } else if (phase === "intro") {
        body = (
            <>
                <StepIndicator step={1} of={total} label="Before you start" />
                <div className="ds-head">
                    <Heading>Protect your account</Heading>
                    <p className="ds-lede">
                        Two-step verification asks for a code from an authenticator app each time you sign in, so a
                        stolen password isn't enough.
                    </p>
                </div>
                <ul className="ds-list">
                    <li>An authenticator app on your phone (1Password, Google Authenticator, Authy…)</li>
                    <li>About two minutes</li>
                </ul>
                <div className="ds-actions">
                    <Button onClick={() => setPhase("confirm")}>Start</Button>
                    <Link className="ds-btn ds-btn--secondary" to="/account">Not now</Link>
                </div>
            </>
        );
    } else if (phase === "confirm") {
        body = (
            <form className="ds-form" onSubmit={onConfirmPassword} noValidate>
                <StepIndicator step={1} of={total} label="Before you start" />
                <div className="ds-head">
                    <Heading>Confirm it's you</Heading>
                    <p className="ds-lede">Enter your password to start setting up two-step verification.</p>
                </div>
                {error ? <Alert kind="danger">{error}</Alert> : null}
                <PasswordField
                    label="Current password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || !password}>{busy ? "Checking…" : "Continue"}</Button>
                    <Link className="ds-btn ds-btn--secondary" to="/account">Cancel</Link>
                </div>
            </form>
        );
    } else if (phase === "scan") {
        body = (
            <>
                <StepIndicator step={2} of={total} label="Scan the code" />
                <div className="ds-head">
                    <Heading>Scan this with your app</Heading>
                    <p className="ds-lede">Add an account in your authenticator app and point it at this code.</p>
                </div>
                {qrUrl ? (
                    <div className="ds-qr">
                        <img src={qrUrl} alt="QR code to add Gait to your authenticator app" />
                    </div>
                ) : (
                    <StatusLine>Loading the code…</StatusLine>
                )}
                {setupKey ? (
                    <>
                        <p className="ds-hint" style={{ textAlign: "center" }}>Can't scan? Enter this key instead:</p>
                        <div className="ds-key" role="group" aria-label="Setup key"><code>{setupKey.match(/.{1,4}/g).join(" ")}</code></div>
                        <div className="ds-row-actions" style={{ justifyContent: "center" }}>
                            <Button
                                kind="secondary"
                                small
                                onClick={() =>
                                    navigator.clipboard?.writeText(setupKey).then(() => setKeyCopied(true), () => setKeyCopied(false))
                                }
                            >
                                {keyCopied ? "Copied" : "Copy key"}
                            </Button>
                        </div>
                        <p className="ds-visually-hidden" role="status" aria-live="polite">{keyCopied ? "Copied the setup key." : ""}</p>
                    </>
                ) : null}
                <div className="ds-actions">
                    <Button onClick={() => { setError(""); setPhase("code"); }}>Next: enter a code</Button>
                </div>
            </>
        );
    } else if (phase === "code") {
        body = (
            <form className="ds-form" onSubmit={onVerify} noValidate>
                <StepIndicator step={3} of={total} label="Confirm a code" />
                <div className="ds-head">
                    <Heading>Enter the code your app shows</Heading>
                    <p className="ds-lede">This proves the app is set up. The code changes every 30 seconds.</p>
                </div>
                <CodeField label="6-digit code from the app" value={otp} onChange={setOtp} error={error || undefined} />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || otp.length !== 6}>{busy ? "Checking…" : "Verify"}</Button>
                    <Button kind="secondary" onClick={() => { setError(""); setPhase("scan"); }} disabled={busy}>Back to the code</Button>
                </div>
            </form>
        );
    } else if (phase === "codes") {
        body = (
            <>
                <StepIndicator step={4} of={4} label="Recovery codes" />
                <div className="ds-head">
                    <Heading>Save your recovery codes</Heading>
                    <p className="ds-lede">
                        If you lose your phone, each of these lets you sign in once. This is the only time Gait shows them.
                    </p>
                </div>
                <RecoveryCodes codes={codes} email={user?.email} onFinish={() => { setCodes(null); finish(); }} />
            </>
        );
    } else {
        body = (
            <>
                <Alert kind="success">
                    <strong>Two-step verification is on.</strong> You'll enter a code after your password from now on.{elsewhere}
                </Alert>
                <div className="ds-head">
                    <Heading>You're protected</Heading>
                    <p className="ds-lede">Keep your authenticator app. Without it you'll need help to sign in.</p>
                </div>
                <div className="ds-actions">
                    <Button onClick={finish}>Back to Account</Button>
                </div>
            </>
        );
    }

    return (
        <AccountLayout narrow>
            <section className="ds-card" aria-live="off">
                {body}
            </section>
            <ConfirmItsYouDialog {...dialog} />
        </AccountLayout>
    );
}

export default TwoStepSetupPage;
