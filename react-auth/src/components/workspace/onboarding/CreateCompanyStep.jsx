import React, { useState } from "react";
import { ResendVerificationButton } from "../../../account/ResendVerificationButton";
import { AuthHeading } from "../../../ds/AuthLayout";
import { Alert, Button, Field, StepIndicator, TextField } from "../../../ds/components";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function describeError(error) {
  const detail = error?.response?.data?.detail;
  if (detail) {
    return String(detail);
  }
  const firstFieldError = error?.response?.data && Object.values(error.response.data)[0];
  if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
    return String(firstFieldError[0]);
  }
  if (error?.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  return "Something went wrong creating your workspace. Please try again.";
}

/** A field-keyed error from Gait ({slug: ["..."]}), if there is one. */
function fieldError(error, key) {
  const value = error?.response?.data?.[key];
  return Array.isArray(value) && value.length ? String(value[0]) : null;
}

/**
 * Onboarding step 1 — create a workspace (DS-AUTH). Sends only
 * { name, slug } — nothing about role, membership, or organization status is
 * ever a field on this form, matching the backend's own deliberately narrow
 * CreateOrganizationSerializer.
 */
export function CreateCompanyStep({ onCreate, isCreating, createError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (event) => {
    const value = event.target.value;
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (event) => {
    setSlugTouched(true);
    setSlug(slugify(event.target.value));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim() || isCreating) {
      return;
    }
    onCreate({ name: name.trim(), slug: slug.trim() }).catch(() => {
      // Error is surfaced via createError; form data is intentionally kept.
    });
  };

  const nameError = fieldError(createError, "name");
  const slugError = fieldError(createError, "slug");
  const unconfirmed = createError?.response?.data?.code === "EMAIL_NOT_VERIFIED";

  return (
    <>
      <StepIndicator step={1} of={4} label="Workspace" />
      <AuthHeading title="Create your workspace" lede="A workspace holds your team, your applications and their security findings." />
      {unconfirmed ? (
        // Gait E1: an unconfirmed address can't create a workspace yet.
        <>
          <Alert kind="warning" announce>{describeError(createError)} Open the link we emailed you, then try again.</Alert>
          <ResendVerificationButton className="ds-btn ds-btn--secondary" />
        </>
      ) : createError && !nameError && !slugError ? (
        <Alert kind="danger">{describeError(createError)}</Alert>
      ) : null}
      <form className="ds-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Workspace name"
          value={name}
          onChange={handleNameChange}
          placeholder="Acme Inc."
          autoComplete="organization"
          error={nameError}
        />
        <Field
          label="Workspace URL"
          hint="It's how your workspace is identified in links. You can edit it now; it can't be changed later."
          error={slugError}
        >
          {(aria) => (
            <div className="ds-prefix-wrap">
              <span className="ds-prefix" aria-hidden="true">/console/</span>
              <input className="ds-input" value={slug} onChange={handleSlugChange} placeholder="acme-inc" autoComplete="off" {...aria} />
            </div>
          )}
        </Field>
        <div className="ds-actions">
          <Button type="submit" disabled={isCreating || !name.trim() || !slug.trim()}>
            {isCreating ? "Creating…" : "Create workspace"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default CreateCompanyStep;
