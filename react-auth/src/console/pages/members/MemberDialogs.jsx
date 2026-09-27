import React, { useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiErrors";
import {
    LAST_OWNER_HELP,
    ROLE_DESCRIPTIONS,
    ROLE_LABELS,
    assignableRoles,
    memberName,
} from "./memberRules";

/** Gait's refusal in plain words; LAST_OWNER also says how to fix it. */
export function refusalMessage(error) {
    const code = error?.response?.data?.code;
    if (code === "LAST_OWNER") return LAST_OWNER_HELP;
    if (code === "OWNER_REQUIRED") return "Only Owners can give someone the Owner role, or change or remove an Owner.";
    return apiErrorMessage(error);
}

function FormError({ error }) {
    return error ? <p className="gc-form-error" role="alert">{refusalMessage(error)}</p> : null;
}

function RolePicker({ name, roles, value, onChange }) {
    return (
        <fieldset className="gc-role-picker">
            <legend className="gc-field-label">Role</legend>
            {roles.map((role) => (
                <label key={role} className={`gc-role-option${value === role ? " is-selected" : ""}`}>
                    <input type="radio" name={name} value={role} checked={value === role} onChange={() => onChange(role)} />
                    <span>
                        <strong>{ROLE_LABELS[role]}</strong>
                        <span className="gc-role-description">{ROLE_DESCRIPTIONS[role]}</span>
                    </span>
                </label>
            ))}
        </fieldset>
    );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite by email and role (Owner only offered to Owners). Afterwards, says
 * whether the email actually went out; the invite link itself is never shown.
 */
export function InviteDialog({ actorRole, companyName, mutation, onClose }) {
    const roles = assignableRoles(actorRole);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [touched, setTouched] = useState(false);
    const [result, setResult] = useState(null);
    const problem = !email.trim() ? "Enter their email address." : !EMAIL.test(email.trim()) ? "That doesn't look like an email address." : null;
    const fieldError = apiFieldErrors(mutation.error).email;

    const onSubmit = async (event) => {
        event.preventDefault();
        setTouched(true);
        if (problem) return;
        try {
            const invite = await mutation.mutateAsync({ email: email.trim(), orgRole: role });
            setResult(invite);
        } catch {
            // shown below
        }
    };

    if (result) {
        return (
            <Dialog
                title={result.email_sent ? "Invite sent" : "Invite created, but the email didn't go out"}
                onClose={onClose}
                footer={<button type="button" className="gc-button gc-button--primary" onClick={onClose}>Done</button>}
            >
                {result.email_sent ? (
                    <p className="gc-dialog-text">
                        We emailed <strong>{result.email}</strong> a link to join {companyName} as{" "}
                        {ROLE_LABELS[result.org_role]}. It works once and expires in 7 days.
                    </p>
                ) : (
                    <p className="gc-warning" role="note">
                        The invite for <strong>{result.email}</strong> exists, but Gait couldn't send the email. Use{" "}
                        <strong>Resend</strong> in the pending invites list to try again.
                    </p>
                )}
            </Dialog>
        );
    }

    return (
        <Dialog
            title="Invite someone"
            description={`They'll get a single-use link to join ${companyName}, valid for 7 days. They join by signing in with this email address.`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" form="gc-invite" className="gc-button gc-button--primary" disabled={mutation.isPending}>
                        {mutation.isPending ? "Inviting…" : "Send invite"}
                    </button>
                </>
            }
        >
            <form id="gc-invite" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <Field label="Email address" error={(touched && problem) || fieldError}>
                    <input className="gc-input" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} />
                </Field>
                <RolePicker name="invite-role" roles={roles} value={role} onChange={setRole} />
                {mutation.isError && !fieldError ? <FormError error={mutation.error} /> : null}
            </form>
        </Dialog>
    );
}

/** Change a member's role; demoting the last Owner is explained, not attempted. */
export function ChangeRoleDialog({ actorRole, member, isLastOwner, mutation, onClose }) {
    const roles = assignableRoles(actorRole);
    const [role, setRole] = useState(member.org_role);
    const blocked = isLastOwner && role !== "OWNER";

    const onSave = async () => {
        try {
            await mutation.mutateAsync({ membershipId: member.membership_id, orgRole: role });
            onClose();
        } catch {
            // shown below
        }
    };

    return (
        <Dialog
            title={`Change ${memberName(member)}'s role`}
            description={member.email}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className="gc-button gc-button--primary"
                        onClick={onSave}
                        disabled={mutation.isPending || role === member.org_role || blocked}
                    >
                        {mutation.isPending ? "Saving…" : "Save role"}
                    </button>
                </>
            }
        >
            <RolePicker name="member-role" roles={roles} value={role} onChange={setRole} />
            {blocked ? <p className="gc-warning" role="note">{LAST_OWNER_HELP}</p> : null}
            <FormError error={mutation.error} />
        </Dialog>
    );
}

/** Remove someone else. */
export function RemoveMemberDialog({ member, companyName, mutation, onClose }) {
    const onConfirm = async () => {
        try {
            await mutation.mutateAsync(member.membership_id);
            onClose();
        } catch {
            // shown below
        }
    };
    return (
        <Dialog
            title={`Remove ${memberName(member)} from ${companyName}?`}
            description={member.email}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button type="button" className="gc-button gc-button--danger" onClick={onConfirm} disabled={mutation.isPending}>
                        {mutation.isPending ? "Removing…" : "Remove"}
                    </button>
                </>
            }
        >
            <p className="gc-dialog-text">
                They lose access to {companyName} straight away. To bring them back, invite them again.
            </p>
            <FormError error={mutation.error} />
        </Dialog>
    );
}

/** Leave the company; the last Owner sees why they can't. */
export function LeaveDialog({ companyName, isLastOwner, you, mutation, onLeft, onClose }) {
    const onConfirm = async () => {
        try {
            await mutation.mutateAsync(you.membership_id);
            onLeft();
        } catch {
            // shown below
        }
    };
    if (isLastOwner) {
        return (
            <Dialog
                title={`You can't leave ${companyName} yet`}
                onClose={onClose}
                footer={<button type="button" className="gc-button gc-button--primary" onClick={onClose}>OK</button>}
            >
                <p className="gc-dialog-text">
                    You're its only Owner, and {LAST_OWNER_HELP.charAt(0).toLowerCase()}{LAST_OWNER_HELP.slice(1)} Use{" "}
                    <strong>Change role</strong> on a teammate to make them an Owner.
                </p>
            </Dialog>
        );
    }
    return (
        <Dialog
            title={`Leave ${companyName}?`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button type="button" className="gc-button gc-button--danger" onClick={onConfirm} disabled={mutation.isPending}>
                        {mutation.isPending ? "Leaving…" : `Leave ${companyName}`}
                    </button>
                </>
            }
        >
            <p className="gc-dialog-text">
                You'll lose access to {companyName}'s applications, findings and members. To come back, someone will
                need to invite you again.
            </p>
            <FormError error={mutation.error} />
        </Dialog>
    );
}

/** Revoke, or Resend (= revoke + create, so the old link stops working). */
export function InviteActionDialog({ action, invite, mutation, onClose }) {
    const [result, setResult] = useState(null);
    const resend = action === "resend";
    const onConfirm = async () => {
        try {
            const value = await mutation.mutateAsync(resend ? invite : invite.id);
            if (resend) setResult(value);
            else onClose();
        } catch {
            // shown below
        }
    };
    if (result) {
        return (
            <Dialog
                title={result.email_sent ? "New invite sent" : "New invite created, but the email didn't go out"}
                onClose={onClose}
                footer={<button type="button" className="gc-button gc-button--primary" onClick={onClose}>Done</button>}
            >
                <p className="gc-dialog-text">
                    {result.email_sent
                        ? `We emailed ${result.email} a new link. The old one no longer works.`
                        : `The old link no longer works, and Gait couldn't send the new one to ${result.email}. Try Resend again.`}
                </p>
            </Dialog>
        );
    }
    return (
        <Dialog
            title={resend ? `Resend the invite to ${invite.email}?` : `Revoke the invite for ${invite.email}?`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className={`gc-button ${resend ? "gc-button--primary" : "gc-button--danger"}`}
                        onClick={onConfirm}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (resend ? "Resending…" : "Revoking…") : resend ? "Send a new link" : "Revoke invite"}
                    </button>
                </>
            }
        >
            <p className="gc-dialog-text">
                {resend
                    ? "This sends a new link and the link they already have stops working."
                    : "The link they were sent stops working straight away."}
            </p>
            <FormError error={mutation.error} />
        </Dialog>
    );
}
