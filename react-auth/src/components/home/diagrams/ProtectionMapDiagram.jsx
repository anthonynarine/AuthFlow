import React from "react";
import { RiShieldKeyholeLine, RiStethoscopeLine, RiKey2Line, RiApps2Line } from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector, DiagramLegend } from "../../diagrams/DiagramPrimitives";

const protectedSystems = [
  {
    icon: RiStethoscopeLine,
    eyebrow: "First protected application",
    title: "Lumen",
    description: "Vascular ultrasound reporting platform used by clinicians and technologists.",
  },
  {
    icon: RiKey2Line,
    eyebrow: "Identity foundation",
    title: "Gait Identity",
    description: "The authentication and session layer Gait itself is built on.",
  },
  {
    icon: RiApps2Line,
    eyebrow: "Additional company systems",
    title: "Future services",
    description: "Other internal applications the company builds, as they come online.",
  },
];

export function ProtectionMapDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 1 — Protection map"
      title="Gait is not Lumen. Gait protects Lumen."
      subtitle="Gait sits above the systems it protects as a security layer, not inside any one of them."
      footnote="Lumen is Gait's first protected application, not its only one."
    >
      <div className="diagram-column protection-map">
        <DiagramNode
          variant="deterministic"
          size="lg"
          icon={RiShieldKeyholeLine}
          eyebrow="Company security system"
          title="Gait"
          description="Security enforcement, observability, and governed operations for everything it protects."
          className="protection-map-gait"
        />
        <FlowConnector direction="down" label="protects" />
        <div className="diagram-branch-row protection-map-targets">
          {protectedSystems.map((system) => (
            <DiagramNode key={system.title} variant="protected" {...system} />
          ))}
        </div>
      </div>
      <DiagramLegend
        items={[
          { variant: "deterministic", label: "Gait (security system)" },
          { variant: "protected", label: "Protected application" },
        ]}
      />
    </DiagramFrame>
  );
}
