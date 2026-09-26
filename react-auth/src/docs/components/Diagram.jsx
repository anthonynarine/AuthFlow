import React, { useEffect, useState } from "react";

/*
 * Mermaid is large, so it is loaded on demand (its own chunk) the first time a
 * docs page shows a diagram. Diagram sources are static text written in
 * src/docs/content; nothing user-supplied is ever rendered. securityLevel
 * "strict" still sanitizes the output and disables click handlers.
 */
let mermaidPromise = null;
let renderQueue = Promise.resolve();
let diagramCounter = 0;

// Mermaid can't read CSS custom properties; these mirror the tokens in src/index.css.
const THEME_VARIABLES = {
    darkMode: true,
    background: "#1b2129",
    primaryColor: "#232a34",
    primaryTextColor: "#e8eaed",
    primaryBorderColor: "#1abc9c",
    secondaryColor: "#232a34",
    tertiaryColor: "#1b2129",
    lineColor: "#9aa4af",
    textColor: "#e8eaed",
    mainBkg: "#232a34",
    nodeBorder: "#1abc9c",
    clusterBkg: "#161b22",
    clusterBorder: "rgba(255, 255, 255, 0.16)",
    titleColor: "#e8eaed",
    edgeLabelBackground: "#1b2129",
    actorBkg: "#232a34",
    actorBorder: "#1abc9c",
    actorTextColor: "#e8eaed",
    actorLineColor: "#9aa4af",
    signalColor: "#e8eaed",
    signalTextColor: "#e8eaed",
    labelBoxBkgColor: "#232a34",
    labelBoxBorderColor: "#38bdf8",
    labelTextColor: "#e8eaed",
    loopTextColor: "#e8eaed",
    noteBkgColor: "#2a2340",
    noteBorderColor: "#a78bfa",
    noteTextColor: "#e8eaed",
    activationBkgColor: "#1f3b36",
    activationBorderColor: "#1abc9c",
    sequenceNumberColor: "#121212",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
};

function loadMermaid() {
    if (!mermaidPromise) {
        mermaidPromise = import("mermaid")
            .then((module) => {
                const mermaid = module.default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "strict",
                    theme: "base",
                    themeVariables: THEME_VARIABLES,
                    flowchart: { htmlLabels: false },
                });
                return mermaid;
            })
            .catch((error) => {
                mermaidPromise = null; // let a later page try again
                throw error;
            });
    }
    return mermaidPromise;
}

// Mermaid renders through shared DOM scratch space, so render one diagram at a time.
function renderDiagram(source) {
    const job = renderQueue.then(async () => {
        const mermaid = await loadMermaid();
        diagramCounter += 1;
        const { svg } = await mermaid.render(`gait-doc-diagram-${diagramCounter}`, source);
        return svg;
    });
    renderQueue = job.catch(() => {});
    return job;
}

/**
 * A mermaid diagram with a plain-language description. The description is
 * always visible as the figure caption, so the page still makes sense to a
 * screen reader or if the diagram can't load.
 */
export function Diagram({ source, description }) {
    const [state, setState] = useState({ status: "loading", svg: "" });

    useEffect(() => {
        let cancelled = false;
        setState({ status: "loading", svg: "" });
        renderDiagram(source)
            .then((svg) => {
                if (!cancelled) setState({ status: "ready", svg });
            })
            .catch(() => {
                if (!cancelled) setState({ status: "error", svg: "" });
            });
        return () => {
            cancelled = true;
        };
    }, [source]);

    return (
        <figure className="doc-diagram">
            {/* The caption carries the meaning for screen readers; the drawing is a visual duplicate. */}
            <div className="doc-diagram-canvas" aria-hidden="true" data-status={state.status}>
                {state.status === "ready" && (
                    // Sanitized by mermaid (securityLevel "strict") from a static source string.
                    <div className="doc-diagram-svg" dangerouslySetInnerHTML={{ __html: state.svg }} />
                )}
                {state.status === "loading" && <p className="doc-diagram-status">Loading diagram…</p>}
                {state.status === "error" && (
                    <p className="doc-diagram-status">The diagram couldn't load. The description below covers the same thing.</p>
                )}
            </div>
            <figcaption className="doc-diagram-caption">{description}</figcaption>
        </figure>
    );
}

export default Diagram;
