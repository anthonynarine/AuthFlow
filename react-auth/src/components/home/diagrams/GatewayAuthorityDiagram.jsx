import React from "react";
import { RiRobotLine, RiRouterLine } from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector } from "../../diagrams/DiagramPrimitives";

const gatewayChecks = [
  "Global kill switch?",
  "Principal active?",
  "Capability granted?",
  "Environment allowed?",
  "Authority allowed?",
  "Tool allowlisted?",
  "Data classification allowed?",
  "Budget available?",
  "Human Approver required?",
];

const authorityLevels = [
  ["L0", "Observe"],
  ["L1", "Safe Test"],
  ["L2", "Attack Staging"],
  ["L3", "Propose"],
  ["L4", "Remediation Staging"],
  ["L5", "Production Deploy"],
  ["L6", "Security Policy Change"],
];

export function GatewayAuthorityDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 7 — Deterministic agent governance"
      title="Every agent action passes through one control point."
      subtitle="These are authorization levels, not intelligence levels. A specialist's authority is fixed by its role, not by how capable the model feels."
    >
      <div className="diagram-column gateway-flow">
        <DiagramNode variant="ai" icon={RiRobotLine} title="AI Proposal" description="A specialist proposes an action." />
        <FlowConnector direction="down" />
        <DiagramNode variant="deterministic" icon={RiRouterLine} title="Gateway" description="Deterministic software evaluates the proposal." />
        <div className="gateway-checklist">
          {gatewayChecks.map((check) => (
            <span key={check}>{check}</span>
          ))}
        </div>
        <FlowConnector direction="down" />
        <div className="diagram-branch-row gateway-outcomes">
          <span className="outcome-pill outcome-pill--healthy">ALLOW</span>
          <span className="outcome-pill outcome-pill--danger">DENY</span>
        </div>
      </div>

      <div className="authority-ladder">
        {authorityLevels.map(([level, label]) => (
          <div className={`authority-ladder-row ${level === "L6" ? "is-disabled" : ""}`} key={level}>
            <span className="authority-ladder-level">{level}</span>
            <span className="authority-ladder-label">{label}</span>
            {level === "L6" && <span className="capability-tag capability-tag--neutral">Not enabled</span>}
          </div>
        ))}
      </div>
      <p className="section-note">L6 autonomous security-policy mutation is not enabled.</p>
    </DiagramFrame>
  );
}
