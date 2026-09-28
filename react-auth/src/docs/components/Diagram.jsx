import React, { useEffect, useState } from "react";
import { DIAGRAM } from "../palette";

/*
 * Mermaid is large, so it is loaded on demand (its own chunk) the first time a
 * docs page shows a diagram. Diagram sources are static text written in
 * src/docs/content; nothing user-supplied is ever rendered. securityLevel
 * "strict" still sanitizes the output and disables click handlers.
 */
let mermaidPromise = null;
let renderQueue = Promise.resolve();
let diagramCounter = 0;

// Mermaid can't read CSS custom properties and derives shades from hex, so its
// colours come from ../palette.js (the docs' diagram palette), not tokens.css.
const THEME_VARIABLES = {
    darkMode: true,
    background: DIAGRAM.surface,
    primaryColor: DIAGRAM.surfaceAlt,
    primaryTextColor: DIAGRAM.text,
    primaryBorderColor: DIAGRAM.teal,
    secondaryColor: DIAGRAM.surfaceAlt,
    tertiaryColor: DIAGRAM.surface,
    lineColor: DIAGRAM.line,
    textColor: DIAGRAM.text,
    mainBkg: DIAGRAM.surfaceAlt,
    nodeBorder: DIAGRAM.teal,
    clusterBkg: DIAGRAM.surfaceDeep,
    clusterBorder: DIAGRAM.borderStrong,
    titleColor: DIAGRAM.text,
    edgeLabelBackground: DIAGRAM.surface,
    actorBkg: DIAGRAM.surfaceAlt,
    actorBorder: DIAGRAM.teal,
    actorTextColor: DIAGRAM.text,
    actorLineColor: DIAGRAM.line,
    signalColor: DIAGRAM.text,
    signalTextColor: DIAGRAM.text,
    labelBoxBkgColor: DIAGRAM.surfaceAlt,
    labelBoxBorderColor: DIAGRAM.cyan,
    labelTextColor: DIAGRAM.text,
    loopTextColor: DIAGRAM.text,
    noteBkgColor: DIAGRAM.fillPurple,
    noteBorderColor: DIAGRAM.purple,
    noteTextColor: DIAGRAM.text,
    activationBkgColor: DIAGRAM.fillGreen,
    activationBorderColor: DIAGRAM.teal,
    sequenceNumberColor: DIAGRAM.page,
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
                    // Wide enough that an email pair like "a@x · b@x" stays on one line.
                    flowchart: { htmlLabels: false, wrappingWidth: 280 },
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

// The drawing's natural width, from its viewBox, so narrow screens never
// stretch a small diagram (see the --diagram-natural-width rule in docs.css).
function naturalWidth(svg) {
    const match = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) /.exec(svg);
    return match ? Math.ceil(Number(match[1])) : null;
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

    const width = state.status === "ready" ? naturalWidth(state.svg) : null;

    return (
        <figure className="doc-diagram">
            {/* The caption carries the meaning for screen readers; the drawing is a visual duplicate. */}
            <div className="doc-diagram-canvas" aria-hidden="true" data-status={state.status}>
                {state.status === "ready" && (
                    // Sanitized by mermaid (securityLevel "strict") from a static source string.
                    <div
                        className="doc-diagram-svg"
                        style={width ? { "--diagram-natural-width": `${width}px` } : undefined}
                        dangerouslySetInnerHTML={{ __html: state.svg }}
                    />
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
