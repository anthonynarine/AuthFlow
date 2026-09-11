import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { SecurityLearningView } from "./SecurityLearningView";

const BASE_TOPIC = {
  key: "refresh_token_rotation",
  title: "Refresh Token Rotation",
  category: "Authentication & Sessions",
  short_summary: "Every refresh exchanges the presented credential for a brand-new one.",
  why_it_exists: "Reusing the same refresh credential indefinitely would defeat rotation's purpose.",
  how_it_works: "rotate_refresh_token() marks the presented token consumed_at.",
  how_gait_uses_it: "Every refresh request goes through this path when rotation is enabled.",
  example: "Refresh A is exchanged for Refresh B.",
  failure_scenario: "Presenting Refresh A again is what refresh_replay_detection catches.",
  security_invariant: "A consumed refresh credential can never continue an authenticated session.",
  key_takeaways: ["Atomic consume-and-reissue", "Guarded by a rollback feature flag"],
  related_topics: ["refresh_token", "token_family"],
  implementation_references: ["user/refresh_tokens.py"],
  classification: "INTERNAL",
};

describe("SecurityLearningView", () => {
  test("renders nothing when no topic is given", () => {
    const { container } = render(<SecurityLearningView topic={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders title, category, classification, and summary", () => {
    render(<SecurityLearningView topic={BASE_TOPIC} />);
    expect(screen.getByRole("heading", { name: "Refresh Token Rotation" })).toBeInTheDocument();
    expect(screen.getByText("Authentication & Sessions")).toBeInTheDocument();
    expect(screen.getByText("INTERNAL")).toBeInTheDocument();
    expect(screen.getByText(BASE_TOPIC.short_summary)).toBeInTheDocument();
  });

  test("renders every present narrative section with its heading and backend text verbatim", () => {
    render(<SecurityLearningView topic={BASE_TOPIC} />);
    expect(screen.getByText("Why it exists")).toBeInTheDocument();
    expect(screen.getByText(BASE_TOPIC.why_it_exists)).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("How Gait uses it")).toBeInTheDocument();
    expect(screen.getByText("Example")).toBeInTheDocument();
    expect(screen.getByText("What can go wrong")).toBeInTheDocument();
    expect(screen.getByText("Security invariant")).toBeInTheDocument();
    expect(screen.getByText(BASE_TOPIC.security_invariant)).toBeInTheDocument();
  });

  test("does not render a heading for a section the topic omits", () => {
    const { example, ...withoutExample } = BASE_TOPIC;
    render(<SecurityLearningView topic={withoutExample} />);
    expect(screen.queryByText("Example")).not.toBeInTheDocument();
  });

  test("does not render optional blocks (diagram, takeaways, related, references) when absent", () => {
    const minimalTopic = {
      key: "minimal",
      title: "Minimal Topic",
      category: "Security Truth",
      short_summary: "x",
      why_it_exists: "x",
      how_it_works: "x",
      how_gait_uses_it: "x",
      example: "x",
      failure_scenario: "x",
      security_invariant: "x",
      key_takeaways: [],
      related_topics: [],
      implementation_references: [],
    };
    render(<SecurityLearningView topic={minimalTopic} />);
    expect(screen.queryByText("Key takeaways")).not.toBeInTheDocument();
    expect(screen.queryByText("Architecture diagram")).not.toBeInTheDocument();
    expect(screen.queryByText("Related concepts")).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation references")).not.toBeInTheDocument();
  });

  test("renders key takeaways as a scannable list", () => {
    render(<SecurityLearningView topic={BASE_TOPIC} />);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
    expect(screen.getByText("Atomic consume-and-reissue")).toBeInTheDocument();
    expect(screen.getByText("Guarded by a rollback feature flag")).toBeInTheDocument();
  });

  test("renders implementation references as plain technical text, not links", () => {
    render(<SecurityLearningView topic={BASE_TOPIC} />);
    expect(screen.getByText("user/refresh_tokens.py")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "user/refresh_tokens.py" })).not.toBeInTheDocument();
  });

  test("renders related topics as humanized, clickable buttons and forwards the raw key on click", () => {
    const onSelectRelated = jest.fn();
    render(<SecurityLearningView topic={BASE_TOPIC} onSelectRelated={onSelectRelated} />);
    const relatedButton = screen.getByRole("button", { name: "Refresh Token" });
    fireEvent.click(relatedButton);
    expect(onSelectRelated).toHaveBeenCalledWith("refresh_token");
  });

  test("preserves canonical specialist role terminology verbatim", () => {
    const roleTopic = {
      ...BASE_TOPIC,
      key: "incident_commander",
      title: "Incident Commander",
      why_it_exists: "Coordinates workflow across Blue Team, Red Team, and Green Team.",
      related_topics: [],
    };
    render(<SecurityLearningView topic={roleTopic} />);
    expect(screen.getByRole("heading", { name: "Incident Commander" })).toBeInTheDocument();
    expect(screen.getByText("Coordinates workflow across Blue Team, Red Team, and Green Team.")).toBeInTheDocument();
  });

  test("renders the diagram section when a diagram is present", () => {
    render(
      <SecurityLearningView
        topic={{
          ...BASE_TOPIC,
          diagram: {
            type: "flow",
            nodes: [
              { id: "a", label: "Refresh A" },
              { id: "b", label: "Refresh B" },
            ],
            edges: [{ from: "a", to: "b", label: "rotate" }],
          },
        }}
      />
    );
    expect(screen.getByText("Architecture diagram")).toBeInTheDocument();
    expect(screen.getByText("Refresh A")).toBeInTheDocument();
  });
});
