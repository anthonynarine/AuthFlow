import React, { useRef, useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiErrors";
import { formatDateTime } from "../../utils/formatDate";

const NAME_MAX = 160;
const LABEL_MAX = 80;
const RECENT_USE_MS = 24 * 60 * 60 * 1000;

function FormError({ error }) {
    return error ? <p className="gc-form-error" role="alert">{apiErrorMessage(error)}</p> : null;
}

function Buttons({ onCancel, confirmLabel, pendingLabel, pending, danger, disabled, form }) {
    return (
        <>
            <button type="button" className="gc-button gc-button--ghost" onClick={onCancel}>
                Cancel
            </button>
            <button
                type={form ? "submit" : "button"}
                form={form}
                className={`gc-button ${danger ? "gc-button--danger" : "gc-button--primary"}`}
                disabled={pending || disabled}
            >
                {pending ? pendingLabel : confirmLabel}
            </button>
        </>
    );
}

/** Rename: only the display name changes; slug and environment are identity. */
export function RenameDialog({ application, mutation, onClose }) {
    const [name, setName] = useState(application.name);
    const [touched, setTouched] = useState(false);
    const trimmed = name.trim();
    const error = !trimmed ? "Give the application a name." : name.length > NAME_MAX ? `Use ${NAME_MAX} characters or fewer.` : null;
    const fieldError = apiFieldErrors(mutation.error).name;

    const onSubmit = async (event) => {
        event.preventDefault();
        setTouched(true);
        if (error) return;
        try {
            await mutation.mutateAsync(trimmed);
            onClose();
        } catch {
            // shown below
        }
    };

    return (
        <Dialog
            title="Rename application"
            description="The slug and environment stay the same, so your software doesn't need any change."
            onClose={onClose}
            footer={<Buttons form="gc-rename" onCancel={onClose} confirmLabel="Rename" pendingLabel="Renaming…" pending={mutation.isPending} />}
        >
            <form id="gc-rename" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <Field label="Name" error={(touched && error) || fieldError}>
                    <input
                        className="gc-input"
                        value={name}
                        maxLength={NAME_MAX}
                        onChange={(event) => setName(event.target.value)}
                    />
                </Field>
                {mutation.isError && !fieldError ? <FormError error={mutation.error} /> : null}
            </form>
        </Dialog>
    );
}

const STATUS_COPY = {
    suspend: {
        title: "Suspend this application?",
        body: "All of its connection keys stop working immediately, so it can't report to Gait. Nothing is deleted, and you can reactivate it at any time.",
        confirm: "Suspend",
        pending: "Suspending…",
        danger: true,
    },
    reactivate: {
        title: "Reactivate this application?",
        body: "Its active connection keys work again straight away. Keys that were revoked stay revoked.",
        confirm: "Reactivate",
        pending: "Reactivating…",
        danger: false,
    },
};

/** Suspend / reactivate confirmation. */
export function StatusDialog({ action, application, mutation, onClose }) {
    const copy = STATUS_COPY[action];
    const onConfirm = async () => {
        try {
            await mutation.mutateAsync(action);
            onClose();
        } catch {
            // shown below
        }
    };
    return (
        <Dialog
            title={copy.title}
            description={`${application.name} · ${application.slug}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className={`gc-button ${copy.danger ? "gc-button--danger" : "gc-button--primary"}`}
                        onClick={onConfirm}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? copy.pending : copy.confirm}
                    </button>
                </>
            }
        >
            <p className="gc-dialog-text">{copy.body}</p>
            <FormError error={mutation.error} />
        </Dialog>
    );
}

/** Retire (Owners only): permanent, revokes every key. Confirmed by typing the slug. */
export function RetireDialog({ application, mutation, onClose }) {
    const [typed, setTyped] = useState("");
    const matches = typed.trim() === application.slug;
    const onSubmit = async (event) => {
        event.preventDefault();
        if (!matches) return;
        try {
            await mutation.mutateAsync("retire");
            onClose();
        } catch {
            // shown below
        }
    };
    return (
        <Dialog
            title="Retire this application?"
            description={`${application.name} · ${application.environment}`}
            onClose={onClose}
            footer={
                <Buttons
                    form="gc-retire"
                    onCancel={onClose}
                    confirmLabel="Retire permanently"
                    pendingLabel="Retiring…"
                    pending={mutation.isPending}
                    danger
                    disabled={!matches}
                />
            }
        >
            <form id="gc-retire" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <p className="gc-warning">
                    <strong>This can't be undone.</strong> The application stops working and every one of its connection
                    keys is revoked. Its history stays visible.
                </p>
                <Field label={<>Type <code className="gc-code">{application.slug}</code> to confirm</>}>
                    <input
                        className="gc-input"
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                    />
                </Field>
                <FormError error={mutation.error} />
            </form>
        </Dialog>
    );
}

/**
 * Issue a key, then show it exactly once. The raw secret lives only in this
 * component's state: never in the query cache, storage, the URL or logs, and
 * it's dropped when the dialog closes.
 */
export function IssueKeyDialog({ application, issue, onIssued, onClose }) {
    const [label, setLabel] = useState("");
    const [phase, setPhase] = useState("form");
    const [error, setError] = useState(null);
    const [issued, setIssued] = useState(null);
    const [copied, setCopied] = useState("idle");
    const [saved, setSaved] = useState(false);
    const secretRef = useRef(null);

    const close = () => {
        setIssued(null);
        onClose();
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        if (label.length > LABEL_MAX) return;
        setPhase("issuing");
        setError(null);
        try {
            const result = await issue(label.trim());
            setIssued({ secret: result.raw_secret, label: result.label, createdAt: result.created_at });
            setPhase("secret");
            onIssued();
        } catch (issueError) {
            setError(issueError);
            setPhase("form");
        }
    };

    const onCopy = async () => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(issued.secret);
            setCopied("copied");
        } catch {
            setCopied("failed");
            secretRef.current?.select();
        }
    };

    if (phase === "secret" && issued) {
        return (
            <Dialog
                title="Save this connection key now"
                description={`${application.name} · ${application.environment}${issued.label ? ` · ${issued.label}` : ""}`}
                onClose={close}
                closeOnBackdrop={false}
                footer={
                    <button type="button" className="gc-button gc-button--primary" onClick={close} disabled={!saved}>
                        Done
                    </button>
                }
            >
                <p className="gc-warning" role="note">
                    <strong>This key can't be shown again.</strong> Gait keeps only a fingerprint of it. Put it in your
                    application's backend secret settings as <code className="gc-code">GAIT_APPLICATION_CREDENTIAL</code>,
                    never in code or chat.
                </p>
                <Field label="Connection key">
                    <input
                        ref={secretRef}
                        className="gc-input gc-secret"
                        value={issued.secret}
                        readOnly
                        spellCheck="false"
                        autoComplete="off"
                        onFocus={(event) => event.target.select()}
                    />
                </Field>
                <div className="gc-secret-actions">
                    <button type="button" className="gc-button gc-button--ghost" onClick={onCopy}>
                        {copied === "copied" ? "Copied" : "Copy key"}
                    </button>
                    <span role="status" aria-live="polite" className={copied === "failed" ? "gc-field-error" : "gc-muted"}>
                        {copied === "copied" ? "Copied to clipboard." : copied === "failed" ? "Couldn't copy. The key is selected: copy it manually." : ""}
                    </span>
                </div>
                <label className="gc-checkbox">
                    <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
                    <span>I've saved this key somewhere safe</span>
                </label>
            </Dialog>
        );
    }

    return (
        <Dialog
            title="Issue a connection key"
            description={`${application.name} · ${application.environment}. You can have more than one active key, which makes rotation safe.`}
            onClose={close}
            footer={<Buttons form="gc-issue-key" onCancel={close} confirmLabel="Issue key" pendingLabel="Issuing…" pending={phase === "issuing"} />}
        >
            <form id="gc-issue-key" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <Field label="Label (optional)" hint="Where this key will live, so you can tell keys apart later.">
                    <input
                        className="gc-input"
                        value={label}
                        maxLength={LABEL_MAX}
                        placeholder="e.g. prod server, Sept rotation"
                        onChange={(event) => setLabel(event.target.value)}
                    />
                </Field>
                <FormError error={error} />
            </form>
        </Dialog>
    );
}

/** Revoke a key, showing when it was last used first. */
export function RevokeKeyDialog({ credential, mutation, onClose }) {
    const lastUsed = credential.last_used_at ? new Date(credential.last_used_at) : null;
    const usedRecently = lastUsed && Date.now() - lastUsed.getTime() < RECENT_USE_MS;
    const onConfirm = async () => {
        try {
            await mutation.mutateAsync(credential.credential_id);
            onClose();
        } catch {
            // shown below
        }
    };
    return (
        <Dialog
            title="Revoke this key?"
            description={credential.label || "Unlabelled key"}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button type="button" className="gc-button gc-button--danger" onClick={onConfirm} disabled={mutation.isPending}>
                        {mutation.isPending ? "Revoking…" : "Revoke key"}
                    </button>
                </>
            }
        >
            <p className="gc-dialog-text">
                <strong>Last used:</strong> {lastUsed ? formatDateTime(credential.last_used_at) : "never"}
            </p>
            {usedRecently ? (
                <p className="gc-warning" role="note">
                    This key was used in the last 24 hours, so something still depends on it. Deploy a new key first, or
                    that software stops reporting.
                </p>
            ) : null}
            <p className="gc-dialog-text">Revoking is immediate and permanent.</p>
            <FormError error={mutation.error} />
        </Dialog>
    );
}
