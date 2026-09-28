import React, { useState } from "react";
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

// Verified read-only against applications/models.py's real
// Application.Environment choices on the ONB2 backend branch — not
// guessed. Sent to the backend exactly as-is; the backend remains
// authoritative and would reject anything else.
const ENVIRONMENTS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "ci", label: "CI" },
  { value: "test", label: "Test" },
  { value: "local", label: "Local" },
];

function describeError(error) {
  const detail = error?.response?.data?.detail;
  if (detail) {
    return String(detail);
  }
  const firstFieldError = error?.response?.data && Object.values(error.response.data)[0];
  if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
    return String(firstFieldError[0]);
  }
  if (error?.response?.status === 403) {
    return "You don't have permission to add an App to this workspace.";
  }
  return "Something went wrong adding your App. Please try again.";
}

/**
 * Onboarding step 2 — add your first App (DS-AUTH). Sends only
 * { name, slug, environment } — organization comes from the route/current
 * workspace, never a field on this form; framework is never sent here at all.
 */
export function AddAppStep({ companyName, onCreate, isCreating, createError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0].value);

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
    onCreate({ name: name.trim(), slug: slug.trim(), environment }).catch(() => {});
  };

  return (
    <>
      <StepIndicator step={2} of={4} label="Application" />
      <AuthHeading
        title="Add your first App"
        lede={companyName ? `The application ${companyName} wants Gait to protect.` : "The application Gait will protect."}
      />
      {createError ? <Alert kind="danger">{describeError(createError)}</Alert> : null}
      <form className="ds-form" onSubmit={handleSubmit} noValidate>
        <TextField label="App name" value={name} onChange={handleNameChange} placeholder="Acme API" autoComplete="off" />
        <TextField
          label="App URL slug"
          value={slug}
          onChange={handleSlugChange}
          placeholder="acme-api"
          autoComplete="off"
          hint="Letters, numbers and dashes. It's how this App is identified in links."
        />
        <Field label="Environment" hint="Which deployment of this App is this — where it actually runs.">
          {(aria) => (
            <select className="ds-input ds-select" value={environment} onChange={(event) => setEnvironment(event.target.value)} {...aria}>
              {ENVIRONMENTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="ds-actions">
          <Button type="submit" disabled={isCreating || !name.trim() || !slug.trim()}>
            {isCreating ? "Adding…" : "Add App"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default AddAppStep;
