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

const strategicInterests = [
  "Licensing",
  "Commercial partnerships",
  "Design partnerships",
  "Investment",
  "Acquisition of the technology",
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

function CommandCenterMockup() {
  return (
    <div className="command-center-mockup" aria-label="Gait Security Command product preview">
      <div className="command-topbar">
        <span>GAIT SECURITY COMMAND</span>
        <StatusPill tone="healthy">Healthy</StatusPill>
      </div>
      <div className="command-grid">
        <section className="command-pane">
          <p className="panel-label">Security Posture</p>
          <div className="posture-row large">
            <span>Overall</span>
            <StatusPill tone="healthy">Healthy</StatusPill>
          </div>
          <div className="posture-row"><span>Healthy controls</span><strong>42</strong></div>
          <div className="posture-row"><span>Needs attention</span><strong>1</strong></div>
          <div className="posture-row"><span>Open findings</span><strong>1</strong></div>
          <div className="domain-list">
            <div><span>Authentication</span><StatusPill tone="healthy">Healthy</StatusPill></div>
            <div><span>Session Security</span><StatusPill tone="warning">Review</StatusPill></div>
            <div><span>Abuse Protection</span><StatusPill tone="healthy">Healthy</StatusPill></div>
          </div>
        </section>

        <section className="command-pane copilot-pane">
          <p className="panel-label">Security Copilot</p>
          <div className="chat-line user">You: Anything wrong?</div>
          <div className="chat-line gait">
            Gait: One control failed overnight. Blue Team identified the likely root cause. Green Team is preparing a candidate fix.
          </div>
          <div className="prompt-stack">
            <button type="button">Explain finding</button>
            <button type="button">Show evidence</button>
            <button type="button">Show repair</button>
          </div>
        </section>

        <section className="command-pane active-case">
          <p className="panel-label">Active Case</p>
          <h3>Refresh Replay #381</h3>
          <div className="case-grid">
            <span>Blue Team</span><StatusPill tone="healthy">Done</StatusPill>
            <span>Red Team</span><StatusPill tone="healthy">Done</StatusPill>
            <span>Green Team</span><StatusPill tone="running">Running</StatusPill>
            <span>Security Validator</span><StatusPill tone="neutral">Waiting</StatusPill>
          </div>
        </section>
      </div>
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
          <a href="#what-it-protects">What It Protects</a>
          <a href="#fleet">Fleet</a>
          <Link to="/architecture">Full Architecture</Link>
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
              <span className="eyebrow-badge">Our company's security control plane</span>
              <h1>The Security Operating System Behind Our Software</h1>
              <p className="hero-subtitle">
                Gait is a self-repairing security platform governed by evidence and human approval. It combines
                hardened enforcement, continuous observability, constrained security agents, independent validation,
                and Human Approver-controlled deployment.
              </p>
              <p className="trust-tagline">AI reasons. Code authorizes. Evidence establishes truth. Human Approvers control production.</p>
              <p className="hero-secondary-tagline">Built internally. Designed to become a platform.</p>
              <p className="hero-supporting-copy">
                Gait currently serves as the security and operational foundation for my applications. Its reusable
                observability, agent-governance, investigation, repair, and validation architecture is being designed
                so it can eventually be extracted into a standalone security platform.
              </p>
              {message && <p className="session-message">{message}</p>}
              <div className="hero-actions">
                <Link to="/architecture" className="btn-pill btn-pill-primary">
                  View Architecture <RiArrowRightLine />
                </Link>
                <a href="#what-it-protects" className="btn-pill btn-pill-secondary">See What It Protects</a>
                {!isLoggedIn && (
                  <button className="btn-pill btn-pill-outline" onClick={guestLogin} disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Try the live auth layer"}
                  </button>
                )}
              </div>
            </div>
            <CommandCenterMockup />
          </div>
        </section>

        {/* 2. What Gait protects */}
        <section className="section protects-section" id="what-it-protects">
          <p className="eyebrow">What Gait protects</p>
          <h2>Built to Protect Lumen.</h2>
          <p className="section-lede">
            Lumen is a healthcare vascular ultrasound reporting platform: clinicians and technologists use it to
            capture, review, and sign vascular studies. That workflow is security-sensitive. It handles clinical
            user access, protected operational data, and processes that need strong security, auditability, and
            long-term operational discipline, not a one-time hardening pass. Lumen is being built toward full HIPAA
            compliance and DICOM interoperability.
          </p>
          <LumenGaitProtectionVisual />
          <p className="section-note protects-scope-label">Gait protects, around Lumen:</p>
          <div className="need-grid">
            {lumenProtectionScope.map((item) => <span key={item}>{item}</span>)}
          </div>
          <ProtectionMapDiagram />
        </section>

        {/* 3. Security Fleet */}
        <section className="section agents-section" id="fleet">
          <p className="eyebrow">Security agent fleet</p>
          <h2>Specialized agents. Separate authority.</h2>
          <p className="section-lede">
            Gait uses AI agents, but does not trust them with unrestricted authority. Each specialist below is
            constrained to one job.
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

        {/* 4. Security Command Center */}
        <section className="section command-section" id="command-center">
          <p className="eyebrow">Security Command Center</p>
          <h2>One place to understand what needs attention.</h2>
          <p className="section-lede">
            A preview of the internal operator console. Realistic sample state, shown here for illustration.
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

        {/* Business inquiries */}
        <section className="section business-inquiries-section">
          <div className="business-inquiries-card">
            <p className="eyebrow">Business inquiries</p>
            <h2>Built Internally. Potentially Available Externally.</h2>
            <p className="section-lede">
              Gait is currently being developed as our company's security and operations platform. We're open to
              strategic conversations regarding:
            </p>
            <ul className="business-inquiries-list">
              {strategicInterests.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <Link to="/send-email" className="btn-pill btn-pill-secondary">Contact Us</Link>
          </div>
        </section>

        <section className="section final-cta">
          <RiShieldCheckLine />
          <h2>Serious security discipline, built into how we operate.</h2>
          <p>
            Gait gives our team continuous security assurance, constrained autonomous security engineering, and
            clear human control over high-consequence actions, today for our own systems.
          </p>
          <div className="hero-actions">
            <Link to="/architecture" className="btn-pill btn-pill-primary">Explore the Architecture</Link>
            {canViewSecurity && isLoggedIn ? (
              <Link to="/security-command" className="btn-pill btn-pill-secondary">See the Security Command Center</Link>
            ) : (
              <Link to="/login" className="btn-pill btn-pill-secondary"><RiLoginBoxLine /> Login</Link>
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
            Give the agent the capability to perform the task, not possession of the infrastructure.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
