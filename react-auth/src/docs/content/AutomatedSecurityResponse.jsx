import React from "react";
import { DocSection } from "../components/DocPrimitives";
import { Diagram } from "../components/Diagram";
import { DIAGRAM } from "../palette";

// High level only, by decision: no agent names, tools, capabilities,
// thresholds, models or internal endpoints, and no status badges.
// Top to bottom: eight steps in one row would shrink to unreadable text.
const RESPONSE_FLOW = `flowchart TB
    classDef auto fill:${DIAGRAM.surface},stroke:${DIAGRAM.cyan},color:${DIAGRAM.text},stroke-width:2px
    classDef human fill:${DIAGRAM.fillAmber},stroke:${DIAGRAM.amber},color:${DIAGRAM.text},stroke-width:2px
    classDef gate fill:${DIAGRAM.fillTeal},stroke:${DIAGRAM.teal},color:${DIAGRAM.text},stroke-width:2px

    O["Observe<br/>a check fails"]:::auto --> I["Investigate<br/>what changed and why"]:::auto
    I --> T["Test<br/>try to reproduce it safely"]:::auto
    T --> F["Prepare a fix<br/>in an isolated copy"]:::auto
    F --> V["Validate<br/>checked independently"]:::gate
    V --> H["Human approval<br/>one person, one fix, once"]:::human
    H --> D["Deploy"]:::auto
    D --> C["Confirm<br/>fresh checks must pass"]:::gate`;

export default function AutomatedSecurityResponse() {
    return (
        <>
            <p className="doc-lede">
                Gait uses AI agents to look after <strong>its own platform</strong>: to investigate problems, test them,
                and prepare fixes, inside fixed boundaries. Every fix is checked independently, and I approve every
                production change.
            </p>

            <DocSection
                id="what-happens-when-gait-finds-a-problem"
                title="What happens when Gait finds a problem in its own platform"
            >
                <Diagram
                    source={RESPONSE_FLOW}
                    description="Observe: a check fails. Investigate what changed and why. Test: try to reproduce it safely. Prepare a fix in an isolated copy. Validate: the fix is checked independently. Human approval: one person approves one fix, once. Deploy. Confirm: fresh checks must pass."
                />
            </DocSection>

            <DocSection id="the-guarantees" title="The guarantees">
                <ul>
                    <li>
                        <strong>A person approves every deployment.</strong> A fix can't reach production without an
                        administrator approving that exact fix. Each approval works once, for one change, and expires. If
                        the fix changes after it's approved, the approval no longer applies.
                    </li>
                    <li>
                        <strong>Fixes are checked by something other than what wrote them.</strong> A separate step
                        reproduces the problem, confirms the fix resolves it, checks that it only changed what it said it
                        would, and runs the tests.
                    </li>
                    <li>
                        <strong>AI helps; it doesn't decide.</strong> Automated agents investigate and prepare fixes,
                        but they can't approve a change, and nothing they say counts as proof that a problem is fixed.
                    </li>
                    <li>
                        <strong>Every fix starts isolated.</strong> Fixes are prepared in a separate copy of the code and
                        never touch the live service until approved.
                    </li>
                    <li>
                        <strong>"Deployed" doesn't mean "fixed".</strong> A problem only counts as resolved when fresh
                        checks show it's healthy again.
                    </li>
                    <li>
                        <strong>Everything is recorded.</strong> Each step leaves an audit trail.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="what-this-means-for-your-applications" title="What this means for Lumen">
                <p>
                    These agents work on Gait's own platform. <strong>They don't investigate, change or deploy
                    Lumen.</strong> Lumen's findings stay in its workspace: Gait tracks them and shows them there, and I
                    decide what to do. AI investigation and fixes for Lumen are planned, not live.
                </p>
            </DocSection>
        </>
    );
}
