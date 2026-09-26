import React from "react";
import { Diagram } from "./Diagram";
import "./isolation.css";

/*
 * Isolation diagrams (mermaid, via D's Diagram component) plus the step-list
 * pieces the isolation page uses. One color per role, every time:
 *   App One  #fb8a5c (orange)    App Two  #7aa7ff (blue)
 *   keys     #a78bfa (purple)    shared account pool  #1abc9c (teal)
 *   walls    #ff6b6b (red, dashed)
 * The same colors are the --iso-* tokens in isolation.css.
 */
const CLASS_DEFS = `    classDef one fill:#3a2016,stroke:#fb8a5c,color:#e8eaed,stroke-width:2px
    classDef two fill:#172440,stroke:#7aa7ff,color:#e8eaed,stroke-width:2px
    classDef keyed fill:#2a2340,stroke:#a78bfa,color:#e8eaed,stroke-width:2px
    classDef pool fill:#123029,stroke:#1abc9c,color:#e8eaed,stroke-width:2px
    classDef wall fill:#3a1f24,stroke:#ff6b6b,color:#ffd6d6,stroke-width:2px,stroke-dasharray:6 4`;

// App One is declared first, which (in this LR chain) draws it on the left.
export const CONSOLE_ISOLATION = `flowchart LR
${CLASS_DEFS}

    subgraph C1["Company: app-one"]
        direction TB
        M1["Members<br/>owner@app-one · Owner<br/>sec@app-one · Admin"]:::one
        K1["Apps + keys<br/>app-one-api · local<br/>app-one-api · production"]:::keyed
        F1["Findings<br/>app-one-api only"]:::one
        M1 ~~~ K1 ~~~ F1
    end
    W1{{"404 both ways<br/>no shared rows"}}:::wall
    subgraph C2["Company: app-two"]
        direction TB
        M2["Members<br/>owner@app-two · Owner<br/>ops@app-two · Member"]:::two
        K2["Apps + keys<br/>app-two-api · production"]:::keyed
        F2["Findings<br/>app-two-api only"]:::two
        M2 ~~~ K2 ~~~ F2
    end
    C1 ~~~ W1 ~~~ C2`;

// Here dagre lays sibling subgraphs out in reverse declaration order, so App
// Two's database is declared first to draw App One's on the left (checked in
// the browser with mermaid 11.17.2; re-check after a mermaid upgrade).
export const ACCOUNT_POOL = `flowchart TB
${CLASS_DEFS}

    POOL["Gait accounts: one shared pool<br/>owner@app-one · sec@app-one<br/>admin@org-a · user@org-a<br/>owner@app-two<br/>admin@org-b · user@org-b<br/>no 'belongs to App One' label"]:::pool
    subgraph DB2["App Two's database"]
        U2["Customer org B<br/>admin@org-b · Admin<br/>user@org-b · Staff"]:::two
    end
    W2{{"separate<br/>databases"}}:::wall
    subgraph DB1["App One's database"]
        U1["Customer org A<br/>admin@org-a · Admin<br/>user@org-a · Staff"]:::one
    end
    POOL -- "who is this?" --> U1
    POOL ~~~ W2
    POOL -- "who is this?" --> U2`;

/** ① Two companies in the Gait console, with a wall between them. */
export function ConsoleIsolationDiagram() {
    return (
        <Diagram
            source={CONSOLE_ISOLATION}
            description="Company app-one, on the left, holds its members (owner@app-one as Owner, sec@app-one as Admin), its apps and keys (app-one-api in local and in production) and its findings (app-one-api only). Company app-two, on the right, holds its own members (owner@app-two as Owner, ops@app-two as Member), apps and keys (app-two-api in production) and findings (app-two-api only). A wall between them reads: 404 both ways, no shared rows."
        />
    );
}

/** ② One shared pool of Gait accounts; each product keeps its own users in its own database. */
export function AccountPoolDiagram() {
    return (
        <Diagram
            source={ACCOUNT_POOL}
            description="At the top, one shared pool of Gait accounts, with no label saying which product an account belongs to. Arrows labelled 'who is this?' go down to App One's database on the left, which holds customer org A (admin@org-a as Admin, user@org-a as Staff), and to App Two's database on the right, which holds customer org B (admin@org-b as Admin, user@org-b as Staff). A wall between the two reads: separate databases."
        />
    );
}

const ACTOR_TONES = {
    "App Two backend": "two",
    "sec@app-one": "one",
};

function Actor({ name }) {
    return <span className={`iso-actor iso-actor--${ACTOR_TONES[name] || "gait"}`}>{name}</span>;
}

/**
 * A short flow as numbered steps: [{ from, to?, text, outcome? }].
 * `to` omitted means the actor does it internally.
 */
export function FlowSteps({ label, steps, note }) {
    return (
        <div className="iso-flow">
            <ol className="iso-flow-steps" aria-label={label}>
                {steps.map((step, index) => (
                    <li key={index} className={step.outcome ? `iso-flow-step--${step.outcome}` : undefined}>
                        <span className="iso-flow-actors">
                            <Actor name={step.from} />
                            {step.to && (
                                <>
                                    <span className="iso-flow-arrow" aria-label="to">→</span>
                                    <Actor name={step.to} />
                                </>
                            )}
                        </span>
                        <span className="iso-flow-text">{step.text}</span>
                    </li>
                ))}
            </ol>
            {note && <p className="iso-flow-note">{note}</p>}
        </div>
    );
}
