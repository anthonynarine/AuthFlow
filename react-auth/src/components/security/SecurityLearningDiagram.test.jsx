import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { SecurityLearningDiagram } from "./SecurityLearningDiagram";

describe("SecurityLearningDiagram", () => {
  test("renders nothing when no diagram is given", () => {
    const { container } = render(<SecurityLearningDiagram diagram={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders a valid supported flow diagram with its title, nodes, and edge labels", () => {
    render(
      <SecurityLearningDiagram
        diagram={{
          type: "flow",
          title: "Refresh token replay response",
          nodes: [
            { id: "a", label: "Refresh A issued" },
            { id: "b", label: "Refresh A rotates to B" },
            { id: "replay", label: "Refresh A presented again" },
          ],
          edges: [
            { from: "a", to: "b", label: "rotate" },
            { from: "b", to: "replay", label: "old token reused" },
          ],
        }}
      />
    );

    expect(screen.getByText("Refresh token replay response")).toBeInTheDocument();
    expect(screen.getByText("Refresh A issued")).toBeInTheDocument();
    expect(screen.getByText("Refresh A rotates to B")).toBeInTheDocument();
    expect(screen.getByText("Refresh A presented again")).toBeInTheDocument();
    expect(screen.getByText("↓ rotate")).toBeInTheDocument();
    expect(screen.getByText("↓ old token reused")).toBeInTheDocument();
  });

  test("lists branching/converging edges separately from the main chain", () => {
    render(
      <SecurityLearningDiagram
        diagram={{
          type: "flow",
          nodes: [
            { id: "kill", label: "Kill switch" },
            { id: "identity", label: "Principal active" },
            { id: "cap", label: "Capability granted" },
            { id: "deny", label: "DENY" },
          ],
          edges: [
            { from: "kill", to: "identity", label: "pass" },
            { from: "identity", to: "cap", label: "pass" },
            { from: "kill", to: "deny", label: "fail" },
            { from: "identity", to: "deny", label: "fail" },
          ],
        }}
      />
    );

    expect(screen.getByText("Kill switch — fail → DENY")).toBeInTheDocument();
    expect(screen.getByText("Principal active — fail → DENY")).toBeInTheDocument();
  });

  test("shows a restrained message and does not crash for an unknown diagram type", () => {
    render(<SecurityLearningDiagram diagram={{ type: "mermaid", script: "graph TD; A-->B" }} />);
    expect(screen.getByText("This diagram type isn't supported for display.")).toBeInTheDocument();
  });

  test("fails safe for malformed edges referencing unknown nodes", () => {
    render(
      <SecurityLearningDiagram
        diagram={{
          type: "flow",
          nodes: [{ id: "a", label: "A" }],
          edges: [{ from: "a", to: "ghost", label: "x" }],
        }}
      />
    );
    expect(screen.getByText("This diagram type isn't supported for display.")).toBeInTheDocument();
  });

  test("fails safe for malformed/missing nodes array", () => {
    render(<SecurityLearningDiagram diagram={{ type: "flow", nodes: [], edges: [] }} />);
    expect(screen.getByText("This diagram type isn't supported for display.")).toBeInTheDocument();
  });

  test("never injects raw markup from a node label", () => {
    render(
      <SecurityLearningDiagram
        diagram={{
          type: "flow",
          nodes: [
            { id: "a", label: "<img src=x onerror=alert(1)>" },
            { id: "b", label: "B" },
          ],
          edges: [{ from: "a", to: "b", label: "next" }],
        }}
      />
    );
    // Rendered as literal text, not parsed as an element.
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });
});
