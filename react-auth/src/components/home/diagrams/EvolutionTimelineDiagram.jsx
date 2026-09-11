import React from "react";
import { DiagramFrame, FlowConnector, CapabilityTag } from "../../diagrams/DiagramPrimitives";

const evolutionPhases = [
  {
    phase: "Phase 1",
    status: "built",
    title: "Identity",
    items: ["JWT", "Sessions", "MFA", "Replay protection", "Revocation"],
  },
  {
    phase: "Phase 2",
    status: "built",
    title: "Security Observatory",
    items: ["SecurityControl", "SecurityEvidence", "SecurityFinding", "Security posture"],
  },
  {
    phase: "Phase 3",
    status: "built",
    title: "Security Agent Fleet",
    items: ["Incident Commander", "Blue Team", "Red Team", "Green Team", "Security Validator"],
  },
  {
    phase: "Phase 4",
    status: "built",
    title: "Governed Operations",
    items: ["Human Approver", "Exact-artifact deployment", "Post-deploy verification"],
  },
  {
    phase: "Phase 5",
    status: "future",
    title: "Security + SRE",
    items: ["Dependency monitoring", "Configuration drift", "Reliability", "Backup assurance", "Incident response"],
  },
  {
    phase: "Future",
    status: "future",
    title: "Gait Security platform",
    items: ["Reusable control plane", "External applications", "Connectors", "Multi-tenant control plane"],
  },
];

export function EvolutionTimelineDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 2 — How Gait evolved"
      title="From authentication to a security operating system."
      subtitle="Each phase below is either shipped today or clearly marked as future direction — nothing here is blurred together."
    >
      <ol className="evolution-timeline">
        {evolutionPhases.map((step, index) => (
          <li key={step.title} className="evolution-step">
            <div className={`evolution-node evolution-node--${step.status}`}>
              <div className="evolution-node-top">
                <span className="evolution-phase">{step.phase}</span>
                <CapabilityTag status={step.status} />
              </div>
              <h4>{step.title}</h4>
              <ul>
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {index < evolutionPhases.length - 1 && <FlowConnector direction="down" animated={step.status === "built"} />}
          </li>
        ))}
      </ol>
    </DiagramFrame>
  );
}
