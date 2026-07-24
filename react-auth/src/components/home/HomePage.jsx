import React, { useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import { useTwoFactorAuthServices } from "../../context/auth/TwoFactorAuthContext";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { FiKey, FiMail } from 'react-icons/fi';
import { FaReact, FaPython, FaGithub } from 'react-icons/fa';
import {
  RiUserAddLine,
  RiLoginBoxLine,
  RiShieldKeyholeLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils/ToastUtils";
import { AuthFlowDiagram } from "./AuthFlowDiagram";
import { RequestFlow } from "./RequestFlow";

const steps = [
  {
    icon: RiUserAddLine,
    title: "Register",
    body: "Create an account through the Django API. Your password is hashed before it's ever stored, so it's never sitting anywhere as plain text.",
  },
  {
    icon: RiLoginBoxLine,
    title: "Login",
    body: "Your credentials are checked, and instead of a long-lived session, you get a short-lived token — one small choice that limits how much damage a leaked token could do.",
  },
  {
    icon: RiShieldKeyholeLine,
    title: "Two-factor (optional)",
    body: "Turn it on and you'll also need a 6-digit code from an authenticator app at login. A small extra step that makes a stolen password a lot less useful on its own.",
  },
  {
    icon: RiRefreshLine,
    title: "Stay signed in",
    body: "When your token expires, it's refreshed automatically in the background and the request quietly retries — no interruption, no need to log back in.",
  },
];

const techStack = [
  "React 18 + Hooks/Context",
  "Axios request/response interceptors",
  "Django REST Framework",
  "JWT — access + refresh tokens",
  "TOTP two-factor authentication",
  "CSRF + cookie security",
];

const engineeringNotes = [
  "Access tokens only last 15 minutes. If one ever got out, it wouldn't be useful for long, and it refreshes itself quietly in the background so you'd never notice.",
  "The CSRF token refreshes with every response instead of being set once and forgotten, so it can't quietly go stale.",
  "Cookie settings like Secure and SameSite switch automatically between development and production, so a weaker local config can never slip through to production.",
  "Two-factor uses an authenticator app instead of SMS, since text messages can be intercepted through SIM swapping.",
];

function HomePage() {
  const { toggle2fa, twoFactorError } = useTwoFactorAuthServices();
  const { logout, isLoggedIn, message, user, setError } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  const handleLogout = () => {
    logout();
  };

  const handleToggle2FA = async () => {
    try {
      const is2faEnabled = !user.is_2fa_enabled;
      await toggle2fa(!user.is_2fa_enabled);
      if (!is2faEnabled) {
        showSuccessToast("Two-factor authentication disabled successfully.");
      }
    } catch (error) {
      const errorMessage = twoFactorError || "Failed to toggle two-factor. Please try again";
      showErrorToast(errorMessage);
    }
  };

  return (
    <div className="home-page">
      <header className="site-header">
        <div className="brand">
          <FiKey />
          <span>Gait</span>
        </div>
        <nav className="site-nav">
          <Link to="/chat-completion" className="nav-icon" title="Chat completion demo">
            <FaPython size={20} />
          </Link>
          <Link to="/react-features" className="nav-icon" title="React features demo">
            <FaReact size={20} />
          </Link>
          <Link to="/send-email" className="nav-icon" title="Send email demo">
            <FiMail size={18} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-dots" aria-hidden="true" />
          <div className="hero-content">
            <span className="eyebrow-badge">Modern web security, in a nutshell</span>
            <h1>A custom-built web auth service.</h1>
            <p className="hero-subtitle">
              Every part of this system — registration, login, two-factor, session
              refresh — exists to learn how modern authentication actually works. I built
              it to get a deeper understanding of web security and its gaps, and wanted a
              security system of my own to build on. Give it a try.
            </p>
            {message && <p className="session-message">{message}</p>}
            <div className="hero-actions">
              {!isLoggedIn && (
                <Link to="/register" className="btn-pill btn-pill-primary">Register</Link>
              )}
              {isLoggedIn ? (
                <button className="btn-pill btn-pill-secondary" onClick={handleLogout}>Logout</button>
              ) : (
                <Link to="/login" className="btn-pill btn-pill-secondary">Login</Link>
              )}
              {user && (
                <button className="btn-pill btn-pill-outline" onClick={handleToggle2FA}>
                  {user.is_2fa_enabled ? "Disable 2FA" : "Enable 2FA"}
                </button>
              )}
              <a
                href="https://github.com/anthonynarine/AuthFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill btn-pill-ghost"
              >
                <FaGithub /> View source
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <p className="eyebrow">How it works</p>
          <h2>Here's what actually happens when you log in.</h2>
          <div className="steps-grid">
            {steps.map(({ icon: Icon, title, body }) => (
              <div className="glass-card step-card" key={title}>
                <div className="step-icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>

          <h3 className="subsection-title">A closer look: pick a flow to see it step by step</h3>
          <RequestFlow />
        </section>

        <section className="section">
          <p className="eyebrow">Under the hood</p>
          <h2>The stack running underneath.</h2>
          <AuthFlowDiagram />
          <div className="tech-grid">
            {techStack.map((item) => (
              <span className="tech-chip" key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="section">
          <p className="eyebrow">Where the weak points are</p>
          <h2>The small decisions that actually matter.</h2>
          <ul className="notes-list">
            {engineeringNotes.map((note) => (
              <li key={note}>
                <span className="note-dot" />
                <p>{note}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
