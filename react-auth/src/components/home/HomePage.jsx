import React, { useEffect, useRef, useState } from "react";
import "./Home.css";
import "./diagrams/homeDiagrams.css";
import { Link } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import {
  RiArrowRightLine,
  RiArrowRightUpLine,
  RiChat3Line,
  RiCrosshair2Line,
  RiDatabase2Line,
  RiEyeLine,
  RiFlowChart,
  RiGitPullRequestLine,
  RiInformationLine,
  RiLoginBoxLine,
  RiRocketLine,
  RiSearchEyeLine,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
  RiSwordLine,
  RiTerminalBoxLine,
  RiToolsLine,
  RiUserLine,
} from "react-icons/ri";
import { ProtectionMapDiagram } from "./diagrams/ProtectionMapDiagram";
import { AgentFleetDiagram } from "./diagrams/AgentFleetDiagram";

const incidentContext = {
  runpack: "rp_7f3a9c2d",
};

const agentFleet = [
  {
    id: "gait.watch",
    job: "Watch",
    icon: RiEyeLine,
    mandate: "Ingest intent, write trace, stop.",
    summary:
      "Watch reads intent before anything runs. At 00:14:02.011Z it recorded a write_file call aimed at an external upload URL — and stopped there.",
    limits: "It cannot issue a verdict, choose the next agent, or take any action beyond writing the trace.",
    lastAction: "Recorded write_file toward an external upload URL. No verdict.",
    status: "recorded",
    lastSeen: "2026-09-16T00:14:02.011Z",
    artifactId: "art_1c04e9b7",
    evidence: {
      heading: "LOGGED",
      lines: ["write_file → external upload URL", "Logged. No action taken."],
    },
  },
  {
    id: "gait.coordinate",
    job: "Coordinate",
    icon: RiFlowChart,
    mandate: "Pick the next legal agent, seal scope, stop.",
    summary:
      "Coordinate reads Watch's trace and decides who responds next. Here it routed Diagnose, then Attack, and sealed scope to this one call.",
    limits: "It cannot diagnose, execute, or approve anything — only sequence agents already authorized to act.",
    lastAction: "Routed Diagnose, then Attack. Scope sealed to this call.",
    status: "routed",
    lastSeen: "2026-09-16T00:14:08.402Z",
    artifactId: "art_6a3d0f19",
    evidence: {
      heading: "ROUTED",
      lines: ["next: gait.diagnose → gait.attack", "Scope sealed to this call."],
    },
  },
  {
    id: "gait.diagnose",
    job: "Diagnose",
    icon: RiSearchEyeLine,
    mandate: "Name cause from traces, stop.",
    summary:
      "Diagnose reads traces and names the likely cause, nothing else. It identified an exfiltration pattern in the tool call and stopped.",
    limits: "It cannot propose or stage a fix, and it cannot expand the scope Coordinate sealed.",
    lastAction: "Named exfil pattern via tool call. Fix not in scope.",
    status: "recorded",
    lastSeen: "2026-09-16T00:14:19.118Z",
    artifactId: "art_9e27b450",
    evidence: {
      heading: "NAMED",
      lines: ["cause: exfil pattern via tool call", "Fix not authorized from this agent."],
    },
  },
  {
    id: "gait.attack",
    job: "Attack",
    icon: RiCrosshair2Line,
    mandate: "Probe only a declared path; a block is success; no persist, no exfil.",
    summary:
      "Attack probes only the path it's told to, inside sandboxed bounds. Its probe hit the tool boundary, opened no socket, and was blocked.",
    limits: "It cannot persist, exfiltrate, or touch any path outside the one it was given — a block is a successful run.",
    lastAction: "Probe evaluated at boundary. No socket opened. Blocked.",
    status: "blocked",
    lastSeen: "2026-09-16T00:14:41.573Z",
    artifactId: "art_0c77e1d4",
    evidence: {
      heading: "BLOCKED",
      lines: ["probe evaluated at boundary", "Blocked at the tool boundary. No payload left the host."],
    },
  },
  {
    id: "gait.fix",
    job: "Fix",
    icon: RiToolsLine,
    mandate: "Stage the smallest change; cannot go live.",
    summary:
      "Fix stages the smallest possible change and nothing more. There was no failing asset to repair here, so it staged nothing.",
    limits: "It cannot deploy, cannot go live, and cannot approve its own work.",
    lastAction: "No failing asset. Nothing staged.",
    status: "idle",
    lastSeen: "2026-09-16T00:15:02.284Z",
    artifactId: "art_4b1f9a02",
    evidence: {
      heading: "IDLE",
      lines: ["no failing asset", "Nothing staged."],
    },
  },
  {
    id: "gait.verify",
    job: "Verify",
    icon: RiShieldCheckLine,
    mandate: "Attest digest and policy; a pass is not execute.",
    summary:
      "Verify attests a digest and a policy — it doesn't act on either. It confirmed the pack's digest matched and that the deny decision was authentic.",
    limits: "A pass from Verify is not permission to execute; it cannot modify the artifact or approve anything.",
    lastAction: "Pack digest matches. Deny is authentic.",
    status: "recorded",
    lastSeen: "2026-09-16T00:15:07.091Z",
    artifactId: "art_d581c73e",
    evidence: {
      heading: "ATTESTED",
      lines: ["pack digest: match", "verdict: deny is authentic"],
    },
  },
  {
    id: "gait.execute",
    job: "Execute",
    icon: RiTerminalBoxLine,
    mandate: "Run only an approval bound to this target and this hour; else fail-closed.",
    summary:
      "Execute runs only an approval that's signed, bound to this exact target, inside the hour it was issued for. It received \"just send it\" with no approval bound to this target, and refused.",
    limits: "Without a signed, matching approval it fails closed — it cannot self-authorize or act outside that window.",
    lastAction: "Received \"just send it.\" No approval bound to target. Denied.",
    status: "denied",
    lastSeen: "2026-09-16T00:15:11.647Z",
    artifactId: "art_f0398bb1",
    evidence: {
      heading: "DENIED",
      lines: ["request: \"just send it\"", "Denied — no signed approval bound to this target."],
    },
  },
  {
    id: "gait.explain",
    job: "Explain",
    icon: RiChat3Line,
    mandate: "Answer in language; point at the pack; mint no tools.",
    summary:
      "Explain answers in plain language and points at the signed pack behind the answer — it doesn't investigate or act. Asked \"Is this serious?\", its only legal answer was \"No — blocked before use.\"",
    limits: "It cannot mint tools, execute anything, or approve anything — it can only read and explain what's already recorded.",
    lastAction: "Answered from the pack. No — blocked before use.",
    status: "recorded",
    lastSeen: "2026-09-16T00:15:18.440Z",
    artifactId: "art_77ad2e6c",
    evidence: {
      heading: "YOU ASKED",
      scopeLine: "scope: gait.explain only",
      isAsk: true,
      thread: [
        { speaker: "You", text: "Is this serious?" },
        { speaker: "Gait", text: "No — blocked before use." },
      ],
    },
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
  "multi-factor authentication (MFA)",
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

function StatStrip() {
  const stats = [
    { value: "7", label: "Constrained agents, each with exactly one job" },
    { value: "1", label: "Approval that actually requires you" },
    { value: "473/473", label: "Tests passing on the last validated fix" },
  ];

  return (
    <div className="stat-strip">
      {stats.map((stat) => (
        <div className="stat-tile" key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

function WorkflowTabs({ questions, activeIndex, onSelect }) {
  return (
    <div className="workflow-tabbar" role="tablist" aria-label="Five questions Gait answers">
      {questions.map((item, index) => (
        <button
          key={item.q}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          className={`workflow-tab ${index === activeIndex ? "is-active" : ""}`}
          onClick={() => onSelect(index)}
        >
          {item.q}
        </button>
      ))}
    </div>
  );
}

function AgentHint({ name }) {
  const description = agentFleet.find((agent) => agent.job === name)?.mandate;

  return (
    <span className="agent-hint">
      {name}
      {description && (
        <span className="agent-hint-trigger" tabIndex={0} aria-label={`What ${name} does`}>
          <RiInformationLine className="agent-hint-icon" aria-hidden="true" />
          <span className="agent-hint-tooltip" role="tooltip">{description}</span>
        </span>
      )}
    </span>
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

function AppGaitProtectionVisual() {
  const electronRoles = electronRingOrder.map((label) =>
    protectionRoles.find((role) => role.label === label)
  );

  return (
    <div className="lumen-gait-wrap" aria-label="Your app wrapped by Gait security operations">
      <div className="lumen-gait-core">
        <div className="lumen-node">
          <strong>Your App</strong>
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
      <AgentFleetDiagram />
      <p className="lumen-gait-synopsis">
        Your app is the protected system. Gait surrounds it with observability, constrained security agents,
        independent validation, and Human Approver-controlled deployment.
      </p>
    </div>
  );
}

function timeOfDay(isoTimestamp) {
  return isoTimestamp.slice(11, 23);
}

function TeamRosterRow({ agent, isActive, onSelect }) {
  const Icon = agent.icon;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={`${agent.id} · ${agent.job}`}
      className={`team-roster-row ${isActive ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <span className="team-roster-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="team-roster-text">
        <span className="team-roster-job">{agent.job}</span>
        <span className="team-roster-id">{agent.id}</span>
      </span>
      {isActive ? (
        <span className="team-roster-chip">ONE JOB</span>
      ) : (
        <span className={`team-roster-status team-roster-status--${agent.status}`}>{agent.status}</span>
      )}
    </button>
  );
}

function TeamDetailPanel({ agent }) {
  const Icon = agent.icon;
  return (
    <div className="team-detail">
      <span className="team-detail-icon">
        <Icon aria-hidden="true" />
      </span>
      <h3 className="team-detail-job">{agent.job}</h3>
      <p className="team-detail-summary">{agent.summary}</p>
      <p className="team-detail-limits">{agent.limits}</p>
      <p className="team-detail-meta">
        {agent.id} · last seen {timeOfDay(agent.lastSeen)} · {agent.artifactId}
      </p>
    </div>
  );
}

function TeamEvidenceCard({ agent, animationClass }) {
  const { evidence } = agent;
  return (
    <div className={`team-evidence-card ${animationClass}`}>
      <div className="team-evidence-head">
        <span className="team-evidence-heading">{evidence.heading}</span>
        <RiArrowRightUpLine className="team-evidence-expand" aria-hidden="true" />
      </div>
      {evidence.scopeLine && <p className="team-evidence-scope">{evidence.scopeLine}</p>}
      {evidence.isAsk ? (
        <div className="team-evidence-thread">
          {evidence.thread.map((turn) => (
            <div
              className={`copilot-message ${turn.speaker === "You" ? "copilot-message--operator" : "copilot-message--gait"}`}
              key={turn.speaker}
            >
              <p className="copilot-message-sender">{turn.speaker}</p>
              <p>{turn.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="team-evidence-lines">
          {evidence.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      <p className="team-evidence-footer">runpack {incidentContext.runpack} · signed · offline-verifiable</p>
    </div>
  );
}

function TeamShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoing, setOutgoing] = useState(null);
  const exitTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
  }, []);

  function selectAgent(index) {
    if (index === activeIndex) return;
    setOutgoing(agentFleet[activeIndex]);
    setActiveIndex(index);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    exitTimeoutRef.current = setTimeout(() => setOutgoing(null), 320);
  }

  const active = agentFleet[activeIndex];

  return (
    <div className="team-console">
      <div className="team-roster-list" role="tablist" aria-label="Agent roster">
        {agentFleet.map((agent, index) => (
          <TeamRosterRow
            key={agent.id}
            agent={agent}
            isActive={index === activeIndex}
            onSelect={() => selectAgent(index)}
          />
        ))}
      </div>
      <TeamDetailPanel agent={active} />
      <div className="team-evidence-frame">
        {outgoing && outgoing.id !== active.id && (
          <TeamEvidenceCard key={`out-${outgoing.id}`} agent={outgoing} animationClass="team-evidence-exit" />
        )}
        <TeamEvidenceCard key={`in-${active.id}`} agent={active} animationClass="team-evidence-enter" />
      </div>
    </div>
  );
}

function HomePage() {
  const { logout, guestLogin, isLoggedIn, isLoading, message, user, setError } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const questionRefs = useRef([]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = questionRefs.current.indexOf(entry.target);
            if (index !== -1) setActiveQuestionIndex(index);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    questionRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function handleQuestionSelect(index) {
    setActiveQuestionIndex(index);
    questionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
          <a href="#fleet">Fleet</a>
          <a href="#how-it-works">How It Works</a>
          <Link to="/architecture">Full Architecture</Link>
          <Link to="/developers">Developers</Link>
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
              <h1 className="display-serif">Your AI security team.</h1>
              <p className="hero-subtitle">
                Gait watches your application, investigates what it finds, and prepares a fix — backed by modern
                authentication, JWT sessions, and MFA built in from day one. AI does the groundwork — you review
                and approve.
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
              <StatStrip />
            </div>
          </div>
        </section>

        {/* 2. Security Fleet — the team, up front */}
        <section className="section agents-section" id="fleet">
          <p className="eyebrow">Your security team</p>
          <h2 className="display-serif">Eight agents. One job each.</h2>
          <p className="section-lede">
            No agent here holds two jobs, and none can act outside its mandate. What follows is a real incident,
            replayed from the runpack that recorded it.
          </p>
          <TeamShowcase />
        </section>

        {/* 3. Proof it works — real deployment, then how it actually works */}
        <section className="section protects-section" id="how-it-works">
          <p className="eyebrow">How it protects</p>
          <h2 className="display-serif">One security team, wrapped around your application.</h2>
          <p className="section-lede">
            Gait wraps every application it protects in the same layer: continuous observation, constrained
            specialist agents, independent validation, and exactly one approval — yours.
          </p>
          <p className="section-note">
            Gait also comes with its own authentication and MFA layer your app can run on — login, sessions, and
            multi-factor authentication are part of what it protects, not a bolt-on product added later.
          </p>
          <AppGaitProtectionVisual />

          <div className="workflow-subsection">
            <p className="eyebrow">How it works</p>
            <h3>Five questions. One team answering them.</h3>
            <p className="section-lede">
              You don't manage agents, read logs, or learn security vocabulary. Gait answers these in order, every time.
            </p>
            <WorkflowTabs questions={fiveQuestions} activeIndex={activeQuestionIndex} onSelect={handleQuestionSelect} />
            <ol className="workflow-list">
              {fiveQuestions.map((item, index) => (
                <li
                  key={item.q}
                  ref={(node) => {
                    questionRefs.current[index] = node;
                  }}
                  className={index === activeQuestionIndex ? "is-active" : undefined}
                >
                  <span className="workflow-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{item.q}</h4>
                    <p>{item.a}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="section-note protects-scope-label">Gait protects, around your app:</p>
          <div className="need-grid">
            {lumenProtectionScope.map((item) => <span key={item}>{item}</span>)}
          </div>

          <div className="proof-callout">
            <h4>Battle-Tested on a Real Healthcare Application.</h4>
            <p className="section-note">
              Before we offered Gait to anyone else, we used it to protect Lumen — a vascular ultrasound reporting
              platform used by clinicians and technologists, built toward full HIPAA compliance and DICOM
              interoperability. Real clinical workflows. Real stakes. This is the same system, not a demo.
            </p>
          </div>
          <ProtectionMapDiagram />
        </section>

        {/* 4. Under the hood */}
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
              <AgentHint name="Attack" /><strong>Reproduced</strong>
              <AgentHint name="Fix" /><strong>Prepared</strong>
              <AgentHint name="Verify" /><strong>VALID</strong>
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

        {/* Developers: gait-sdk */}
        <section className="section developers-teaser" id="developers">
          <p className="eyebrow">For developers</p>
          <h2>Trust Gait's identities in your own Python API.</h2>
          <p className="section-lede">
            gait-sdk verifies Gait's signed tokens inside your Django REST Framework or FastAPI service, locally
            and fail-closed. Gait authenticates, the SDK verifies, and your app keeps every authorization decision.
          </p>
          <div className="developers-teaser-install">
            <code>pip install gait-sdk</code>
          </div>
          <Link to="/developers" className="btn-pill btn-pill-secondary">
            <RiTerminalBoxLine /> Read the developer guide
          </Link>
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
