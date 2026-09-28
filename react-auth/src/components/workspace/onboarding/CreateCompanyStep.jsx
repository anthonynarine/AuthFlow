import React, { useState } from "react";
import { ResendVerificationButton } from "../../../account/ResendVerificationButton";

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

/**
 * UI2 Step 1 — Create your Company (Organization). Sends only
 * { name, slug } — nothing about role, membership, or organization
 * status is ever a field on this form, matching the backend's own
 * deliberately narrow CreateOrganizationSerializer.
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

  return (
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">Step 1 of 4</p>
      <h1 className="onboarding-title">Create your workspace</h1>
      <p className="onboarding-sub">A workspace holds your team, your applications and their security findings.</p>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <label className="onboarding-field">
          <span>Workspace name</span>
          <input type="text" value={name} onChange={handleNameChange} placeholder="Acme Inc." required autoFocus />
        </label>

        <label className="onboarding-field">
          <span>Workspace URL</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="acme-inc"
            pattern="[a-z0-9-]+"
            required
          />
          <small>It's how your workspace is identified in links. You can edit it now; it can't be changed later.</small>
        </label>

        {createError?.response?.data?.code === "EMAIL_NOT_VERIFIED" ? (
          // Gait E1: an unconfirmed address can't create a company yet.
          <div className="onboarding-error" role="alert">
            <p>{describeError(createError)} Open the link we emailed you, then try again.</p>
            <ResendVerificationButton />
          </div>
        ) : createError ? (
          <p className="onboarding-error">{describeError(createError)}</p>
        ) : null}

        <button type="submit" className="fw-btn primary" disabled={isCreating || !name.trim() || !slug.trim()}>
          {isCreating ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </div>
  );
}

export default CreateCompanyStep;
