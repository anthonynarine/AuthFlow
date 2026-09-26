import React, { useState } from "react";
import {
  RiFlowChart,
  RiSearchEyeLine,
  RiSwordLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiUserLine,
  RiRocketLine,
  RiPlayCircleFill,
} from "react-icons/ri";
import { DiagramFrame, DiagramNode, FlowConnector, DiagramLegend } from "../../diagrams/DiagramPrimitives";

const stations = [
  {
    key: "commander",
    label: "Incident Commander",
    variant: "deterministic",
    icon: RiFlowChart,
    description: "Coordinates workflow state only.",
    result: "Assigns the work and tracks it — without doing any of it.",
  },
  {
    key: "blue",
    label: "Blue Team",
    variant: "ai",
    icon: RiSearchEyeLine,
    description: "Understand why.",
    result: "Root cause identified, backed by evidence.",
  },
  {
    key: "red",
    label: "Red Team",
    variant: "ai",
    icon: RiSwordLine,
    description: "Prove whether it breaks.",
    result: "Confirmed, safely: the control can actually be broken.",
  },
  {
    key: "green",
    label: "Green Team",
    variant: "ai",
    icon: RiToolsLine,
    description: "Prepare the fix.",
    result: "A scoped fix, with test coverage — not yet trusted by anyone else.",
  },
  {
    key: "validator",
    label: "Security Validator",
    variant: "ai",
    icon: RiShieldCheckLine,
    description: "Proves the repair independently.",
    result: "The fix is checked by a team that didn't build it, and passes.",
  },
  {
    key: "approver",
    label: "Human Approver",
    variant: "human",
    icon: RiUserLine,
    description: "Authorizes the exact artifact.",
    result: "A person signs off on this exact, validated fix.",
  },
  {
    key: "release",
    label: "Release Engineer",
    variant: "ai",
    icon: RiRocketLine,
    description: "Releases only approved code.",
    result: "That exact approved artifact ships. Nothing else could have.",
  },
];

export function AgentFleetDiagram() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSource, setActiveSource] = useState("track");
  const active = stations[activeIndex];

  function selectFromTrack(index) {
    setActiveIndex(index);
    setActiveSource("track");
  }

  function selectFromCard(index) {
    setActiveIndex(index);
    setActiveSource("card");
  }

  return (
    <DiagramFrame
      eyebrow="Agent topology"
      title="Specialized agents. Separate authority."
      subtitle="Each agent has exactly one job and stays in its lane. Incident Commander assigns the work but doesn't do it. Green Team builds the fix but can't approve it. Security Validator checks it independently, not the team that built it. And nothing reaches production without a person saying yes."
    >
      <p className="topology-hint">
        <RiPlayCircleFill className="topology-hint-icon" aria-hidden="true" />
        Select a station. Follow the work.
      </p>
      <div className="topology-track" role="group" aria-label="Agent topology stations">
        {stations.map((station, index) => (
          <button
            key={station.key}
            type="button"
            aria-pressed={index === activeIndex}
            className={`topology-station ${index === activeIndex ? "is-active" : ""} ${index <= activeIndex ? "is-done" : ""}`}
            onClick={() => selectFromTrack(index)}
          >
            <span className="topology-station-dot" aria-hidden="true" />
            <span className="topology-station-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="topology-station-label">{station.label}</span>
          </button>
        ))}
      </div>

      <div className="diagram-column agent-topology">
        <DiagramNode
          variant="deterministic"
          icon={RiFlowChart}
          title="Incident Commander"
          description="Coordinates workflow state only."
          className={activeIndex === 0 ? "is-topology-active" : ""}
          isActive={activeIndex === 0}
          onClick={() => selectFromCard(0)}
        />
        <FlowConnector direction="down" label="delegates to" animated={activeIndex >= 0 && activeIndex <= 3} />
        <div className="diagram-branch-row">
          {stations.slice(1, 4).map((station, index) => (
            <DiagramNode
              key={station.key}
              variant={station.variant}
              icon={station.icon}
              title={station.label}
              description={station.description}
              className={activeIndex === index + 1 ? "is-topology-active" : ""}
              isActive={activeIndex === index + 1}
              onClick={() => selectFromCard(index + 1)}
            />
          ))}
        </div>
        <FlowConnector
          direction="down"
          label="hands off to"
          animated={activeSource === "track" ? activeIndex >= 1 && activeIndex <= 4 : activeIndex === 4}
        />
        <DiagramNode
          variant="ai"
          icon={RiShieldCheckLine}
          title="Security Validator"
          description="Proves the repair independently."
          className={activeIndex === 4 ? "is-topology-active" : ""}
          isActive={activeIndex === 4}
          onClick={() => selectFromCard(4)}
        />
        <FlowConnector direction="down" animated={activeIndex === 4 || activeIndex === 5} />
        <DiagramNode
          variant="human"
          icon={RiUserLine}
          title="Human Approver"
          description="Authorizes the exact artifact."
          className={activeIndex === 5 ? "is-topology-active" : ""}
          isActive={activeIndex === 5}
          onClick={() => selectFromCard(5)}
        />
        <FlowConnector direction="down" animated={activeIndex === 5 || activeIndex === 6} />
        <DiagramNode
          variant="ai"
          icon={RiRocketLine}
          title="Release Engineer"
          description="Releases only approved code."
          className={activeIndex === 6 ? "is-topology-active" : ""}
          isActive={activeIndex === 6}
          onClick={() => selectFromCard(6)}
        />
      </div>

      <p className="topology-result">
        <strong>{active.label}:</strong> {active.result}
      </p>

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
