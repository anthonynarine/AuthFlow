import React, { useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { apiErrorMessage } from "../../utils/apiErrors";
import { NOTE_MAX, NOTE_MIN } from "./findingLabels";

const COPY = {
    acknowledge: {
        title: "Acknowledge this finding",
        description: "Tells your team you've seen it and are working on it. It stays acknowledged until a later check passes and resolves it.",
        label: "What are you doing about it?",
        confirm: "Acknowledge",
        pending: "Acknowledging…",
    },
    "accept-risk": {
        title: "Accept the risk",
        description:
            "Records that you've decided to live with this for now. It stays accepted even if the check fails again (those reports are still recorded); a passing check resolves it once it's fixed.",
        label: "Why is this risk acceptable?",
        confirm: "Accept risk",
        pending: "Accepting…",
    },
};

/** Live check of Gait's note rule: 10-2000 characters once trimmed. */
export function noteProblem(note) {
    const length = note.trim().length;
    if (length < NOTE_MIN) return `Write at least ${NOTE_MIN} characters (${length} so far).`;
    if (length > NOTE_MAX) return `Keep it to ${NOTE_MAX} characters (${length} now).`;
    return null;
}

/** Acknowledge / accept risk, with the required note validated as you type. */
export function FindingActionDialog({ action, finding, mutation, onClose }) {
    const copy = COPY[action];
    const [note, setNote] = useState("");
    const [touched, setTouched] = useState(false);
    const problem = noteProblem(note);
    const length = note.trim().length;

    const onSubmit = async (event) => {
        event.preventDefault();
        setTouched(true);
        if (problem) return;
        try {
            await mutation.mutateAsync({ action, note: note.trim() });
            onClose();
        } catch {
            // shown below
        }
    };

    return (
        <Dialog
            title={copy.title}
            description={copy.description}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" form="gc-finding-action" className="gc-button gc-button--primary" disabled={mutation.isPending || Boolean(problem)}>
                        {mutation.isPending ? copy.pending : copy.confirm}
                    </button>
                </>
            }
        >
            <form id="gc-finding-action" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <p className="gc-dialog-text"><strong>{finding.title}</strong></p>
                <Field
                    label={copy.label}
                    hint={`${length} / ${NOTE_MAX} characters, at least ${NOTE_MIN}. Kept in the finding's permanent history.`}
                    error={touched || note.length > 0 ? problem : null}
                >
                    <textarea
                        className="gc-input gc-textarea"
                        rows={5}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        onBlur={() => setTouched(true)}
                    />
                </Field>
                {mutation.isError ? <p className="gc-form-error" role="alert">{apiErrorMessage(mutation.error)}</p> : null}
            </form>
        </Dialog>
    );
}

export default FindingActionDialog;
