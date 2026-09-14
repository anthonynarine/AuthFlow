import React, { useState } from "react";

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
    return "You don't have permission to add an App to this Company.";
  }
  return "Something went wrong adding your App. Please try again.";
}

/**
 * UI2 Step 2 — Add your first App. Sends only { name, slug, environment }
 * — organization comes from the route/current Company, never a field on
 * this form; framework is never sent here at all (see FrameworkStep).
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
    <div className="onboarding-step">
      <p className="onboarding-eyebrow">Step 2 of 4</p>
      <h1 className="onboarding-title">Add your first App</h1>
      <p className="onboarding-sub">
        {companyName ? `The application ${companyName} wants Gait to protect.` : "The application Gait will protect."}
      </p>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <label className="onboarding-field">
          <span>App name</span>
          <input type="text" value={name} onChange={handleNameChange} placeholder="Acme API" required autoFocus />
        </label>

        <label className="onboarding-field">
          <span>App URL slug</span>
          <input type="text" value={slug} onChange={handleSlugChange} placeholder="acme-api" pattern="[a-z0-9-]+" required />
        </label>

        <label className="onboarding-field">
          <span>Environment</span>
          <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
            {ENVIRONMENTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>Which deployment of this App is this — where it actually runs.</small>
        </label>

        {createError && <p className="onboarding-error">{describeError(createError)}</p>}

        <button type="submit" className="fw-btn primary" disabled={isCreating || !name.trim() || !slug.trim()}>
          {isCreating ? "Adding…" : "Add App"}
        </button>
      </form>
    </div>
  );
}

export default AddAppStep;
