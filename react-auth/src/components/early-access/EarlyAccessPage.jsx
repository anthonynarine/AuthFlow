import React, { useEffect, useRef, useState } from "react";
import "../home/Home.css";
import "../../docs/docs.css";
import "./EarlyAccessPage.css";
import { Link } from "react-router-dom";
import { RiArrowLeftLine, RiShieldKeyholeLine } from "react-icons/ri";
import { publicAxios } from "../../interceptors/axios";
import { StatusBadge } from "../../docs/components/DocPrimitives";
import { docPath } from "../../docs/manifest";
import { CONTACT_LIMITS, blankFields, contactErrorMessage } from "../mail/contactForm";

const TEAM_SIZE_OPTIONS = ["Just me", "2–5 people", "6–15 people", "16+ people"];
const STAGE_OPTIONS = ["Idea", "Building", "Launched", "Scaling"];

// Per-field caps, so the one message this page builds (buildEmailContent) always
// fits the server's content limit (5,000 characters), even with every field full.
// The test builds the longest possible message to prove it.
export const FIELD_LIMITS = {
  name: 100,
  reply_to: CONTACT_LIMITS.reply_to,
  company: 120,
  building: 1800,
  concern: 1800,
  repoUrl: 300,
};

const REQUIRED = ["name", "reply_to", "company", "building", "concern"];

const FIELD_LABELS = {
  name: "Your name",
  reply_to: "Work email",
  company: "Company or product name",
  building: "What are you building?",
  concern: "Your biggest security worry",
};

// The server's field names, for its "too long" errors.
const SERVER_LABELS = { reply_to: "Work email", subject: "Company or product name", content: "Your message" };

const initialForm = {
  name: "",
  reply_to: "",
  company: "",
  teamSize: TEAM_SIZE_OPTIONS[0],
  stage: STAGE_OPTIONS[1],
  building: "",
  concern: "",
  repoUrl: "",
  urgent: false,
};

export function buildEmailContent(form) {
  return [
    "New early access request",
    "",
    `Name: ${form.name.trim()}`,
    `Email: ${form.reply_to.trim()}`,
    `Company / product: ${form.company.trim()}`,
    `Team size: ${form.teamSize}`,
    `Stage: ${form.stage}`,
    "",
    "What they're building:",
    form.building.trim(),
    "",
    "Biggest security worry right now:",
    form.concern.trim(),
    "",
    `GitHub repo: ${form.repoUrl.trim() || "Not provided"}`,
    `Urgent: ${form.urgent ? "Yes — flagged as urgent" : "No"}`,
  ].join("\n");
}

export function buildSubject(form) {
  return `Early Access Request — ${form.company.trim()}`;
}

function FieldError({ name, message }) {
  return message ? (
    <span className="early-access-field-error" id={`early-access-${name}-error`}>
      {message}
    </span>
  ) : null;
}

export function EarlyAccessPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const successHeading = useRef(null);

  // The form is replaced by the confirmation; move focus there so keyboard and
  // screen-reader users aren't left on a control that no longer exists.
  useEffect(() => {
    if (status === "success") successHeading.current?.focus();
  }, [status]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // aria wiring for a field that may carry an error message below it.
  const errorProps = (name) =>
    fieldErrors[name]
      ? { "aria-invalid": true, "aria-describedby": `early-access-${name}-error` }
      : {};

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // The browser's "required" check lets a field of only spaces through; this doesn't.
    const blank = blankFields(form, REQUIRED);
    if (blank.length) {
      setFieldErrors(Object.fromEntries(blank.map((name) => [name, `${FIELD_LABELS[name]} can't be empty.`])));
      setStatus("idle");
      event.target.elements.namedItem(blank[0])?.focus();
      return;
    }
    setFieldErrors({});
    setStatus("submitting");

    try {
      await publicAxios.post("/mail/send-email/", {
        reply_to: form.reply_to.trim(),
        subject: buildSubject(form),
        content: buildEmailContent(form),
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(contactErrorMessage(error, SERVER_LABELS));
    }
  };

  return (
    <div className="home-page product-home early-access-page">
      <header className="site-header product-header">
        <Link className="brand" to="/" aria-label="Gait home">
          <RiShieldKeyholeLine />
          <span>Gait</span>
        </Link>
        <Link to="/" className="early-access-back">
          <RiArrowLeftLine /> Back to homepage
        </Link>
      </header>

      <main>
        <section className="section early-access-form-section">
          <p className="eyebrow">Early access</p>
          <h1 className="early-access-title">Tell us about your app.</h1>
          <p className="section-lede">
            Sign-in for your own product <StatusBadge feature="productSignIn" /> lets your users sign in with Gait
            accounts through the gait-sdk. A few details here help us figure out if it's a fit, and where to start
            if it is. Everything else in Gait you can start today: see the{" "}
            <Link to={docPath("quickstart")}>Quickstart</Link>.
          </p>

          {status === "success" ? (
            <div className="early-access-card early-access-success" role="status">
              <p className="panel-label">Request received</p>
              <h2 ref={successHeading} tabIndex={-1}>Thanks — we'll be in touch.</h2>
              <p>
                We read every early access request ourselves and will reply to <strong>{form.reply_to.trim()}</strong>.
              </p>
              <Link to="/" className="btn-pill btn-pill-secondary">Back to homepage</Link>
            </div>
          ) : (
            <form className="early-access-card early-access-form" onSubmit={handleSubmit}>
              <p className="early-access-note">
                Fields marked <span aria-hidden="true">*</span> are required.
              </p>
              <div className="early-access-grid">
                <div className="early-access-field-group">
                  <label className="early-access-field">
                    <span className="early-access-label is-required">Your name</span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={FIELD_LIMITS.name}
                      {...errorProps("name")}
                      required
                    />
                  </label>
                  <FieldError name="name" message={fieldErrors.name} />
                </div>
                <div className="early-access-field-group">
                  <label className="early-access-field">
                    <span className="early-access-label is-required">Work email</span>
                    <input
                      type="email"
                      name="reply_to"
                      value={form.reply_to}
                      onChange={handleChange}
                      maxLength={FIELD_LIMITS.reply_to}
                      {...errorProps("reply_to")}
                      required
                    />
                  </label>
                  <FieldError name="reply_to" message={fieldErrors.reply_to} />
                </div>
              </div>

              <div className="early-access-field-group">
                <label className="early-access-field">
                  <span className="early-access-label is-required">Company or product name</span>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    maxLength={FIELD_LIMITS.company}
                    {...errorProps("company")}
                    required
                  />
                </label>
                <FieldError name="company" message={fieldErrors.company} />
              </div>

              <div className="early-access-grid">
                <label className="early-access-field">
                  <span>Team size</span>
                  <select name="teamSize" value={form.teamSize} onChange={handleChange}>
                    {TEAM_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="early-access-field">
                  <span>Stage</span>
                  <select name="stage" value={form.stage} onChange={handleChange}>
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="early-access-field-group">
                <label className="early-access-field">
                  <span className="early-access-label is-required">What are you building?</span>
                  <input
                    type="text"
                    name="building"
                    placeholder="e.g. a B2B billing API, a mobile app backend..."
                    value={form.building}
                    onChange={handleChange}
                    maxLength={FIELD_LIMITS.building}
                    {...errorProps("building")}
                    required
                  />
                </label>
                <FieldError name="building" message={fieldErrors.building} />
              </div>

              <div className="early-access-field-group">
                <label className="early-access-field">
                  <span className="early-access-label is-required">What's your biggest security worry right now?</span>
                  <textarea
                    name="concern"
                    placeholder="No wrong answer here — even “I honestly don't know” is useful."
                    value={form.concern}
                    onChange={handleChange}
                    maxLength={FIELD_LIMITS.concern}
                    {...errorProps("concern")}
                    required
                  />
                </label>
                <FieldError name="concern" message={fieldErrors.concern} />
              </div>

              <label className="early-access-field">
                <span>GitHub repo (optional)</span>
                <input
                  type="text"
                  name="repoUrl"
                  placeholder="https://github.com/your-org/your-app"
                  maxLength={FIELD_LIMITS.repoUrl}
                  value={form.repoUrl}
                  onChange={handleChange}
                />
              </label>

              <label className="early-access-checkbox">
                <input
                  type="checkbox"
                  name="urgent"
                  checked={form.urgent}
                  onChange={handleChange}
                />
                <span>Mark as urgent (for example, a recent security incident or an active concern)</span>
              </label>

              {status === "error" && (
                <p className="early-access-error" role="alert">{errorMessage}</p>
              )}

              <p className="early-access-note">
                We email your answers to the Gait team. They aren't stored in Gait.
              </p>

              <button type="submit" className="btn-pill btn-pill-primary" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Request Early Access"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default EarlyAccessPage;
