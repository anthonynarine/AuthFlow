import React, { useEffect, useRef, useState } from "react";
import "../home/Home.css";
import "../../docs/docs.css";
import "./EarlyAccessPage.css";
import { Link } from "react-router-dom";
import { RiArrowLeftLine, RiShieldKeyholeLine } from "react-icons/ri";
import { publicAxios } from "../../interceptors/axios";
import { StatusBadge } from "../../docs/components/DocPrimitives";
import { docPath } from "../../docs/manifest";

const TEAM_SIZE_OPTIONS = ["Just me", "2–5 people", "6–15 people", "16+ people"];
const STAGE_OPTIONS = ["Idea", "Building", "Launched", "Scaling"];

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

function buildEmailContent(form) {
  return [
    "New early access request",
    "",
    `Name: ${form.name}`,
    `Email: ${form.reply_to}`,
    `Company / product: ${form.company}`,
    `Team size: ${form.teamSize}`,
    `Stage: ${form.stage}`,
    "",
    "What they're building:",
    form.building,
    "",
    "Biggest security worry right now:",
    form.concern,
    "",
    `GitHub repo: ${form.repoUrl.trim() || "Not provided"}`,
    `Urgent: ${form.urgent ? "Yes — flagged as urgent" : "No"}`,
  ].join("\n");
}

export function EarlyAccessPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await publicAxios.post("/mail/send-email/", {
        reply_to: form.reply_to.trim(),
        subject: `Early Access Request — ${form.company.trim()}`,
        content: buildEmailContent(form),
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error?.response?.data?.error || "Something went wrong sending your request. Please try again."
      );
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
              <div className="early-access-grid">
                <label className="early-access-field">
                  <span>Your name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="early-access-field">
                  <span>Work email</span>
                  <input
                    type="email"
                    name="reply_to"
                    value={form.reply_to}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label className="early-access-field">
                <span>Company or product name</span>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                />
              </label>

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

              <label className="early-access-field">
                <span>What are you building?</span>
                <input
                  type="text"
                  name="building"
                  placeholder="e.g. a B2B billing API, a mobile app backend..."
                  value={form.building}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="early-access-field">
                <span>What's your biggest security worry right now?</span>
                <textarea
                  name="concern"
                  placeholder="No wrong answer here — even “I honestly don't know” is useful."
                  value={form.concern}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="early-access-field">
                <span>GitHub repo (optional)</span>
                <input
                  type="text"
                  name="repoUrl"
                  placeholder="https://github.com/your-org/your-app"
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
