import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { INVITE_ACCEPT_PATH, safeReturnTo } from "../../auth/returnTo";
import { getPendingInvite } from "../../console/invites/pendingInvite";
import { fieldErrors, registerAccount } from "../../auth/authPagesApi";
import { AuthHeading, AuthLayout } from "../../ds/AuthLayout";
import { Alert, Button, PasswordField, TextField } from "../../ds/components";

const PASSWORD_HINT = "At least 12 characters, not only numbers, and not a common password.";
const FIELD_MAP = {
    first_name: "firstName",
    last_name: "lastName",
    email: "email",
    password: "password",
    password_confirm: "confirmPassword",
};

/**
 * Create an account (DS-AUTH). Errors sit under their fields. A created
 * account stays on screen with the server's delivery result and a way to
 * continue to sign-in; an unknown result never implies mail was delivered.
 */
export const RegisterPage = () => {
    // Arriving from an invite: prefill the invited address (from memory,
    // never the URL) and go back to the invite after signing in.
    const location = useLocation();
    const returnTo = safeReturnTo(location.state?.returnTo);
    const invite = returnTo === INVITE_ACCEPT_PATH ? getPendingInvite()?.preview : null;
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: invite?.invited_email || "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const onSubmit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.firstName.trim()) local.firstName = "Enter your first name.";
        if (!form.lastName.trim()) local.lastName = "Enter your last name.";
        if (!form.email.trim()) local.email = "Enter your email address.";
        if (!form.password) local.password = "Choose a password.";
        else if (form.password !== form.confirmPassword) local.confirmPassword = "These don't match. Type the same password twice.";
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            const result = await registerAccount({ ...form, email: form.email.trim() });
            setDone({ email: form.email.trim(), verificationSent: result?.verification_sent });
            setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
        } catch (error) {
            setErrors(fieldErrors(error, FIELD_MAP, "We couldn't confirm whether your account was created. Try signing in or resetting your password before submitting again."));
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <AuthLayout>
                <AuthHeading
                    eyebrow="Account created"
                    title={done.verificationSent === true ? "Check your email" : "Confirm your email address"}
                    lede={
                        done.verificationSent === true ? <>
                            We sent a confirmation link to <strong>{done.email}</strong>. Open it to confirm your address; it
                            works in any tab and lasts 48 hours.
                        </> : done.verificationSent === false ? <>
                            Your account was created for <strong>{done.email}</strong>, but we couldn't send the confirmation
                            email. Sign in and request a new link.
                        </> : <>
                            Your account was created for <strong>{done.email}</strong>. Sign in to check your verification
                            status and request a confirmation email.
                        </>
                    }
                    focusOnMount
                />
                <Link className="ds-btn ds-btn--primary" to="/login" state={returnTo ? { returnTo } : undefined}>
                    Sign in
                </Link>
                <p className="ds-foot">Confirm your address before setting up a workspace. You can turn on optional two-step verification in account settings.</p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <AuthHeading eyebrow="Gait account" title="Create your account" lede="Your account is your own sign-in. Workspaces come next." />
            {invite ? (
                <Alert>
                    You were invited to <strong>{invite.organization_name}</strong>. Use <strong>{invite.invited_email}</strong> so
                    the invite finds you.
                </Alert>
            ) : null}
            {errors.general ? <Alert kind="danger">{errors.general}</Alert> : null}
            <form className="ds-form" onSubmit={onSubmit} noValidate>
                <div className="ds-row">
                    <TextField label="First name" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
                    <TextField label="Last name" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} error={errors.lastName} />
                </div>
                <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
                <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} hint={PASSWORD_HINT} />
                <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy}>{busy ? "Creating your account…" : "Create account"}</Button>
                </div>
            </form>
            <p className="ds-foot">
                Already have an account?{" "}
                <Link className="ds-link" to="/login" state={returnTo ? { returnTo } : undefined}>Sign in</Link>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;
