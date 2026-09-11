import React from "react";
import { RiFileShieldLine, RiDatabase2Line, RiCpuLine, RiFlagLine, RiFlowChart, RiRobotLine } from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector } from "../../diagrams/DiagramPrimitives";

export function SecurityTruthDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 5 — Security truth"
      title="Agents don't decide whether Gait is secure."
      subtitle="Posture comes from trusted evidence, evaluated deterministically — not from what a model believes."
    >
      <div className="diagram-column security-truth-flow">
        <DiagramNode variant="truth" icon={RiFileShieldLine} title="SecurityControl" size="sm" />
        <FlowConnector direction="down" />
        <DiagramNode variant="truth" icon={RiDatabase2Line} title="Trusted Evidence" size="sm" />
        <FlowConnector direction="down" />
        <DiagramNode variant="deterministic" icon={RiCpuLine} title="Deterministic Evaluation" size="sm" />
        <FlowConnector direction="down" />
        <div className="diagram-branch-row security-truth-outcomes">
          <span className="outcome-pill outcome-pill--healthy">HEALTHY</span>
          <span className="outcome-pill outcome-pill--warning">NEEDS ATTENTION</span>
          <span className="outcome-pill outcome-pill--danger">CONTROL FAILURE</span>
        </div>
        <FlowConnector direction="down" label="on failure" />
        <DiagramNode variant="truth" icon={RiFlagLine} title="SecurityFinding" size="sm" />
        <FlowConnector direction="down" />
        <DiagramNode variant="deterministic" icon={RiFlowChart} title="Incident Commander" size="sm" />
      </div>

      <div className="truth-vs-opinion">
        <DiagramNode variant="ai" icon={RiRobotLine} title="Agent Opinion" description="What a specialist believes happened." />
        <span className="truth-vs-opinion-sign" aria-hidden="true">≠</span>
        <DiagramNode variant="truth" icon={RiDatabase2Line} title="Security Truth" description="What trusted evidence actually shows." />
      </div>
      <p className="section-note">The model may believe something is fixed. Gait requires evidence.</p>
    </DiagramFrame>
  );
}
