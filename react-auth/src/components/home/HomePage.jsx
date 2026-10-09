import React, { useEffect, useState } from "react";
import "./Home.css";
import "./diagrams/homeDiagrams.css";
import "../../docs/docs.css";
import { Link } from "react-router-dom";
import { GateMark } from "../../brand/GateMark";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import {
  RiArrowRightLine,
  RiBookOpenLine,
  RiCloseLine,
  RiMenuLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
} from "react-icons/ri";
import { AgentFleetDiagram } from "./diagrams/AgentFleetDiagram";
import { Diagram } from "../../docs/components/Diagram";
import { StatusCell } from "../../docs/components/StatusCell";
import { CodeBlock, StatusBadge } from "../../docs/components/DocPrimitives";
import { statusAsOfLabel } from "../../docs/featureStatus";
import { docPath } from "../../docs/manifest";
import { INSTALL, REPORT } from "../../docs/content/snippets";
import { AccountMenu } from "../../account/AccountMenu";
import { isGaitOperator } from "../../auth/operator";

/*
 * Gait is my internal security system (it protects Lumen and Gait itself), not
 * a product for other companies; keep the first-person voice (GAIT-13).
 * Every claim on this page comes from the public docs in the
 * Gait repo (docs/public/WHAT_GAIT_IS.md, HOW_IT_WORKS.md,
 * AUTOMATED_SECURITY_RESPONSE.md) or from src/docs/featureStatus.js. Change
 * those first; don't add claims here that they don't make.
 */

// The same drawing as the "How it works" docs page (HOW_IT_WORKS.md, "The big
// picture"), top to bottom so it stays readable in a narrow column.
const BIG_PICTURE = `flowchart TB
    classDef people fill:#1c1c1c,stroke:#fafafa,color:#e5e5e5,stroke-width:2px
    classDef gait fill:#162029,stroke:#a7c7d9,color:#e5e5e5,stroke-width:2px
    classDef soft fill:#1d1b26,stroke:#b8aee0,color:#e5e5e5,stroke-width:2px
    classDef users fill:#231e17,stroke:#d6b98c,color:#e5e5e5,stroke-width:2px

    ME["Me<br/>Owner of the workspace"]:::people
    subgraph GAIT["Gait"]
        CO["Workspace: Lumen<br/>applications · keys · findings"]:::gait
    end
    APP["Lumen<br/>Lumen API · production<br/>gait-sdk + connection key"]:::soft
    USERS["Lumen's users<br/>(sign in with Gait, early access)"]:::users

    ME -- "sign in to the console" --> CO
    APP -- "reports security checks" --> CO
    USERS -. "sign in with Gait;<br/>Lumen decides access" .-> APP`;

const BIG_PICTURE_DESCRIPTION =
  "I sign in to the console and work in Lumen's workspace inside Gait, which holds its applications, keys and findings. Lumen, for example Lumen API in production, uses gait-sdk and a connection key to report security checks to that workspace. In early access, Lumen's own users sign in with Gait, and Lumen decides what they can access.";

// HOW_IT_WORKS.md, "Step by step", steps 1-4. Step 5 (acting on findings in
// the console) waits on the Findings screen and is listed under status below.
const HOW_IT_WORKS_STEPS = [
  {
    title: "I sign in",
    body: "to the Gait console with two-step sign-in and work inside the app's workspace. Each person in a workspace has a role: Owner, Admin or Member.",
  },
  {
    title: "I register each app, per environment.",
    body: "Lumen API in local and Lumen API in production are two applications, each with its own connection key.",
  },
  {
    title: "My apps report security checks.",
    body: "Lumen runs its own checks (for example \"debug mode is off\") and sends PASS or FAIL to Gait with gait-sdk. The connection key tells Gait which application, and so which workspace, the report belongs to.",
  },
  {
    title: "Gait keeps score.",
    body: "Every report is stored as evidence. A FAIL opens a finding for that application; a later PASS closes it. Each environment has its own picture, so a problem in local never muddies production.",
  },
];

// WHAT_GAIT_IS.md, "What it does". The status column is never written here:
// it comes from FEATURE_STATUS through StatusCell.
const WHAT_YOU_GET = [
  {
    feature: "Hardened sign-in",
    description:
      "Cookie sessions, refresh tokens that rotate on every use with replay detection, and two-step sign-in with one-time recovery codes.",
    features: ["twoStepVerification"],
  },
  {
    feature: "A private workspace per app",
    description:
      "Each app's people, applications, keys and findings live in its own workspace, and nobody outside that workspace can see any of it.",
    features: ["core"],
  },
  {
    feature: "Security checks from my apps",
    description:
      "Lumen reports its own security checks to Gait using gait-sdk and a connection key. Gait keeps the history and tracks what's healthy and what isn't.",
    features: ["core"],
  },
  {
    feature: "Findings",
    description: "When a check fails, Gait opens a finding for that application. It closes when a later check passes.",
    features: ["core"],
  },
  {
    feature: "Acting on findings in the console",
    description: "Acknowledge a finding, or accept the risk with a written reason.",
    features: ["findingsScreen"],
  },
  {
    feature: "Members and invites",
    description: "Invite people into a workspace as Owner, Admin or Member.",
    features: ["membersAndInviteAccept", "emailVerification"],
  },
  {
    feature: "Sign-in for Lumen",
    description:
      "Lumen's users sign in with Gait accounts, verified with gait-sdk, while Lumen keeps its own organizations and roles.",
    features: ["productSignIn"],
  },
];

// AUTOMATED_SECURITY_RESPONSE.md, "The guarantees" (lines 31-41).
const GAIT_GUARANTEES = [
  {
    title: "A person approves every deployment.",
    body: "A fix can't reach production without an administrator approving that exact fix. Each approval works once, for one change, and expires.",
  },
  {
    title: "Fixes are checked by something other than what wrote them.",
    body: "A separate step reproduces the problem, confirms the fix resolves it, checks that it only changed what it said it would, and runs the tests.",
  },
  {
    title: "Every fix starts isolated.",
    body: "Fixes are prepared in a separate copy of the code and never touch the live service until approved.",
  },
  {
    title: "\"Deployed\" doesn't mean \"fixed\".",
    body: "A problem only counts as resolved when fresh checks show it's healthy again.",
  },
  {
    title: "Everything is recorded.",
    body: "Each step leaves an audit trail.",
  },
];

function HomePage() {
  const { isLoggedIn, message, user, setError } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  // OPS1: only the server's is_gait_operator flag; no is_staff fallback.
  const canViewSecurity = isGaitOperator(user);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home-page product-home">
      <header className="site-header product-header">
        <a className="brand" href="#product" aria-label="Gait home">
          <GateMark />
          <span>Gait</span>
        </a>
        <button
          type="button"
          className="home-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="home-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <RiCloseLine aria-hidden="true" /> : <RiMenuLine aria-hidden="true" />}
          <span>Menu</span>
        </button>
        <nav
          id="home-nav"
          className={`site-nav product-nav home-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Product navigation"
          onClick={(event) => {
            if (event.target.closest("a")) closeMenu();
          }}
        >
          <a href="#how-it-works">How it works</a>
          <Link to="/docs">Docs</Link>
          {isLoggedIn && (
            <Link to="/console" className="nav-cta secondary">Console</Link>
          )}
          {isLoggedIn && canViewSecurity && (
            <Link to="/security-command" className="nav-cta secondary">
              Security Command
            </Link>
          )}
          {/* Signed in: the same account menu as the console (Account, with the
              "2FA off" flag; Docs; Sign out, which leaves you on this page). */}
          {isLoggedIn ? <AccountMenu afterSignOut={null} /> : <Link to="/login" className="nav-cta">Login</Link>}
        </nav>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="hero product-hero" id="product">
          <div className="hero-content product-hero-content">
            <div className="hero-copy">
              <h1 className="display-serif">The security system behind my apps.</h1>
              <p className="hero-subtitle">
                Gait is the internal security system I built to protect my own applications. It guards Lumen and
                itself: hardened sign-in, isolated data, apps that report their own security checks, and AI agents
                that prepare fixes that never ship without my approval.
              </p>
              {message && <p className="session-message">{message}</p>}
              <div className="hero-actions">
                <Link to={docPath("how-it-works")} className="btn-pill btn-pill-primary">
                  How it works <RiArrowRightLine />
                </Link>
                {isLoggedIn && (
                  <Link to="/console" className="btn-pill btn-pill-outline">Open console</Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. How it works */}
        <section className="section" id="how-it-works" aria-labelledby="how-it-works-title">
          <p className="eyebrow">How it works</p>
          <h2 id="how-it-works-title">My apps report. Gait keeps score.</h2>
          <div className="home-split">
            <ol className="home-steps">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="home-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <p>
                    <strong>{step.title}</strong> {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <Diagram source={BIG_PICTURE} description={BIG_PICTURE_DESCRIPTION} />
          </div>
          <p className="section-note home-note">
            <strong>Self-reported vs Gait-verified.</strong> Checks an app reports about itself are labelled
            self-reported. Checks Gait ran or confirmed itself are labelled Gait-verified. Both count, and the console
            always shows which is which, so it's clear how much weight a result carries.
          </p>
          <Link to={docPath("how-it-works")} className="home-text-link">
            How it works, in the docs <RiArrowRightLine aria-hidden="true" />
          </Link>
        </section>

        {/* 3. What's live, what's coming */}
        <section className="section" id="status" aria-labelledby="status-title">
          <p className="eyebrow">What it does</p>
          <h2 id="status-title">What's live, what's coming.</h2>
          <ul className="home-status-list" aria-label="What's live, what's coming">
            {WHAT_YOU_GET.map((row) => (
              <li key={row.feature} className="home-status-row" data-feature={row.feature}>
                <div>
                  <h3>{row.feature}</h3>
                  <p>{row.description}</p>
                </div>
                <StatusCell features={row.features} />
              </li>
            ))}
          </ul>
          <p className="home-planned">AI investigation and fixes for Lumen: planned.</p>
          <p className="section-note home-muted">Status as of {statusAsOfLabel()}.</p>
        </section>

        {/* 4. Isolation and trust */}
        <section className="section" id="isolation" aria-labelledby="isolation-title">
          <p className="eyebrow">Isolation and trust</p>
          <h2 id="isolation-title">Private by default. Read-only by design.</h2>
          <div className="home-card-grid">
            <div className="home-card">
              <h3>Workspaces can't see each other.</h3>
              <p>
                An app's people, applications and findings belong to its workspace alone. To anyone outside it, the
                workspace doesn't exist: Gait answers 404, the same answer as for a workspace that doesn't exist.
              </p>
            </div>
            <div className="home-card">
              <h3>A connection key can only report checks.</h3>
              <p>
                It reports checks for its own application. It can't sign in, invite anyone or read anything.
              </p>
            </div>
            <div className="home-card">
              <h3>Gait never reaches into Lumen.</h3>
              <p>Gait is not a remote control for my apps. It never changes Lumen's code, servers or data; it only records the checks Lumen reports.</p>
            </div>
          </div>
          <Link to={docPath("isolation")} className="home-text-link">
            Isolation and setup <RiArrowRightLine aria-hidden="true" />
          </Link>
        </section>

        {/* 5. Developers */}
        <section className="section" id="developers" aria-labelledby="developers-title">
          <p className="eyebrow">For developers</p>
          <h2 id="developers-title">Install gait-sdk. Report a check.</h2>
          <div className="home-code">
            <CodeBlock code={INSTALL} label="Install" />
            <CodeBlock code={REPORT} label="Report a security check" />
          </div>
          <div className="home-card home-card--inline">
            <h3>
              Sign-in for Lumen <StatusBadge feature="productSignIn" />
            </h3>
            <p>
              gait-sdk also verifies Gait sign-in tokens inside Lumen's API, so Lumen's users sign in with Gait
              accounts while Lumen keeps its own organizations and roles. gait-sdk is public and open source (MIT,
              on PyPI).
            </p>
          </div>
          <div className="hero-actions">
            <Link to={docPath("connecting-your-software")} className="btn-pill btn-pill-secondary">
              <RiBookOpenLine /> Connecting an app
            </Link>
            <Link to={docPath("gait-sdk")} className="btn-pill btn-pill-ghost">
              <RiTerminalBoxLine /> gait-sdk docs
            </Link>
          </div>
        </section>

        {/* 6. How Gait protects itself */}
        <section className="section" id="gait-itself" aria-labelledby="gait-itself-title">
          <p className="eyebrow">How Gait protects itself</p>
          <h2 id="gait-itself-title">Six AI agents and a person look after Gait's own platform.</h2>
          <p className="section-lede">
            Gait uses AI agents to investigate problems in its own platform, test them and prepare fixes, inside fixed
            boundaries. An independent validator checks every fix, and I approve every production change. The agents
            run on Gait's own platform, never on Lumen: they don't investigate, change or deploy it. Automated
            deployment is off by default.
          </p>
          <AgentFleetDiagram />
          <p className="section-note">
            <strong>Security Copilot</strong> explains what the agents found in plain language. It sits outside the
            chain and can't act on anything.
          </p>
          <ul className="home-guarantees" aria-label="Guarantees">
            {GAIT_GUARANTEES.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong> {item.body}
              </li>
            ))}
          </ul>
          <Link to={docPath("automated-security-response")} className="home-text-link">
            Automated security response <RiArrowRightLine aria-hidden="true" />
          </Link>
        </section>

        {/* 7. Origin */}
        <section className="section home-origin" aria-label="Origin">
          <p>Built first to secure Lumen, my clinical app. Today it protects Lumen and Gait itself.</p>
        </section>

        {/* 8. Closing: where to read more */}
        <section className="section final-cta" aria-labelledby="final-cta-title">
          <RiShieldCheckLine />
          <h2 id="final-cta-title">See how it fits together.</h2>
          <p className="section-lede">
            The docs show how I add an app, how findings open and close, and how Gait looks after itself.
          </p>
          <div className="hero-actions">
            <Link to={docPath("how-it-works")} className="btn-pill btn-pill-primary">
              How it works <RiArrowRightLine />
            </Link>
          </div>
          <p className="section-note">
            Questions about Gait? <Link to="/send-email">Contact me</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
