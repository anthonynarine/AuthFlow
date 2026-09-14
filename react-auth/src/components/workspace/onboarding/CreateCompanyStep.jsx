import React, { useState } from "react";

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
  return "Something went wrong creating your Company. Please try again.";
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
      <h1 className="onboarding-title">Create your Company</h1>
      <p className="onboarding-sub">This is the company Gait will protect.</p>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <label className="onboarding-field">
          <span>Company name</span>
          <input type="text" value={name} onChange={handleNameChange} placeholder="Acme Inc." required autoFocus />
        </label>

        <label className="onboarding-field">
          <span>Company URL slug</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="acme-inc"
            pattern="[a-z0-9-]+"
            required
          />
          <small>You can edit this — it's how your Company is identified in the URL.</small>
        </label>

        {createError && <p className="onboarding-error">{describeError(createError)}</p>}

        <button type="submit" className="fw-btn primary" disabled={isCreating || !name.trim() || !slug.trim()}>
          {isCreating ? "Creating…" : "Create Company"}
        </button>
      </form>
    </div>
  );
}

export default CreateCompanyStep;
