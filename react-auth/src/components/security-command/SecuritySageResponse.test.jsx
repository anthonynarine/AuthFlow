import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { SecuritySageResponse } from "./SecuritySageResponse";

function sageResponse(overrides = {}) {
  return {
    answer: "fallback prose",
    information_need: "KNOWLEDGE",
    basis: "KNOWLEDGE",
    learning_mode: "EXPLAIN",
    facts: ["Canonical knowledge grounded this answer with 1 citation(s)."],
    interpretation: [],
    sources: [],
    citations: [
      {
        source_key: "arch.gateway",
        title: "The Gateway",
        heading_path: ["Overview"],
        origin: { origin_kind: "FILE", path: "docs/architecture/gateway.md" },
        content_hash: "hash1",
        chunk_id: "chunk-1",
      },
    ],
    limitations: [],
    next_reading: [],
    context: {
      sage: {
        answer: "The Gateway is the single authorization chokepoint.",
        knowledge_excerpts: [
          {
            source_key: "arch.gateway",
            title: "The Gateway",
            heading_path: ["Overview"],
            text: "The Gateway is the single authorization chokepoint.",
            domain: "AGENT_SECURITY",
            canonicality: "CANONICAL",
          },
        ],
        truncated: false,
        fallback_used: false,
      },
    },
    ...overrides,
  };
}

describe("SecuritySageResponse basis rendering", () => {
  test("renders nothing for a non-Sage response", () => {
    const { container } = render(<SecuritySageResponse response={{ answer: "plain" }} onAsk={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("KNOWLEDGE basis renders the Knowledge badge and excerpt, no Current Truth section", () => {
    render(<SecuritySageResponse response={sageResponse()} onAsk={jest.fn()} />);
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current Truth")).not.toBeInTheDocument();
    expect(screen.getByText("The Gateway is the single authorization chokepoint.")).toBeInTheDocument();
  });

  test("MIXED basis renders Current Truth and Knowledge as visually distinct sections, not conflated", () => {
    const response = sageResponse({
      basis: "MIXED",
      information_need: "MIXED_READ_ONLY",
      facts: ["Refresh Replay Detection is CONTROL_FAILURE."],
      interpretation: ["This control needs attention."],
      sources: [{ type: "SecurityControl", id: "42" }],
    });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);

    expect(screen.getByText("Mixed")).toBeInTheDocument();
    const currentTruth = screen.getByLabelText("Current Truth");
    expect(currentTruth).toHaveTextContent("Refresh Replay Detection is CONTROL_FAILURE.");
    expect(currentTruth).toHaveTextContent("This control needs attention.");
    expect(currentTruth).toHaveTextContent("SecurityControl #42");

    const knowledge = screen.getByLabelText("Knowledge");
    expect(knowledge).toHaveTextContent("The Gateway is the single authorization chokepoint.");
    // The live status line must never appear inside the knowledge section.
    expect(knowledge).not.toHaveTextContent("CONTROL_FAILURE");
  });

  test("HISTORY_UNAVAILABLE renders gracefully with the canonical fallback text, not as an application error", () => {
    const response = sageResponse({
      basis: "UNAVAILABLE_HISTORY",
      information_need: "HISTORY_UNAVAILABLE",
      learning_mode: null,
      citations: [],
      limitations: ["General historical retrieval is deferred to B-KNOW4 and is not implemented."],
      context: { sage: { answer: "General historical operational retrieval ... not available yet ...", knowledge_excerpts: [], fallback_used: false } },
    });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);

    expect(screen.getByText("History Unavailable")).toBeInTheDocument();
    expect(screen.getByText(/not available yet/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("an unrecognized basis value still renders safely instead of crashing", () => {
    const response = sageResponse({ basis: "SOMETHING_FUTURE" });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);
    expect(screen.getByText("SOMETHING_FUTURE")).toBeInTheDocument();
  });

  test("an unrecognized learning_mode renders safely with no mode chip, instead of crashing", () => {
    const response = sageResponse({ learning_mode: "SOME_FUTURE_MODE" });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.queryByText("SOME_FUTURE_MODE")).not.toBeInTheDocument();
  });
});

describe("SecuritySageResponse citations / sources drawer", () => {
  test("Sources button shows the count and opens a dialog with provenance, never a fabricated file link", () => {
    render(<SecuritySageResponse response={sageResponse()} onAsk={jest.fn()} />);

    const trigger = screen.getByRole("button", { name: "Sources (1)" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("The Gateway");
    expect(dialog).toHaveTextContent("Overview");
    expect(dialog).toHaveTextContent("docs/architecture/gateway.md");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
  });

  test("technical details (hash/chunk id) are hidden behind a collapsed disclosure by default", () => {
    render(<SecuritySageResponse response={sageResponse()} onAsk={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Sources (1)" }));

    const details = screen.getByText("Technical details").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("hash1")).toBeInTheDocument();
  });

  test("no Sources button when there are no citations", () => {
    render(<SecuritySageResponse response={sageResponse({ citations: [] })} onAsk={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /Sources/ })).not.toBeInTheDocument();
  });
});

describe("SecuritySageResponse QUIZ mode", () => {
  test("does not show an answer by default and Reveal Answer asks a follow-up that requests it", () => {
    const onAsk = jest.fn();
    const response = sageResponse({
      learning_mode: "QUIZ",
      context: {
        sage: {
          answer: "Why is JWT signature validation insufficient by itself?",
          knowledge_excerpts: [
            {
              source_key: "mastery.oral_exam.token_families",
              title: "Token Families",
              heading_path: ["Oral Exam"],
              text: "Why is JWT signature validation insufficient by itself?",
              domain: "MASTERY_MANUAL",
              canonicality: "CANONICAL",
            },
          ],
          fallback_used: false,
        },
      },
    });
    render(<SecuritySageResponse response={response} originalMessage="Quiz me on token families." onAsk={onAsk} />);

    expect(screen.queryByText(/answer_guide/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal Answer" }));
    expect(onAsk).toHaveBeenCalledWith("Quiz me on token families. Show me the answer.");
  });

  test("no Reveal Answer button outside QUIZ mode", () => {
    render(<SecuritySageResponse response={sageResponse({ learning_mode: "EXPLAIN" })} onAsk={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "Reveal Answer" })).not.toBeInTheDocument();
  });
});

describe("SecuritySageResponse fallback / limitations", () => {
  test("a synthesis fallback shows retrieved sources gracefully, not as a catastrophic failure", () => {
    const response = sageResponse({ context: { sage: { ...sageResponse().context.sage, fallback_used: true } } });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);
    expect(screen.getByText(/couldn't synthesize a full explanation/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("limitations render as plain informational text", () => {
    const response = sageResponse({ limitations: ["Only the top 5 most relevant canonical excerpts are used."] });
    render(<SecuritySageResponse response={response} onAsk={jest.fn()} />);
    expect(screen.getByText("Only the top 5 most relevant canonical excerpts are used.")).toBeInTheDocument();
  });

  test("next reading renders as clickable follow-ups that ask Gait about that topic", () => {
    const onAsk = jest.fn();
    const response = sageResponse({ next_reading: [{ source_key: "arch.policy", title: "Policy", heading_path: [] }] });
    render(<SecuritySageResponse response={response} onAsk={onAsk} />);

    fireEvent.click(screen.getByRole("button", { name: "Policy" }));
    expect(onAsk).toHaveBeenCalledWith("Explain Policy");
  });
});
