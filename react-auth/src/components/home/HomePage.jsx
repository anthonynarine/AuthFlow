import React, { useEffect, useState } from "react";
import "./Home.css";
import "./diagrams/homeDiagrams.css";
import "../../docs/docs.css";
import { Link } from "react-router-dom";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import {
  RiArrowRightLine,
  RiBookOpenLine,
  RiCloseLine,
  RiMenuLine,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
  RiTerminalBoxLine,
} from "react-icons/ri";
import { AgentFleetDiagram } from "./diagrams/AgentFleetDiagram";
import { Diagram } from "../../docs/components/Diagram";
import { StatusCell } from "../../docs/components/StatusCell";
import { CodeBlock, StatusBadge } from "../../docs/components/DocPrimitives";
import { statusAsOfLabel } from "../../docs/featureStatus";
import { docPath } from "../../docs/manifest";
import { INSTALL, REPORT } from "../../docs/content/snippets";

/*
 * Every customer-facing claim on this page comes from the public docs in the
 * Gait repo (docs/public/WHAT_GAIT_IS.md, HOW_IT_WORKS.md,
 * AUTOMATED_SECURITY_RESPONSE.md) or from src/docs/featureStatus.js. Change
 * those first; don't add claims here that they don't make.
 */

// The same drawing as the "How it works" docs page (HOW_IT_WORKS.md, "The big
// picture"), top to bottom so it stays readable in a narrow column.
const BIG_PICTURE = `flowchart TB
    classDef people fill:#123029,stroke:#1abc9c,color:#e8eaed,stroke-width:2px
    classDef gait fill:#1b2129,stroke:#38bdf8,color:#e8eaed,stroke-width:2px
    classDef soft fill:#2a2340,stroke:#a78bfa,color:#e8eaed,stroke-width:2px
    classDef users fill:#3a2016,stroke:#fb8a5c,color:#e8eaed,stroke-width:2px

    TEAM["Your team<br/>Owner · Admin · Member"]:::people
    subgraph GAIT["Gait"]
        CO["Company: Acme<br/>applications · keys · findings"]:::gait
    end
    APP["Your software<br/>Acme API · production<br/>gait-sdk + connection key"]:::soft
    USERS["Your product's users<br/>(optional, early access)"]:::users

    TEAM -- "sign in to the console" --> CO
    APP -- "reports security checks" --> CO
    USERS -. "sign in with Gait;<br/>your product decides access" .-> APP`;

const BIG_PICTURE_DESCRIPTION =
  "Your team (Owner, Admin, Member) signs in to the console and works in the company Acme inside Gait, which holds applications, keys and findings. Your software, such as Acme API in production, uses the gait-sdk and a connection key to report security checks to that company. Optionally, in early access, your product's own users sign in with Gait, and your product decides what they can access.";

// HOW_IT_WORKS.md, "Step by step", steps 1-4. Step 5 (acting on findings in
// the console) waits on the Findings screen and is listed under status below.
const HOW_IT_WORKS_STEPS = [
  {
    title: "Your team signs in",
    body: "to the Gait console and works inside your company. Each person has a role: Owner, Admin or Member.",
  },
  {
    title: "You register each piece of software, per environment.",
    body: "Acme API in local and Acme API in production are two applications, each with its own connection key.",
  },
  {
    title: "Your software reports security checks.",
    body: "It runs its own checks (for example \"debug mode is off\") and sends PASS or FAIL to Gait with the gait-sdk. The connection key tells Gait which application, and so which company, the report belongs to.",
  },
  {
    title: "Gait keeps score.",
    body: "Every report is stored as evidence. A FAIL opens a finding for that application; a later PASS closes it. Each environment has its own picture, so a problem in local never muddies production.",
  },
];

// WHAT_GAIT_IS.md, "What you get". The status column is never written here:
// it comes from FEATURE_STATUS through StatusCell.
const WHAT_YOU_GET = [
  {
    feature: "A private company space",
    description:
      "Your team's own area in the Gait console. Your people, applications, keys and findings live there, and nobody outside your company can see any of it.",
    features: ["core"],
  },
  {
    feature: "Security checks from your software",
    description:
      "Your application reports its own security checks to Gait using the gait-sdk and a connection key. Gait keeps the history and tracks what's healthy and what isn't.",
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
    feature: "Your team",
    description: "Invite teammates as Owner, Admin or Member.",
    features: ["membersAndInviteAccept", "emailVerification"],
  },
  {
    feature: "Sign-in for your own product",
    description:
      "Your product can let its users sign in with Gait accounts and verify them with the gait-sdk, while your product keeps its own organizations and roles.",
    features: ["productSignIn"],
  },
];

// AUTOMATED_SECURITY_RESPONSE.md, "The guarantees" (the first four).
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
];

function formatCurrentUser(user) {
  if (!user) {
    return "";
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email || user.username || "Signed-in user";
}

function HomePage() {
  const { logout, isLoggedIn, message, user, setError } = useBasicAuthServices();
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

  const hasSecurityCapability = user
    ? Object.prototype.hasOwnProperty.call(user, "can_view_security_dashboard")
    : false;
  const canViewSecurity = hasSecurityCapability
    ? Boolean(user.can_view_security_dashboard)
    : Boolean(user?.is_staff);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home-page product-home">
      <header className="site-header product-header">
        <a className="brand" href="#product" aria-label="Gait home">
          <RiShieldKeyholeLine />
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
          <Link to="/developers">Developers</Link>
          {!isLoggedIn && (
            <Link to="/early-access" className="nav-cta secondary">Early access</Link>
          )}
          {isLoggedIn && user && (
            <span className="signed-in-chip" title={`Signed in as ${formatCurrentUser(user)}`}>
              {formatCurrentUser(user)}
            </span>
          )}
          {isLoggedIn && (
            <Link to="/console" className="nav-cta secondary">Console</Link>
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
              <h1 className="display-serif">See the security of every app you ship, in one private place.</h1>
              <p className="hero-subtitle">
                Your software reports its own security checks with gait-sdk. Gait keeps the history, opens a finding
                when a check fails and closes it when a later check passes, per app and per environment, isolated to
                your company.
              </p>
              {message && <p className="session-message">{message}</p>}
              <div className="hero-actions">
                <Link to={docPath("quickstart")} className="btn-pill btn-pill-primary">
                  Read the Quickstart <RiArrowRightLine />
                </Link>
                <Link to="/early-access" className="btn-pill btn-pill-secondary">Request early access</Link>
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
          <h2 id="how-it-works-title">Your software reports. Gait keeps score.</h2>
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
            <strong>Self-reported vs Gait-verified.</strong> Checks your software reports about itself are labelled
            self-reported. Checks Gait ran or confirmed itself are labelled Gait-verified. Both count, and the console
            always shows which is which, so you know how much weight a result carries.
          </p>
          <Link to={docPath("how-it-works")} className="home-text-link">
            How it works, in the docs <RiArrowRightLine aria-hidden="true" />
          </Link>
        </section>

        {/* 3. What's live, what's coming */}
        <section className="section" id="status" aria-labelledby="status-title">
          <p className="eyebrow">What you get</p>
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
          <p className="home-planned">AI investigation and fixes for your apps: planned.</p>
          <p className="section-note home-muted">Status as of {statusAsOfLabel()}.</p>
        </section>

        {/* 4. Isolation and trust */}
        <section className="section" id="isolation" aria-labelledby="isolation-title">
          <p className="eyebrow">Isolation and trust</p>
          <h2 id="isolation-title">Private by default. Read-only by design.</h2>
          <div className="home-card-grid">
            <div className="home-card">
              <h3>Other companies can't see you.</h3>
              <p>
                Your people, applications and findings belong to your company alone. To anyone outside it, your
                company doesn't exist: Gait answers 404, the same answer as for a company that doesn't exist.
              </p>
            </div>
            <div className="home-card">
              <h3>A connection key can only report checks.</h3>
              <p>
                It reports checks for its own application. It can't sign in, invite anyone or read anything.
              </p>
            </div>
            <div className="home-card">
              <h3>Gait never changes your code, servers or data.</h3>
              <p>Gait is not a remote control for your software. It only records the checks your software reports.</p>
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
              Sign-in for your own product <StatusBadge feature="productSignIn" />
            </h3>
            <p>
              gait-sdk can also verify Gait sign-in tokens inside your own API, so your product's users can sign in
              with Gait accounts while your product keeps its own organizations and roles.
            </p>
          </div>
          <div className="hero-actions">
            <Link to={docPath("connecting-your-software")} className="btn-pill btn-pill-secondary">
              <RiBookOpenLine /> Connecting your software
            </Link>
            <Link to="/developers" className="btn-pill btn-pill-ghost">
              <RiTerminalBoxLine /> Developer guide
            </Link>
          </div>
        </section>

        {/* 6. How we protect Gait itself */}
        <section className="section" id="gait-itself" aria-labelledby="gait-itself-title">
          <p className="eyebrow">How we protect Gait itself</p>
          <h2 id="gait-itself-title">Six AI agents and a person look after Gait's own platform.</h2>
          <p className="section-lede">
            Gait uses automated agents to investigate problems in its own platform, test them and prepare fixes.
            They run on Gait's own platform, never on your software: they don't investigate, change or deploy it.
            Automated deployment is off by default.
          </p>
          <AgentFleetDiagram />
          <p className="section-note">
            <strong>Security Copilot</strong> explains what the team found in plain language. It sits outside the
            chain and can't act on anything.
          </p>
          <ul className="home-guarantees">
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
          <p>Built first to secure Lumen, our healthcare reporting app.</p>
        </section>

        {/* 8. Closing call to action */}
        <section className="section final-cta" aria-labelledby="final-cta-title">
          <RiShieldCheckLine />
          <h2 id="final-cta-title">Connect your first app in about 15 minutes.</h2>
          <p className="section-lede">
            Create your company, register an application, get its connection key and send your first security check.
          </p>
          <div className="hero-actions">
            <Link to={docPath("quickstart")} className="btn-pill btn-pill-primary">
              Read the Quickstart <RiArrowRightLine />
            </Link>
            <Link to="/early-access" className="btn-pill btn-pill-secondary">Request early access</Link>
          </div>
          <p className="section-note">
            Partnership or licensing questions? <Link to="/send-email">Contact us directly</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
