import React from "react";
import { Link } from "react-router-dom";
import { RiArrowGoBackLine, RiShieldKeyholeLine } from "react-icons/ri";
import "./Home.css";
import "./diagrams/homeDiagrams.css";
import { EvolutionTimelineDiagram } from "./diagrams/EvolutionTimelineDiagram";
import { ArchitectureLayersDiagram } from "./diagrams/ArchitectureLayersDiagram";
import { SecurityLoopDiagram } from "./diagrams/SecurityLoopDiagram";
import { SecurityTruthDiagram } from "./diagrams/SecurityTruthDiagram";
import { GatewayAuthorityDiagram } from "./diagrams/GatewayAuthorityDiagram";
import { ExactArtifactDiagram } from "./diagrams/ExactArtifactDiagram";
import { TodayFutureDiagram } from "./diagrams/TodayFutureDiagram";
import { CapabilityTag } from "../diagrams/DiagramPrimitives";

const roadmapColumns = [
  {
    status: "built",
    heading: "Current",
    items: [
      "Security enforcement",
      "Security Observatory",
      "Security agent fleet",
      "Security Copilot",
      "Approval and deployment governance",
      "Staging-proven deployment pipeline",
    ],
  },
  {
    status: "next",
    heading: "Next",
    items: [
      "Human Approver UX",
      "Expanded Security Command workflows",
      "Live workflow notifications",
      "Richer Copilot explanations",
    ],
  },
  {
    status: "future",
    heading: "Future",
    items: [
      "Dependency monitoring",
      "Configuration drift detection",
      "Reliability / SRE monitoring",
      "Backup / restore assurance",
      "Healthcare-focused controls",
      "Possible future extraction into a broader Gait Security platform",
    ],
  },
];

/**
 * The deep-dive technical narrative moved off the homepage: how Gait
 * evolved, its layered architecture, the self-repair loop, security truth,
 * deterministic agent governance, exact-artifact deployment, the roadmap,
 * and the current-vs-future platform direction. The homepage keeps only
 * the hero, what Gait protects, and the agent fleet -- this page is where
 * a visitor who wants the full story goes next.
 */
function GaitArchitecturePage() {
  return (
    <div className="home-page product-home">
      <header className="site-header product-header">
        <Link className="brand" to="/" aria-label="Gait home">
          <RiShieldKeyholeLine />
          <span>Gait</span>
        </Link>
        <nav className="site-nav product-nav" aria-label="Architecture page navigation">
          <Link to="/" className="nav-cta secondary">
            <RiArrowGoBackLine /> Back to Gait
          </Link>
        </nav>
      </header>

      <main>
        <section className="section architecture-intro-section">
          <p className="eyebrow">Full architecture</p>
          <h1>How Gait actually works, end to end.</h1>
          <p className="section-lede">
            The deeper technical story behind Gait: how it evolved, how authority is structured, how evidence
            becomes trusted truth, and how a repair reaches production without ever handing an AI agent the keys.
          </p>
        </section>

        <section className="section evolution-section" id="evolution">
          <p className="eyebrow">How Gait evolved</p>
          <h2>From authentication to a security operating system.</h2>
          <p className="section-lede">
            Gait began as a hardened authentication system for Lumen. Each phase below added a real, working
            capability on top of the last.
          </p>
          <EvolutionTimelineDiagram />
        </section>

        <section className="section architecture-section" id="architecture-layers">
          <p className="eyebrow">Architecture</p>
          <h2>Gait does not trust the AI with security authority.</h2>
          <p className="section-lede">
            We use AI agents. We don't trust AI agents. AI provides intelligence. Deterministic software provides
            authority.
          </p>
          <ArchitectureLayersDiagram />
        </section>

        <section className="section lifecycle-section" id="lifecycle">
          <p className="eyebrow">How Gait works</p>
          <h2>From control failure to verified repair.</h2>
          <p className="section-lede">
            Every response follows the same loop, without ever handing the model production authority.
          </p>
          <SecurityLoopDiagram />
        </section>

        <section className="section truth-section" id="security-truth">
          <p className="eyebrow">Security truth</p>
          <h2>Trusted evidence decides posture, not agent opinion.</h2>
          <SecurityTruthDiagram />
        </section>

        <section className="section gateway-section" id="gateway">
          <p className="eyebrow">Deterministic agent governance</p>
          <h2>Give the agent the capability to perform the task, not possession of the infrastructure.</h2>
          <GatewayAuthorityDiagram />
        </section>

        <section className="section artifact-section" id="deployment">
          <p className="eyebrow">Governed deployment</p>
          <h2>Approve the code you reviewed, not whatever happens to be on the branch.</h2>
          <ExactArtifactDiagram />
        </section>

        <section className="section roadmap-section" id="roadmap">
          <p className="eyebrow">Current roadmap</p>
          <h2>Built capabilities, labeled separately from planned work.</h2>
          <div className="roadmap-columns">
            {roadmapColumns.map((column) => (
              <div className="roadmap-column" key={column.heading}>
                <div className="roadmap-column-header">
                  <h3>{column.heading}</h3>
                  <CapabilityTag status={column.status} />
                </div>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section future-section" id="future">
          <p className="eyebrow">Future platform direction</p>
          <h2>Today: our internal system. Future: possibly a platform.</h2>
          <TodayFutureDiagram />
        </section>

        <section className="section final-cta">
          <RiShieldKeyholeLine />
          <h2>That's the whole loop.</h2>
          <p>
            Hardened enforcement, continuous observability, constrained agents, independent validation, and
            Human Approver-controlled deployment, working together as one system.
          </p>
          <div className="hero-actions">
            <Link to="/" className="btn-pill btn-pill-primary">
              <RiArrowGoBackLine /> Back to Gait
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default GaitArchitecturePage;
