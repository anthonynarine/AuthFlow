import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { Dialog } from "../console/components/ui/Dialog";
import { Alert, Badge, Button, CodeField, PasswordField } from "../ds/components";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { AccountLayout } from "./AccountLayout";
import { ConfirmItsYouDialog } from "./ConfirmItsYouDialog";
import { useStepUpRetry } from "./useStepUpRetry";
import { accountErrorMessage, changePassword, disableTwoFactor, signOutEverywhere } from "./accountApi";
import { authAxios } from "../interceptors/axios";

const PASSWORD_HINT = "At least 8 characters, not only numbers, and not a common password.";

function Panel({ title, text, status, children }) {
    return (
        <section className="ds-panel" aria-label={title}>
            <div className="ds-panel-head">
                <div>
                    <h2 className="ds-panel-title">{title}</h2>
                    {text ? <p className="ds-panel-text">{text}</p> : null}
                </div>
                {status}
            </div>
            {children}
        </section>
    );
}

/** Gait's field errors for a password change: {error: {field: "..." | [...]}} or a plain message. */
function passwordErrors(error) {
    const payload = error?.response?.data?.error;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const pick = (key) => [payload[key]].flat().filter(Boolean).join(" ") || null;
        const fields = {
            currentPassword: pick("current_password"),
            newPassword: pick("new_password"),
            newPasswordConfirm: pick("new_password_confirm"),
        };
        const known = new Set(["current_password", "new_password", "new_password_confirm"]);
        const rest = Object.entries(payload).filter(([key]) => !known.has(key)).flatMap(([, value]) => value);
        return { ...fields, general: rest.length ? rest.join(" ") : null };
    }
    return { general: accountErrorMessage(error, "Your password wasn't changed. Try again.") };
}

function ChangePassword({ run, onChanged }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const firstRef = useRef(null);

    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const onSubmit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.currentPassword) local.currentPassword = "Enter your current password.";
        if (!form.newPassword) local.newPassword = "Choose a new password.";
        else if (form.newPassword !== form.newPasswordConfirm) local.newPasswordConfirm = "These don't match. Type the same password twice.";
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            const result = await run(() => changePassword(form), "changing your password");
            if (result.ok) {
                setOpen(false);
                setForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
                onChanged(result.value?.sessions_revoked);
            }
        } catch (error) {
            setErrors(passwordErrors(error));
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <div className="ds-row-actions">
                <Button kind="secondary" small onClick={() => setOpen(true)}>Change password</Button>
            </div>
        );
    }

    return (
        <form className="ds-form" onSubmit={onSubmit} noValidate>
            {errors.general ? <Alert kind="danger">{errors.general}</Alert> : null}
            <PasswordField
                label="Current password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={set("currentPassword")}
                error={errors.currentPassword}
                inputRef={firstRef}
            />
            <PasswordField
                label="New password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={set("newPassword")}
                error={errors.newPassword}
                hint={PASSWORD_HINT}
            />
            <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={form.newPasswordConfirm}
                onChange={set("newPasswordConfirm")}
                error={errors.newPasswordConfirm}
            />
            <div className="ds-row-actions">
                <Button type="submit" small disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
                <Button kind="secondary" small onClick={() => { setOpen(false); setErrors({}); }} disabled={busy}>Cancel</Button>
            </div>
        </form>
    );
}

/**
 * Turning two-step off needs a recent sign-in *with* a code, and the request
 * itself carries the password and a code. One form: confirm it's you with
 * them, then turn it off with the same proof.
 */
function TurnOffDialog({ onClose, onDone }) {
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const passwordRef = useRef(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        if (!password || otp.length !== 6) return;
        setBusy(true);
        setError("");
        try {
            await authAxios.post("/reauthenticate/", { current_password: password, otp });
            const data = await disableTwoFactor({ currentPassword: password, otp });
            onDone(data?.sessions_revoked);
        } catch (failure) {
            setOtp("");
            setError(
                failure?.response?.status === 429
                    ? "Too many attempts. Wait a minute, then try again."
                    : accountErrorMessage(failure, "That password and code didn't work. Check both and try again.")
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            variant="ds"
            title="Turn off two-step verification?"
            description="Your account will only need a password, and your other devices will be signed out."
            onClose={onClose}
            closeOnBackdrop={false}
            initialFocusRef={passwordRef}
        >
            <form className="ds-form" onSubmit={onSubmit} noValidate>
                {error ? <Alert kind="danger">{error}</Alert> : null}
                <PasswordField
                    label="Current password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    inputRef={passwordRef}
                />
                <CodeField value={otp} onChange={setOtp} />
                <div className="ds-actions">
                    <Button type="submit" disabled={busy || !password || otp.length !== 6}>{busy ? "Turning off…" : "Turn off"}</Button>
                    <Button kind="secondary" onClick={onClose} disabled={busy}>Keep it on</Button>
                </div>
            </form>
        </Dialog>
    );
}

function SignOutEverywhereDialog({ onClose, onConfirmed }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const onConfirm = async () => {
        setBusy(true);
        setError("");
        try {
            await signOutEverywhere();
            await onConfirmed();
        } catch (failure) {
            setError(accountErrorMessage(failure, "That didn't work. Try again."));
            setBusy(false);
        }
    };
    return (
        <Dialog
            variant="ds"
            title="Sign out everywhere?"
            description="Every device signed in to Gait, including this one, is signed out now."
            onClose={onClose}
        >
            {error ? <Alert kind="danger">{error}</Alert> : null}
            <div className="ds-actions">
                <Button onClick={onConfirm} disabled={busy}>{busy ? "Signing out…" : "Sign out everywhere"}</Button>
                <Button kind="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            </div>
        </Dialog>
    );
}

function devicesNote(count) {
    if (!count) return "";
    return count === 1 ? " 1 other device was signed out." : ` ${count} other devices were signed out.`;
}

/** /account: the person's own sign-in: email, password, two-step verification, sessions. */
export function AccountPage() {
    const { user, setUser, logout } = useBasicAuthServices();
    const { validateSession } = useUserSessionServices();
    const location = useLocation();
    const navigate = useNavigate();
    const { run, dialog } = useStepUpRetry();
    const [notice, setNotice] = useState(() => location.state?.notice || "");
    const [modal, setModal] = useState(null); // "turn-off" | "sign-out-all"

    // A notice passed from the setup flow shows once, then leaves history.
    useEffect(() => {
        if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AccountLayout>
            <div className="ds-head">
                <h1 className="ds-title">Account</h1>
                <p className="ds-lede">Your own sign-in. It's the same in every workspace you belong to.</p>
            </div>
            <p className="ds-visually-hidden" role="status" aria-live="polite">{notice}</p>
            {notice ? <Alert kind="success">{notice}</Alert> : null}
            {user && user.is_2fa_enabled === false ? (
                <Alert kind="warning">
                    <strong>Two-step verification is off.</strong> Turn it on so a stolen password isn't enough to get
                    into your account.
                </Alert>
            ) : null}

            {user ? (
                <>
                    <Panel
                        title="Email"
                        text={<strong>{user.email}</strong>}
                        status={user.email_verified === false ? <Badge kind="warning">Not confirmed</Badge> : <Badge kind="success">Confirmed</Badge>}
                    >
                        {user.email_verified === false ? (
                            <>
                                <p className="ds-panel-text">Confirm it to create or join workspaces.</p>
                                <ResendVerificationButton className="ds-btn ds-btn--secondary ds-btn--small" />
                            </>
                        ) : null}
                    </Panel>

                    <Panel
                        title="Two-step verification"
                        text={
                            user.is_2fa_enabled
                                ? "You enter a code from your authenticator app after your password."
                                : user.is_2fa_setup_in_progress
                                    ? "Setup was started but not finished."
                                    : "Ask for a code from an authenticator app after your password, so a stolen password isn't enough."
                        }
                        status={user.is_2fa_enabled ? <Badge kind="success">On</Badge> : <Badge kind="warning">Off</Badge>}
                    >
                        <div className="ds-row-actions">
                            {user.is_2fa_enabled ? (
                                <Button kind="secondary" small onClick={() => setModal("turn-off")}>Turn off</Button>
                            ) : (
                                <Link className="ds-btn ds-btn--primary ds-btn--small" to="/account/two-step">
                                    {user.is_2fa_setup_in_progress ? "Continue setup" : "Turn on two-step verification"}
                                </Link>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Password" text="Changing it signs out your other devices.">
                        <ChangePassword
                            run={run}
                            onChanged={(revoked) => setNotice(`Password changed.${devicesNote(revoked)}`)}
                        />
                    </Panel>

                    <Panel
                        title="Signed-in devices"
                        text="Sign out of Gait on every device, including this one. You'll need your password (and code) to sign back in."
                    >
                        <div className="ds-row-actions">
                            <Button kind="secondary" small onClick={() => setModal("sign-out-all")}>Sign out everywhere</Button>
                        </div>
                    </Panel>
                </>
            ) : null}

            {modal === "turn-off" ? (
                <TurnOffDialog
                    onClose={() => setModal(null)}
                    onDone={(revoked) => {
                        setModal(null);
                        setUser((current) => ({ ...current, is_2fa_enabled: false, is_2fa_setup_in_progress: false }));
                        setNotice(`Two-step verification is off.${devicesNote(revoked)}`);
                        Promise.resolve(validateSession()).catch(() => {});
                    }}
                />
            ) : null}
            {modal === "sign-out-all" ? (
                <SignOutEverywhereDialog
                    onClose={() => setModal(null)}
                    onConfirmed={async () => {
                        await logout();
                        navigate("/login", { replace: true });
                    }}
                />
            ) : null}
            <ConfirmItsYouDialog {...dialog} />
        </AccountLayout>
    );
}

export default AccountPage;
