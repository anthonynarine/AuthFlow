import React, { useEffect } from "react";
import "./Home.css";
import "./diagrams/homeDiagrams.css";
import { Link } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import {
  RiArrowRightLine,
  RiDatabase2Line,
  RiEyeLine,
  RiFlowChart,
  RiGitPullRequestLine,
  RiLoginBoxLine,
  RiRocketLine,
  RiSearchEyeLine,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
  RiSwordLine,
  RiToolsLine,
  RiUserLine,
} from "react-icons/ri";
import { ProtectionMapDiagram } from "./diagrams/ProtectionMapDiagram";
import { AgentFleetDiagram } from "./diagrams/AgentFleetDiagram";
import { CapabilityTag } from "../diagrams/DiagramPrimitives";

const agentFleet = [
  {
    name: "Incident Commander",
    verb: "Coordinate",
    copy: "Determines which specialist should act next and tracks workflow state without inheriting specialist authority.",
  },
  {
    name: "Blue Team",
    verb: "Diagnose",
    copy: "Inspects findings, evidence, security events, repository files, and Git history to identify probable root cause.",
  },
  {
    name: "Red Team",
    verb: "Attack",
    copy: "Runs narrowly approved adversarial probes in safe environments to determine whether a control can actually be broken.",
  },
  {
    name: "Green Team",
    verb: "Fix",
    copy: "Creates a scoped candidate repair in an isolated Git environment and adds appropriate regression coverage.",
  },
  {
    name: "Security Validator",
    verb: "Verify",
    copy: "Independently evaluates the repair against the original vulnerability, Git diff, tests, and security invariants.",
  },
  {
    name: "Release Engineer",
    verb: "Execute",
    copy: "Can deploy only the exact independently validated, Human Approver-approved artifact. It cannot choose branches, apps, commands, or environments.",
  },
  {
    name: "Security Copilot",
    verb: "Explain",
    copy: "A natural-language interface for asking what changed, what's failing, what's blocked, and what's ready for approval, without granting the model any new authority.",
  },
];

const earlyAccessAudience = [
  "Solo founders and indie hackers",
  "Small engineering teams without a security hire",
  "Pre-compliance startups (SOC 2 / HIPAA on the roadmap)",
  "Agencies responsible for client applications",
];

const fiveQuestions = [
  {
    q: "What happened?",
    a: "Gait tells you exactly what it detected, in plain language — not a raw alert feed.",
  },
  {
    q: "Does it matter?",
    a: "Every issue comes with a plain-English risk and impact, so you're never left guessing what “high severity” actually means for you.",
  },
  {
    q: "Can you prove it?",
    a: "Gait safely reproduces the issue in a sandboxed environment before ever proposing a fix — so “maybe broken” becomes “confirmed broken.”",
  },
  {
    q: "Can you fix it?",
    a: "Gait prepares a real, tested repair, independently validated before it's ever shown to you.",
  },
  {
    q: "What do you need to approve?",
    a: "Only the decision that actually requires you. Gait investigates, tests, and prepares on its own — you authorize anything that touches production.",
  },
];

const lumenProtectionScope = [
  "authentication",
  "sessions",
  "authorization",
  "security controls",
  "deployments",
  "agent workflows",
  "future HL7 / DICOM healthcare security components",
];

function formatCurrentUser(user) {
  if (!user) {
    return "";
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email || user.username || "Signed-in user";
}

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`product-status-pill ${tone}`}>{children}</span>;
}

function FounderIssueMockup() {
  return (
    <div className="command-center-mockup founder-mockup" aria-label="Example Gait issue, shown for illustration">
      <div className="command-topbar">
        <span>GAIT · YOUR SECURITY TEAM</span>
        <StatusPill tone="healthy">Protected</StatusPill>
      </div>
      <div className="founder-mockup-body">
        <div className="mock-finding">
          <div className="mock-finding-top">
            <h3>Suspicious refresh-token replay detected</h3>
            <StatusPill tone="warning">High risk</StatusPill>
          </div>
          <p>Someone tried to reuse a token that should no longer work. Gait blocked it — no account was compromised.</p>
          <div className="repair-grid mini">
            <span>Investigated</span><strong>Done</strong>
            <span>Reproduced</span><strong>Confirmed, safely</strong>
            <span>Fix prepared</span><strong>Ready</strong>
            <span>Validated</span><strong>Passed</strong>
            <span>Approval</span><strong className="pending">Needs you</strong>
          </div>
          <div className="repair-actions">
            <button type="button">Review fix</button>
            <button type="button">Approve</button>
          </div>
        </div>
        <div className="mock-chat">
          <div className="chat-line user">You: Is this serious?</div>
          <div className="chat-line gait">
            Gait: No — it was blocked before it could be used. I'd approve the fix so it can't be attempted again.
          </div>
        </div>
      </div>
      <p className="section-note mockup-caption">Example issue, shown for illustration.</p>
    </div>
  );
}

const protectionRoles = [
  { label: "Security Observatory", copy: "Watches controls", icon: RiEyeLine, tone: "truth" },
  { label: "Incident Commander", copy: "Coordinates response", icon: RiFlowChart, tone: "control" },
  { label: "Blue Team", copy: "Investigates", icon: RiSearchEyeLine, tone: "blue" },
  { label: "Red Team", copy: "Reproduces safely", icon: RiSwordLine, tone: "red" },
  { label: "Green Team", copy: "Prepares repairs", icon: RiToolsLine, tone: "green" },
  { label: "Security Validator", copy: "Verifies fixes", icon: RiShieldCheckLine, tone: "validator" },
  { label: "Human Approver", copy: "Authorizes production", icon: RiUserLine, tone: "human" },
  { label: "Release Engineer", copy: "Deploys exact artifacts", icon: RiRocketLine, tone: "release" },
  { label: "Security Truth", copy: "Evaluates evidence", icon: RiDatabase2Line, tone: "truth" },
];

function ringPoint(index, count, radius = 38) {
  const angle = (-90 + index * (360 / count)) * (Math.PI / 180);
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

const electronRingOrder = [
  "Security Validator",
  "Incident Commander",
  "Blue Team",
  "Red Team",
  "Green Team",
  "Release Engineer",
  "Security Truth",
];

function LumenGaitProtectionVisual() {
  const electronRoles = electronRingOrder.map((label) =>
    protectionRoles.find((role) => role.label === label)
  );

  return (
    <div className="lumen-gait-wrap" aria-label="Lumen wrapped by Gait security operations">
      <div className="lumen-gait-core">
        <div className="lumen-node">
          <strong>Lumen</strong>
        </div>
        <div className="agent-electron-orbits" aria-hidden="true">
          <div className="agent-electron-square">
          <div className="agent-electron-ring">
            {electronRoles.map((role, index) => {
              const Icon = role.icon;
              const { x, y } = ringPoint(index, electronRoles.length);
              return (
                <div
                  className="agent-electron-orbit"
                  key={role.label}
                  style={{ "--agent-x": `${x}%`, "--agent-y": `${y}%` }}
                >
                  <span className="agent-electron-drift">
                    <span className={`agent-electron agent-electron--${role.tone}`}>
                      <Icon />
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          </div>
        </div>
        <div className="gait-orbit" aria-hidden="true">
          <div className="gait-boundary-callout">
            <RiShieldKeyholeLine />
            <span>Gait</span>
          </div>
        </div>
      </div>
      <div className="protection-role-grid">
        {protectionRoles.map((role) => {
          const Icon = role.icon;
          return (
            <div className={`protection-role protection-role--${role.tone}`} key={role.label}>
              <Icon aria-hidden="true" />
              <span>{role.label}</span>
              <small>{role.copy}</small>
            </div>
          );
        })}
      </div>
      <p className="lumen-gait-synopsis">
        Lumen is the protected clinical application. Gait surrounds it with observability, constrained security agents,
        independent validation, and Human Approver-controlled deployment.
      </p>
    </div>
  );
}

function HomePage() {
  const { logout, guestLogin, isLoggedIn, isLoading, message, user, setError } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  const hasSecurityCapability = user
    ? Object.prototype.hasOwnProperty.call(user, "can_view_security_dashboard")
    : false;
  const canViewSecurity = hasSecurityCapability
    ? Boolean(user.can_view_security_dashboard)
    : Boolean(user?.is_staff);

  return (
    <div className="home-page product-home">
      <header className="site-header product-header">
        <a className="brand" href="#product" aria-label="Gait home">
          <RiShieldKeyholeLine />
          <span>Gait</span>
        </a>
        <nav className="site-nav product-nav" aria-label="Product navigation">
          <a href="#how-it-works">How It Works</a>
          <a href="#what-it-protects">Proof It Works</a>
          <a href="#fleet">Fleet</a>
          <Link to="/architecture">Full Architecture</Link>
          {!isLoggedIn && (
            <Link to="/early-access" className="nav-cta secondary">Early Access</Link>
          )}
          {isLoggedIn && user && (
            <span className="signed-in-chip" title={`Signed in as ${formatCurrentUser(user)}`}>
              {formatCurrentUser(user)}
            </span>
          )}
          {isLoggedIn && canViewSecurity && (
            <Link to="/security-command" className="nav-cta secondary">
              Security Command
            </Link>
          )}
          {isLoggedIn && !canViewSecurity && (
            <button
              type="button"
              className="nav-cta secondary disabled"
              title="Staff only"
              aria-label="Security Command, staff only"
              disabled
            >
              Staff only
            </button>
          )}
          {isLoggedIn ? (
            <button type="button" className="nav-cta" onClick={logout}>Logout</button>
          ) : (
            <Link to="/login" className="nav-cta">Login</Link>
          )}
        </nav>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="hero product-hero" id="product">
          <div className="hero-content product-hero-content">
            <div className="hero-copy">
              <span className="eyebrow-badge">Now in early access</span>
              <h1>Your AI security team.</h1>
              <p className="hero-subtitle">
                Gait watches your application, investigates what it finds, and prepares a fix — in plain English,
                not security jargon. You approve anything that actually matters.
              </p>
              <p className="trust-tagline">AI investigates. Evidence decides what's true. You approve anything that touches production.</p>
              <p className="hero-secondary-tagline">Built for teams without a security hire.</p>
              <p className="hero-supporting-copy">
                Gait started as the internal security system protecting Lumen, a healthcare application built toward
                full HIPAA compliance. We're now opening it to a small number of early teams who need real security
                discipline but can't yet justify a security hire.
              </p>
              {message && <p className="session-message">{message}</p>}
              <div className="hero-actions">
                <Link to="/early-access" className="btn-pill btn-pill-primary">
                  Join Early Access <RiArrowRightLine />
                </Link>
                <a href="#how-it-works" className="btn-pill btn-pill-secondary">See How It Works</a>
                {!isLoggedIn && (
                  <button className="btn-pill btn-pill-outline" onClick={guestLogin} disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Explore the live demo"}
                  </button>
                )}
              </div>
            </div>
            <FounderIssueMockup />
          </div>
        </section>

        {/* 2. How it works */}
        <section className="section how-it-works-section" id="how-it-works">
          <p className="eyebrow">How it works</p>
          <h2>Five questions. One team answering them.</h2>
          <p className="section-lede">
            You don't manage agents, read logs, or learn security vocabulary. Gait answers these in order, every time.
          </p>
          <ol className="workflow-list">
            {fiveQuestions.map((item, index) => (
              <li key={item.q}>
                <span className="workflow-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 3. Proof it works */}
        <section className="section protects-section" id="what-it-protects">
          <p className="eyebrow">Proof it works</p>
          <h2>Battle-Tested on a Real Healthcare Application.</h2>
          <p className="section-lede">
            Before we offered Gait to anyone else, we used it to protect Lumen — a vascular ultrasound reporting
            platform used by clinicians and technologists, built toward full HIPAA compliance and DICOM
            interoperability. Real clinical workflows. Real stakes. This is the same system, not a demo.
          </p>
          <LumenGaitProtectionVisual />
          <p className="section-note protects-scope-label">Gait protects, around Lumen:</p>
          <div className="need-grid">
            {lumenProtectionScope.map((item) => <span key={item}>{item}</span>)}
          </div>
          <ProtectionMapDiagram />
        </section>

        {/* 4. Security Fleet */}
        <section className="section agents-section" id="fleet">
          <p className="eyebrow">Your security team</p>
          <h2>Meet the team working for you.</h2>
          <p className="section-lede">
            Gait uses AI agents, but never gives any single one full authority. Each has exactly one job.
          </p>
          <AgentFleetDiagram />
          <div className="agent-grid">
            {agentFleet.map((agent) => (
              <article className="product-card agent-card" key={agent.name}>
                <div className="agent-card-top">
                  <span className="agent-verb">{agent.verb}</span>
                  {agent.planned && <CapabilityTag status="next" />}
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 5. Under the hood */}
        <section className="section command-section" id="command-center">
          <p className="eyebrow">Under the hood</p>
          <h2>Real agents. Real validation. Every time.</h2>
          <p className="section-lede">
            For the technically curious: here's what's actually happening behind "Gait prepared a fix."
          </p>
          <div className="repair-ready">
            <div>
              <p className="panel-label">Security Remediation Ready</p>
              <h3>Refresh Replay Protection Failure</h3>
            </div>
            <div className="repair-grid">
              <span>Root cause</span><strong>Identified</strong>
              <span>Red Team</span><strong>Reproduced</strong>
              <span>Green Team</span><strong>Prepared</strong>
              <span>Security Validator</span><strong>VALID</strong>
              <span>Tests</span><strong>473 / 473 passing</strong>
              <span>Exact artifact</span><strong>abc123</strong>
              <span>Risk</span><strong>LOW</strong>
            </div>
            <div className="repair-actions">
              <button type="button">Review</button>
              <button type="button">Approve</button>
              <button type="button">Reject</button>
            </div>
            <p className="section-note">Demo workflow preview. Consequential actions remain backend-authorized and Human Approver-controlled.</p>
          </div>
        </section>

        {/* Early access */}
        <section className="section business-inquiries-section" id="early-access">
          <div className="business-inquiries-card">
            <p className="eyebrow">Early access</p>
            <h2>We're Onboarding Early Teams by Hand.</h2>
            <p className="section-lede">
              Gait's multi-tenant support is still being built, so for now early access means talking to us
              directly, not a self-serve signup. Tell us about your app and we'll figure out if it's a fit.
            </p>
            <ul className="business-inquiries-list">
              {earlyAccessAudience.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <Link to="/early-access" className="btn-pill btn-pill-primary">Request Early Access</Link>
            <p className="section-note early-access-footnote">
              Also open to partnership, investment, and licensing conversations —{" "}
              <Link to="/send-email">contact us directly</Link>.
            </p>
          </div>
        </section>

        <section className="section final-cta">
          <RiShieldCheckLine />
          <h2>A security team, without the security hire.</h2>
          <p>
            Gait gives you continuous investigation, safe reproduction, tested fixes, and full control over
            anything that matters — without needing to learn what a SOC, SIEM, or CVE is.
          </p>
          <div className="hero-actions">
            <Link to="/architecture" className="btn-pill btn-pill-primary">Explore the Architecture</Link>
            {canViewSecurity && isLoggedIn ? (
              <Link to="/security-command" className="btn-pill btn-pill-secondary">Open Security Command</Link>
            ) : (
              <Link to="/early-access" className="btn-pill btn-pill-secondary"><RiLoginBoxLine /> Request Early Access</Link>
            )}
            <a
              href="https://github.com/anthonynarine/AuthFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-ghost"
            >
              <RiGitPullRequestLine /> Follow Development
            </a>
          </div>
          <p className="capability-line">
            Intelligence doesn't grant authority. Yours is the only approval that matters.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
