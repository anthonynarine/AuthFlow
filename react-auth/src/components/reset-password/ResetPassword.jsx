import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fieldErrors, resetPassword } from "../../auth/authPagesApi";
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, PasswordField } from "../../ds/components";

const PASSWORD_HINT = "At least 8 characters, not only numbers, and not a common password.";
const FIELD_MAP = { password: "password", new_password: "password", password_confirm: "confirmPassword" };

/**
 * Choose a new password (DS-AUTH). No toast and no timed redirect: success
 * and a dead link each get their own state. The link's uid/token still come
 * from the URL path; the backend's AUTH-B moves them to the #fragment.
 */
export const ResetPassword = () => {
    const { uidb64, token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState("form"); // form | done | invalid

    const onSubmit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!password) local.password = "Choose a new password.";
        else if (password !== confirmPassword) local.confirmPassword = "These don't match. Type the same password twice.";
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            await resetPassword({ uidb64, token, password, confirmPassword });
            setPhase("done");
        } catch (failure) {
            const mapped = fieldErrors(failure, FIELD_MAP, "");
            if (mapped.password || mapped.confirmPassword) {
                setErrors(mapped);
            } else if (failure?.response && failure.response.status < 500) {
                setPhase("invalid"); // used, expired or replaced: Gait doesn't say which
            } else {
                setErrors({ general: mapped.general || "Your password wasn't changed. Try again in a minute." });
            }
        } finally {
            setBusy(false);
        }
    };

    if (phase === "done") {
        return (
            <AuthLayout>
                <Alert kind="success"><strong>Password changed.</strong> Use it the next time you sign in.</Alert>
                <AuthHeading title="Sign in with your new password" focusOnMount />
                <Link className="ds-btn ds-btn--primary" to="/login">Sign in</Link>
            </AuthLayout>
        );
    }

    if (phase === "invalid") {
        return (
            <AuthLayout>
                <AuthHeading
                    eyebrow="Gait account"
                    title="This reset link can't be used"
                    lede="It may have expired, been used already, or been replaced by a newer one."
                    focusOnMount
                />
                <Link className="ds-btn ds-btn--primary" to="/forgot-password">Send a new link</Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <AuthHeading eyebrow="Gait account" title="Choose a new password" />
            {errors.general ? <Alert kind="danger">{errors.general}</Alert> : null}
            <form className="ds-form" onSubmit={onSubmit} noValidate>
                <PasswordField
                    label="New password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password}
                    hint={PASSWORD_HINT}
                />
                <PasswordField
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={errors.confirmPassword}
                />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;
