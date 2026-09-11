import React from "react";
import { DiagramFrame, CapabilityTag } from "../../diagrams/DiagramPrimitives";

const todayStack = ["Security Command", "Incident Commander", "Agent Fleet", "Gateway", "Security Truth", "Security Enforcement"];
const todayTargets = ["Lumen", "Identity", "Services"];

const futureStack = ["Hosted Control Plane", "Incident Commander", "Agent Fleet", "Gateway", "Security Truth", "Connectors"];
const futureTargets = ["Customer A", "Customer B", "Customer C"];

function MiniStack({ variant, title, stack, targets, targetLabel }) {
  return (
    <div className={`today-future-column today-future-column--${variant}`}>
      <div className="today-future-column-header">
        <span>{title}</span>
        <CapabilityTag status={variant === "today" ? "built" : "future"} />
      </div>
      <div className="today-future-stack">
        {stack.map((item) => (
          <div className="today-future-node" key={item}>{item}</div>
        ))}
      </div>
      <div className="today-future-targets">
        {targets.map((target) => (
          <span key={target} className="today-future-target">{target}</span>
        ))}
      </div>
      <p className="today-future-target-label">{targetLabel}</p>
    </div>
  );
}

export function TodayFutureDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 9 — Current vs. future"
      title="Today: our internal system. Future: possibly a platform."
      subtitle="The future SaaS is expected to extract Gait's reusable observability and constrained-agent architecture — not simply expose our internal authentication service to customers."
    >
      <div className="today-future-grid">
        <MiniStack variant="today" title="Gait Internal" stack={todayStack} targets={todayTargets} targetLabel="Protects our applications" />
        <MiniStack variant="future" title="Gait Security" stack={futureStack} targets={futureTargets} targetLabel="Would protect customer applications" />
      </div>
    </DiagramFrame>
  );
}
