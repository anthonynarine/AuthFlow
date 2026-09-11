import React from "react";
import {
  RiAlarmWarningLine,
  RiSearchEyeLine,
  RiSwordLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiUserLine,
  RiRocketLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { DiagramFrame, FlowConnector, LoopBackConnector, DiagramLegend } from "../../diagrams/DiagramPrimitives";

const loopSteps = [
  { icon: RiAlarmWarningLine, variant: "truth", title: "Control Failure", actor: "Security Observatory", description: "Detects the failed control." },
  { icon: RiSearchEyeLine, variant: "ai", title: "Diagnose", actor: "Blue Team", description: "Investigates probable root cause." },
  { icon: RiSwordLine, variant: "ai", title: "Reproduce", actor: "Red Team", description: "Safely reproduces the weakness." },
  { icon: RiToolsLine, variant: "ai", title: "Repair", actor: "Green Team", description: "Prepares the scoped fix." },
  { icon: RiShieldCheckLine, variant: "ai", title: "Validate", actor: "Security Validator", description: "Tests the exact repair independently." },
  { icon: RiUserLine, variant: "human", title: "Approve", actor: "Human Approver", description: "Authorizes the exact artifact." },
  { icon: RiRocketLine, variant: "deterministic", title: "Deploy", actor: "Release Engineer", description: "Releases only what was approved." },
  { icon: RiCheckboxCircleLine, variant: "truth", title: "Verify Truth", actor: "Security Truth", description: "Evaluates post-deploy evidence." },
];

export function SecurityLoopDiagram() {
  return (
    <DiagramFrame
      eyebrow="Diagram 4 — Continuous security lifecycle"
      title="Security here is a loop, not a one-time pass."
      subtitle="Verify feeds back into Observe. Gait keeps checking evidence after every deployment, not just before it."
    >
      <div className="security-loop-stack-shell" role="img" aria-label="Gait self-repairing security loop">
        <span className="security-loop-stack-signal" aria-hidden="true" />
        <ol className="security-loop">
          {loopSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="security-loop-step">
                <div className={`security-agent-node security-agent-node--${step.variant}`}>
                  <div className="security-agent-orb">
                    <Icon aria-hidden="true" />
                  </div>
                  <div className="security-agent-copy">
                    <span>{step.title}</span>
                    <strong>{step.actor}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
                {index < loopSteps.length - 1 && <FlowConnector direction="down" />}
              </li>
            );
          })}
        </ol>
        <LoopBackConnector label="Verify reconnects to Observe — security is continuous" />
      </div>
      <DiagramLegend
        className="security-loop-legend"
        items={[
          { variant: "enforcement", label: "Enforcement stage" },
          { variant: "truth", label: "Trusted verification" },
          { variant: "ai", label: "AI-assisted stage" },
          { variant: "human", label: "Human Approver control" },
          { variant: "deterministic", label: "Deployment" },
        ]}
      />
    </DiagramFrame>
  );
}
