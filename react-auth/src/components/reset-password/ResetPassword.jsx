import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fieldErrors, INVALID_RESET_LINK, resetPassword } from "../../auth/authPagesApi";
import { readTokenFromHash } from "../../account/VerifyEmailPage";
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, PasswordField } from "../../ds/components";

const PASSWORD_HINT = "At least 8 characters, not only numbers, and not a common password.";
const FIELD_MAP = { password: "password", new_password: "password", password_confirm: "confirmPassword" };

/**
 * Gait answers a weak password with Django's list, stringified:
 * "['This password is too short.', ...]". Show the sentences, not the brackets.
 */
function passwordRules(message) {
    const found = message.match(/'([^']+)'|"([^"]+)"/g);
    return found ? found.map((item) => item.slice(1, -1)).join(" ") : message;
}

/**
 * Choose a new password (DS-AUTH). No toast and no timed redirect: success
 * and a dead link each get their own state.
 *
 * Current emails link to /reset-password#token=…: the token is read once and
 * the fragment is removed from the address bar straight away, so it isn't
 * left in history or on screen. It only ever leaves in the POST body. Another
 * link opened in this same tab only changes the fragment (no reload), so the
 * page starts over with that link, as /verify-email does. Older emails
 * (/reset-password/:uidb64/:token) still work until they expire.
 */
export const ResetPassword = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState(() => params.token || readTokenFromHash(location.hash) || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState(() => (token ? "form" : "invalid")); // form | done | invalid

    useEffect(() => {
        if (!location.hash) return;
        const next = readTokenFromHash(location.hash);
        navigate({ pathname: location.pathname, search: location.search }, { replace: true });
        if (next && next !== token) {
            setToken(next);
            setPassword("");
            setConfirmPassword("");
            setErrors({});
            setPhase("form");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.hash]);

    const onSubmit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!password) local.password = "Choose a new password.";
        else if (password !== confirmPassword) local.confirmPassword = "These don't match. Type the same password twice.";
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            await resetPassword({ token, password, confirmPassword });
            setPhase("done");
        } catch (failure) {
            const status = failure?.response?.status;
            const message = failure?.response?.data?.error;
            const mapped = fieldErrors(failure, FIELD_MAP, "");
            if (status === 404 || message === INVALID_RESET_LINK) {
                setPhase("invalid"); // used, expired or replaced: Gait doesn't say which
            } else if (mapped.password || mapped.confirmPassword) {
                setErrors(mapped);
            } else if (status === 400 && typeof message === "string" && /match/i.test(message)) {
                setErrors({ confirmPassword: "These don't match. Type the same password twice." });
            } else if (status === 400 && typeof message === "string") {
                setErrors({ password: passwordRules(message) }); // Gait's password rules
            } else if (status === 429) {
                setErrors({ general: "Too many attempts. Wait a few minutes, then try again." });
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
