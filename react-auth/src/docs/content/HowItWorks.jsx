import React from "react";
import { DocLink, DocSection } from "../components/DocPrimitives";
import { StatusCell } from "../components/StatusCell";
import { Diagram } from "../components/Diagram";

// Top to bottom so it renders at full size in the article column.
const BIG_PICTURE = `flowchart TB
    classDef people fill:#123029,stroke:#1abc9c,color:#e8eaed,stroke-width:2px
    classDef gait fill:#1b2129,stroke:#38bdf8,color:#e8eaed,stroke-width:2px
    classDef soft fill:#2a2340,stroke:#a78bfa,color:#e8eaed,stroke-width:2px
    classDef users fill:#3a2016,stroke:#fb8a5c,color:#e8eaed,stroke-width:2px

    TEAM["Your team<br/>Owner · Admin · Member"]:::people
    subgraph GAIT["Gait"]
        CO["Company: Acme<br/>applications · keys · findings"]:::gait
    end
    APP["Your software<br/>Acme API · production<br/>gait-sdk + connection key"]:::soft
    USERS["Your product's users<br/>(optional, early access)"]:::users

    TEAM -- "sign in to the console" --> CO
    APP -- "reports security checks" --> CO
    USERS -. "sign in with Gait;<br/>your product decides access" .-> APP`;

export default function HowItWorks() {
    return (
        <>
            <DocSection id="the-big-picture" title="The big picture">
                <Diagram
                    source={BIG_PICTURE}
                    description="Your team (Owner, Admin, Member) signs in to the console and works in the company Acme inside Gait, which holds applications, keys and findings. Your software, such as Acme API in production, uses the gait-sdk and a connection key to report security checks to that company. Optionally, in early access, your product's own users sign in with Gait, and your product decides what they can access."
                />
            </DocSection>

            <DocSection id="step-by-step" title="Step by step">
                <ol>
                    <li>
                        <strong>Your team signs in</strong> to the Gait console and works inside your company. Each
                        person has a role: Owner, Admin or Member.
                    </li>
                    <li>
                        <strong>You register each piece of software, per environment.</strong> Acme API in{" "}
                        <code>local</code> and Acme API in <code>production</code> are two applications, each with its
                        own connection key.
                    </li>
                    <li>
                        <strong>Your software reports security checks.</strong> It runs its own checks (for example
                        "debug mode is off") and sends PASS or FAIL to Gait with the gait-sdk. The connection key tells
                        Gait which application, and so which company, the report belongs to. Nothing in the report can
                        point it anywhere else.
                    </li>
                    <li>
                        <strong>Gait keeps score.</strong> Every report is stored as evidence. A FAIL opens a finding for
                        that application; a later PASS closes it. Each environment has its own picture, so a problem in{" "}
                        <code>local</code> never muddies <code>production</code>.
                    </li>
                    <li>
                        <strong>Your team acts.</strong> Acknowledge a finding while you fix it, or accept the risk with
                        a written reason. <StatusCell features={["findingsScreen"]} />
                    </li>
                </ol>
            </DocSection>

            <DocSection id="two-things-always-hold" title="Two things always hold">
                <ul>
                    <li>
                        <strong>Your company is private.</strong> Other companies can't see your people, applications or
                        findings; to them your company doesn't exist. See{" "}
                        <DocLink to="isolation">Isolation and setup</DocLink>.
                    </li>
                    <li>
                        <strong>A connection key is not a person.</strong> It can only report checks for its own
                        application. It can't sign in, invite anyone or read anything.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="self-reported-vs-gait-verified" title="Self-reported vs Gait-verified">
                <p>
                    Checks your software reports about itself are labelled <strong>self-reported</strong>. Checks Gait
                    ran or confirmed itself are labelled <strong>Gait-verified</strong>. Both count, and the console
                    always shows which is which, so you know how much weight a result carries.
                </p>
            </DocSection>
        </>
    );
}
