import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../auth/authPagesApi";
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, TextField } from "../../ds/components";

/**
 * Forgot password (DS-AUTH). The answer stays on screen (no toast) and reads
 * the same whether or not the address has an account.
 */
export const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [sentTo, setSentTo] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        if (!email.trim()) {
            setError("Enter the email address for your account.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await requestPasswordReset(email.trim());
            setSentTo(email.trim());
        } catch (failure) {
            setError(
                failure?.response?.status === 429
                    ? "Too many requests. Wait a few minutes, then try again."
                    : "We couldn't send that just now. Check your connection and try again in a minute."
            );
        } finally {
            setBusy(false);
        }
    };

    if (sentTo) {
        return (
            <AuthLayout>
                <AuthHeading
                    eyebrow="Gait account"
                    title="Check your email"
                    lede={<>If <strong>{sentTo}</strong> has a Gait account, a reset link is on its way. It works once.</>}
                    focusOnMount
                />
                <Link className="ds-btn ds-btn--secondary" to="/login">Back to sign in</Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <AuthHeading
                eyebrow="Gait account"
                title="Reset your password"
                lede="Enter your account's email. If it matches an account, we'll send a link to choose a new password."
            />
            {error ? <Alert kind="danger">{error}</Alert> : null}
            <form className="ds-form" onSubmit={onSubmit} noValidate>
                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
                    <Link className="ds-link ds-link--quiet" to="/login">Back to sign in</Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ForgotPassword;
