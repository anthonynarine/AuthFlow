import React from "react";
import {
  RiFlowChart,
  RiSearchEyeLine,
  RiSwordLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiUserLine,
  RiRocketLine,
} from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector, DiagramLegend } from "../../diagrams/DiagramPrimitives";

const specialists = [
  { icon: RiSearchEyeLine, title: "Blue Team", description: "Understand why." },
  { icon: RiSwordLine, title: "Red Team", description: "Prove whether it breaks." },
  { icon: RiToolsLine, title: "Green Team", description: "Prepare the fix." },
];

export function AgentFleetDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 6 — Agent topology"
      title="Specialized agents. Separate authority."
      subtitle="Incident Commander coordinates but does not become the specialists. Green Team does not validate itself. Security Validator stays independent. Release Engineer cannot choose what it deploys."
    >
      <div className="diagram-column agent-topology">
        <DiagramNode variant="deterministic" icon={RiFlowChart} title="Incident Commander" description="Coordinates workflow state only." />
        <FlowConnector direction="down" label="delegates to" />
        <div className="diagram-branch-row">
          {specialists.map((agent) => (
            <DiagramNode key={agent.title} variant="ai" icon={agent.icon} title={agent.title} description={agent.description} />
          ))}
        </div>
        <FlowConnector direction="down" label="hands off to" />
        <DiagramNode variant="ai" icon={RiShieldCheckLine} title="Security Validator" description="Proves the repair independently." />
        <FlowConnector direction="down" />
        <DiagramNode variant="human" icon={RiUserLine} title="Human Approver" description="Authorizes the exact artifact." />
        <FlowConnector direction="down" />
        <DiagramNode variant="ai" icon={RiRocketLine} title="Release Engineer" description="Releases only approved code." />
      </div>
      <DiagramLegend
        items={[
          { variant: "deterministic", label: "Coordination" },
          { variant: "ai", label: "AI specialist" },
          { variant: "human", label: "Human Approver authority" },
        ]}
      />
    </DiagramFrame>
  );
}
