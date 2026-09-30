import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { Dialog } from "../console/components/ui/Dialog";
import { Alert, Badge, Button, PasswordField, StatusLine } from "../ds/components";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { AccountLayout } from "./AccountLayout";
import { ConfirmItsYouDialog } from "./ConfirmItsYouDialog";
import { RecoveryCodes } from "./RecoveryCodes";
import { ProofDialog } from "./ProofDialog";
import { useStepUpRetry } from "./useStepUpRetry";
import {
    accountErrorMessage,
    changePassword,
    disableTwoFactor,
    fetchRecoveryCodeStatus,
    recoveryCodesKey,
    regenerateRecoveryCodes,
    signOutEverywhere,
} from "./accountApi";

const PASSWORD_HINT = "At least 12 characters, not only numbers, and not a common password.";

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
 * Turning two-step off asks for proof in the same step, every time (H6): the
 * password and a code, or a recovery code if the phone is gone. Nothing is
 * re-authenticated first; the proof goes in the turn-off request itself.
 */
function TurnOffDialog({ onClose, onDone }) {
    return (
        <ProofDialog
            title="Turn off two-step verification?"
            description="Your account will only need a password, and your other devices will be signed out. Confirm with your password and a code from your authenticator app."
            confirmLabel="Turn off"
            busyLabel="Turning off…"
            onSubmit={async (proof) => onDone(await disableTwoFactor(proof))}
            onClose={onClose}
        />
    );
}

function formatDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : null;
}

/**
 * How many recovery codes are left (Gait only ever sends the count), amber at
 * three or fewer, and "Make new codes": ten new ones, shown once, every older
 * code dead. The new codes live only in this component until Finish.
 */
function RecoveryCodesPanel({ email }) {
    const queryClient = useQueryClient();
    const status = useQuery({ queryKey: recoveryCodesKey, queryFn: fetchRecoveryCodeStatus });
    const [codes, setCodes] = useState(null);
    const [asking, setAsking] = useState(false);

    const onFinish = () => {
        setCodes(null);
        queryClient.invalidateQueries({ queryKey: recoveryCodesKey });
    };

    if (codes) {
        return (
            <Panel title="Recovery codes" text="Save these now. This is the only time Gait shows them.">
                <Alert kind="success"><strong>New codes made.</strong> Your old recovery codes no longer work.</Alert>
                <RecoveryCodes codes={codes} email={email} onFinish={onFinish} />
            </Panel>
        );
    }

    const remaining = status.data?.recovery_codes_remaining;
    const neverMade = remaining === 0 && !status.data?.generated_at;
    const low = typeof remaining === "number" && remaining <= 3;
    const made = formatDate(status.data?.generated_at);

    let text = "If you lose your phone, each recovery code lets you sign in once.";
    if (typeof remaining === "number") {
        if (neverMade) text = "Your account doesn't have recovery codes yet. Make them so a lost phone doesn't lock you out.";
        else if (remaining === 0) text = "You've used every recovery code. Make new ones so a lost phone doesn't lock you out.";
        else text = `You have ${remaining} recovery ${remaining === 1 ? "code" : "codes"} left${made ? `, made ${made}` : ""}. Each one lets you sign in once if you lose your phone.`;
    }

    return (
        <Panel
            title="Recovery codes"
            text={text}
            status={low && !neverMade ? <Badge kind="warning">{remaining} left</Badge> : null}
        >
            {status.isLoading ? <StatusLine>Checking your recovery codes…</StatusLine> : null}
            {status.isError ? (
                <Alert kind="danger">We couldn't check your recovery codes. Reload the page to try again.</Alert>
            ) : null}
            {low && !neverMade && remaining > 0 ? (
                <Alert kind="warning">
                    <strong>Running low.</strong> Make new codes before you run out. Making new ones replaces every old code.
                </Alert>
            ) : null}
            <div className="ds-row-actions">
                <Button kind={low ? "primary" : "secondary"} small onClick={() => setAsking(true)} disabled={status.isLoading}>
                    {neverMade ? "Make recovery codes" : "Make new codes"}
                </Button>
            </div>
            {asking ? (
                // Proof in the same request, every time (H6), like turning two-step off.
                <ProofDialog
                    title={neverMade ? "Make recovery codes" : "Make new recovery codes?"}
                    description={
                        neverMade
                            ? "Confirm with your password and a code from your authenticator app."
                            : "Your current recovery codes stop working. Confirm with your password and a code from your authenticator app."
                    }
                    confirmLabel={neverMade ? "Make codes" : "Make new codes"}
                    busyLabel="Making codes…"
                    onSubmit={async (proof) => {
                        const made = await regenerateRecoveryCodes(proof);
                        setAsking(false);
                        setCodes(made);
                    }}
                    onClose={() => setAsking(false)}
                />
            ) : null}
        </Panel>
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
    const queryClient = useQueryClient();
    const { run, dialog } = useStepUpRetry();
    const [notice, setNotice] = useState(() => location.state?.notice || "");
    const [modal, setModal] = useState(null); // "turn-off" | "sign-out-all"

    const turnedOff = (data) => {
        setModal(null);
        setUser((current) => ({ ...current, is_2fa_enabled: false, is_2fa_setup_in_progress: false }));
        queryClient.removeQueries({ queryKey: recoveryCodesKey });
        setNotice(`Two-step verification is off.${devicesNote(data?.sessions_revoked)}`);
        Promise.resolve(validateSession()).catch(() => {});
    };

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

                    {user.is_2fa_enabled ? <RecoveryCodesPanel email={user.email} /> : null}

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
                <TurnOffDialog onClose={() => setModal(null)} onDone={turnedOff} />
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
