import React from "react";

// Renders the bounded, deterministic "flow" diagram schema produced by
// security/learning_content.py (nodes + edges, both plain-text labels).
// This is presentation only: it never interprets diagram text as markup or
// code, never uses dangerouslySetInnerHTML, and treats every label as plain
// text rendered by React (which escapes it automatically). An unsupported
// diagram type or a malformed payload is omitted with a restrained note --
// it never crashes the surrounding lesson.
const MAX_NODES = 15;
const MAX_EDGES = 25;
const MAX_LABEL_LENGTH = 200;

function isValidLabel(label) {
  return typeof label === "string" && label.length > 0 && label.length <= MAX_LABEL_LENGTH;
}

function normalizeDiagram(diagram) {
  if (!diagram || typeof diagram !== "object") {
    return null;
  }

  if (diagram.type !== "flow") {
    return { unsupported: true };
  }

  const rawNodes = Array.isArray(diagram.nodes) ? diagram.nodes : null;
  const rawEdges = Array.isArray(diagram.edges) ? diagram.edges : [];
  if (!rawNodes || rawNodes.length === 0 || rawNodes.length > MAX_NODES || rawEdges.length > MAX_EDGES) {
    return { unsupported: true };
  }

  const nodes = [];
  const nodeLabelById = new Map();
  for (const node of rawNodes) {
    const id = node?.id;
    const label = node?.label;
    if (typeof id !== "string" || !id || nodeLabelById.has(id) || !isValidLabel(label)) {
      return { unsupported: true };
    }
    nodeLabelById.set(id, label);
    nodes.push({ id, label });
  }

  const edges = [];
  for (const edge of rawEdges) {
    const from = edge?.from;
    const to = edge?.to;
    const label = edge?.label;
    if (!nodeLabelById.has(from) || !nodeLabelById.has(to)) {
      return { unsupported: true };
    }
    if (label !== undefined && label !== "" && !isValidLabel(label)) {
      return { unsupported: true };
    }
    edges.push({ from, to, label: label || "" });
  }

  const title = typeof diagram.title === "string" && diagram.title.length <= MAX_LABEL_LENGTH ? diagram.title : "";

  return { unsupported: false, title, nodes, edges, nodeLabelById };
}

export function SecurityLearningDiagram({ diagram }) {
  if (!diagram) {
    return null;
  }

  const normalized = normalizeDiagram(diagram);
  if (!normalized) {
    return null;
  }

  if (normalized.unsupported) {
    return <p className="learning-diagram-unsupported">This diagram type isn't supported for display.</p>;
  }

  const { title, nodes, edges, nodeLabelById } = normalized;

  // Primary reading order follows the backend-authored node sequence. Where
  // consecutive nodes are directly connected, the connecting edge's label is
  // shown inline; any remaining edges (branches, convergence, fail paths)
  // are listed separately rather than attempted as a full graph layout.
  const usedEdges = new Set();
  const chainLabels = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const from = nodes[i].id;
    const to = nodes[i + 1].id;
    const match = edges.find((edge) => !usedEdges.has(edge) && edge.from === from && edge.to === to);
    if (match) {
      usedEdges.add(match);
    }
    chainLabels.push(match ? match.label : "");
  }

  const otherEdges = edges.filter((edge) => !usedEdges.has(edge));

  return (
    <figure className="learning-diagram">
      {title && <figcaption className="learning-diagram-title">{title}</figcaption>}
      <ol className="learning-diagram-chain">
        {nodes.map((node, index) => (
          <li key={node.id} className="learning-diagram-step">
            <span className="learning-diagram-node">{node.label}</span>
            {index < nodes.length - 1 && (
              <span className="learning-diagram-arrow" aria-hidden="true">
                {chainLabels[index] ? `↓ ${chainLabels[index]}` : "↓"}
              </span>
            )}
          </li>
        ))}
      </ol>
      {otherEdges.length > 0 && (
        <ul className="learning-diagram-branches">
          {otherEdges.map((edge, index) => (
            <li key={`${edge.from}-${edge.to}-${index}`}>
              {nodeLabelById.get(edge.from)}
              {edge.label ? ` — ${edge.label} → ` : " → "}
              {nodeLabelById.get(edge.to)}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export default SecurityLearningDiagram;
