import React from "react";
import {
  RiUserLine,
  RiChat3Line,
  RiFlowChart,
  RiSearchEyeLine,
  RiSwordLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiRouterLine,
  RiDatabase2Line,
  RiLockPasswordLine,
  RiStethoscopeLine,
} from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector, CapabilityTag, DiagramLegend } from "../../diagrams/DiagramPrimitives";

function LayerBand({ variant, eyebrow, title, children }) {
  return (
    <div className={`arch-layer arch-layer--${variant}`}>
      <div className="arch-layer-label">
        <span className="arch-layer-eyebrow">{eyebrow}</span>
        <h4>{title}</h4>
      </div>
      <div className="arch-layer-content">{children}</div>
    </div>
  );
}

function ChipRow({ items }) {
  return (
    <div className="arch-chip-row">
      {items.map((item) => (
        <span key={item} className="arch-chip">{item}</span>
      ))}
    </div>
  );
}

export function ArchitectureLayersDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 3 — Full architecture"
      title="One security operating system, seven layers."
      subtitle="AI reasoning stays inside deterministic boundaries. It never sits at the bottom controlling production — Human Approvers and code do."
      className="architecture-diagram-frame"
    >
      <div className="arch-stack">
        <LayerBand variant="human" eyebrow="Human Approver + AI interface" title="Security Command">
          <div className="diagram-branch-row">
            <DiagramNode variant="human" icon={RiUserLine} title="Human Approver" description="Reviews posture, approves consequential actions." />
            <DiagramNode variant="ai" icon={RiChat3Line} title="Security Copilot" description="Natural-language interface for asking what's happening." tag={<CapabilityTag status="next" />} />
          </div>
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="deterministic" eyebrow="Deterministic control" title="Incident Commander">
          <DiagramNode variant="deterministic" icon={RiFlowChart} title="Workflow coordination" description="Decides which specialist acts next. Inherits no specialist authority itself." />
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="ai" eyebrow="AI reasoning" title="Security Fleet">
          <div className="diagram-branch-row">
            <DiagramNode variant="ai" size="sm" icon={RiSearchEyeLine} title="Blue Team" />
            <DiagramNode variant="ai" size="sm" icon={RiSwordLine} title="Red Team" />
            <DiagramNode variant="ai" size="sm" icon={RiToolsLine} title="Green Team" />
            <DiagramNode variant="ai" size="sm" icon={RiShieldCheckLine} title="Security Validator" />
          </div>
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="deterministic" eyebrow="Deterministic control" title="Gateway">
          <DiagramNode variant="deterministic" icon={RiRouterLine} title="Every action passes through one control point" />
          <ChipRow items={["Identity", "Capability", "L0–L6", "Environment", "Tool allowlist", "Classification", "Budget", "Human Approver"]} />
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="truth" eyebrow="Trusted evidence" title="Security Truth">
          <DiagramNode variant="truth" icon={RiDatabase2Line} title="Posture comes from evidence, not agent opinion" />
          <ChipRow items={["Controls", "Evidence", "Findings", "Security events"]} />
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="enforcement" eyebrow="Enforcement" title="Security Enforcement">
          <DiagramNode variant="enforcement" icon={RiLockPasswordLine} title="The actual protections" />
          <ChipRow items={["Auth", "Sessions", "MFA", "Replay protection", "Authorization"]} />
        </LayerBand>
        <FlowConnector direction="down" />

        <LayerBand variant="protected" eyebrow="What's protected" title="Protected Systems">
          <DiagramNode variant="protected" icon={RiStethoscopeLine} title="Lumen · Gait Identity · Future services" />
        </LayerBand>
      </div>

      <DiagramLegend
        items={[
          { variant: "human", label: "Human Approver authority" },
          { variant: "ai", label: "AI reasoning" },
          { variant: "deterministic", label: "Deterministic control" },
          { variant: "truth", label: "Trusted evidence" },
          { variant: "enforcement", label: "Enforcement" },
          { variant: "protected", label: "Protected systems" },
        ]}
      />
    </DiagramFrame>
  );
}
