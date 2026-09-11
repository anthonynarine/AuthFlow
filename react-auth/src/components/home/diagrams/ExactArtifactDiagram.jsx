import React from "react";
import {
  RiToolsLine,
  RiShieldCheckLine,
  RiUserLine,
  RiLockLine,
  RiRocketLine,
  RiArchiveLine,
  RiCheckDoubleLine,
  RiEyeLine,
} from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector } from "../../diagrams/DiagramPrimitives";

const goodPath = [
  { icon: RiToolsLine, variant: "ai", title: "Green Team creates commit A" },
  { icon: RiShieldCheckLine, variant: "ai", title: "Security Validator validates A" },
  { icon: RiUserLine, variant: "human", title: "Human Approver approves A" },
  { icon: RiLockLine, variant: "deterministic", title: "Approval bound to A" },
  { icon: RiRocketLine, variant: "ai", title: "Release Engineer receives A" },
  { icon: RiArchiveLine, variant: "deterministic", title: "Provider packages A" },
  { icon: RiCheckDoubleLine, variant: "protected", title: "A is deployed" },
  { icon: RiEyeLine, variant: "truth", title: "Gait verifies security evidence" },
];

export function ExactArtifactDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 8 — Exact-artifact deployment"
      title="Approve the code you reviewed, not whatever is on the branch."
      subtitle="A branch can move after it's approved. Gait binds approval to one immutable commit instead."
    >
      <div className="diagram-row artifact-compare">
        <div className="diagram-column artifact-path">
          <p className="artifact-path-label artifact-path-label--good">Gait's deployment path</p>
          {goodPath.map((step, index) => (
            <React.Fragment key={step.title}>
              <DiagramNode variant={step.variant} icon={step.icon} title={step.title} size="sm" />
              {index < goodPath.length - 1 && <FlowConnector direction="down" />}
            </React.Fragment>
          ))}
        </div>

        <div className="diagram-column artifact-path artifact-path--anti">
          <p className="artifact-path-label artifact-path-label--bad">The branch problem</p>
          <DiagramNode variant="warning" title="Approve branch" size="sm" />
          <FlowConnector direction="down" />
          <DiagramNode variant="warning" title="Branch changes" size="sm" />
          <FlowConnector direction="down" />
          <DiagramNode variant="warning" title="Deploy something different" size="sm" />
        </div>
      </div>
      <p className="artifact-callout">Validated A. Approved A. Deploy A. Never B.</p>
    </DiagramFrame>
  );
}
