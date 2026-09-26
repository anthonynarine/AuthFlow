import React, { useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { ENVIRONMENT_LABELS, ENVIRONMENTS } from "../../hooks/useConsoleScope";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiErrors";
import { useCreateApplication } from "./useApplications";

// Mirrors Gait's own rules: name up to 160 characters; slug is a Django
// SlugField (letters, numbers, hyphens, underscores), up to 160.
const MAX_LENGTH = 160;
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

export function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, MAX_LENGTH);
}

function validate({ name, slug }) {
    const errors = {};
    if (!name.trim()) errors.name = "Give the application a name.";
    else if (name.length > MAX_LENGTH) errors.name = `Use ${MAX_LENGTH} characters or fewer.`;
    if (!slug) errors.slug = "Give the application a slug.";
    else if (!SLUG_PATTERN.test(slug)) errors.slug = "Use only letters, numbers, hyphens and underscores.";
    else if (slug.length > MAX_LENGTH) errors.slug = `Use ${MAX_LENGTH} characters or fewer.`;
    return errors;
}

/** Owners and Admins add an application: one piece of software in one environment. */
export function CreateApplicationDialog({ organizationSlug, defaultEnvironment, onCreated, onClose }) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [environment, setEnvironment] = useState(defaultEnvironment);
    const [submitted, setSubmitted] = useState(false);
    const create = useCreateApplication(organizationSlug);

    const errors = validate({ name, slug });
    const serverErrors = apiFieldErrors(create.error);
    const shown = submitted ? { ...errors, ...serverErrors } : serverErrors;

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) return;
        try {
            const application = await create.mutateAsync({ name: name.trim(), slug, environment });
            onCreated(application);
        } catch {
            // shown below
        }
    };

    const formError = create.isError && Object.keys(serverErrors).length === 0 ? apiErrorMessage(create.error) : null;

    return (
        <Dialog
            title="Add an application"
            description="One application is one piece of your software in one environment. Its connection keys only ever report for it."
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="gc-button gc-button--ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" form="gc-create-application" className="gc-button gc-button--primary" disabled={create.isPending}>
                        {create.isPending ? "Adding…" : "Add application"}
                    </button>
                </>
            }
        >
            <form id="gc-create-application" onSubmit={onSubmit} noValidate className="gc-dialog-body">
                <Field label="Name" error={shown.name}>
                    <input
                        className="gc-input"
                        value={name}
                        maxLength={MAX_LENGTH}
                        onChange={(event) => {
                            setName(event.target.value);
                            if (!slugEdited) setSlug(slugify(event.target.value));
                        }}
                    />
                </Field>
                <Field
                    label="Slug"
                    hint="Can't be changed later. The same slug can be reused in another environment."
                    error={shown.slug}
                >
                    <input
                        className="gc-input"
                        value={slug}
                        maxLength={MAX_LENGTH}
                        onChange={(event) => {
                            setSlug(event.target.value);
                            setSlugEdited(true);
                        }}
                    />
                </Field>
                <Field label="Environment" hint="Can't be changed later. Each environment has its own keys and results.">
                    <select className="gc-input" value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                        {ENVIRONMENTS.map((env) => (
                            <option key={env} value={env}>{ENVIRONMENT_LABELS[env]}</option>
                        ))}
                    </select>
                </Field>
                {formError ? <p className="gc-form-error" role="alert">{formError}</p> : null}
            </form>
        </Dialog>
    );
}

export default CreateApplicationDialog;
