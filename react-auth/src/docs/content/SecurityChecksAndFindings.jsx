import React from "react";
import { DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { Diagram } from "../components/Diagram";
import { DIAGRAM } from "../palette";

// Top to bottom: with the reopen arrow, left to right shrinks the labels past reading.
const FINDING_LIFECYCLE = `flowchart TB
    classDef app fill:${DIAGRAM.fillPurple},stroke:${DIAGRAM.purple},color:${DIAGRAM.text},stroke-width:2px
    classDef open fill:${DIAGRAM.fillRed},stroke:${DIAGRAM.red},color:${DIAGRAM.text},stroke-width:2px
    classDef human fill:${DIAGRAM.fillAmber},stroke:${DIAGRAM.amber},color:${DIAGRAM.text},stroke-width:2px
    classDef done fill:${DIAGRAM.fillGreen},stroke:${DIAGRAM.green},color:${DIAGRAM.text},stroke-width:2px

    APP["Application (e.g. lumen-api)"]:::app -- "FAIL" --> OPEN["Finding open"]:::open
    OPEN -- "Owner or Admin, with a note" --> ACK["Acknowledged"]:::human
    OPEN -- "Owner or Admin, with a note" --> RISK["Risk accepted"]:::human
    ACK -- "Owner or Admin, with a note" --> RISK
    OPEN -- "later PASS" --> RES["Resolved"]:::done
    ACK -- "later PASS" --> RES
    RISK -- "later PASS" --> RES
    RES -- "FAIL again" --> OPEN`;

export default function SecurityChecksAndFindings() {
    return (
        <>
            <p className="doc-lede">
                What Gait does with the security checks an application reports, and how I act on what it
                finds.
            </p>

            <DocSection id="from-report-to-finding" title="From report to finding">
                <Diagram
                    source={FINDING_LIFECYCLE}
                    description="When an application reports FAIL, Gait opens a finding. An Owner or Admin can acknowledge it or accept the risk, each with a written note; an acknowledged finding can still have its risk accepted. A later PASS from the application resolves the finding, whichever of those states it is in. If the check fails again after that, the same finding opens again."
                />
                <ul>
                    <li>
                        A <strong>FAIL</strong> opens one finding for that application and environment. Repeat failures
                        update the same finding; they don't pile up.
                    </li>
                    <li>
                        A later <strong>PASS</strong> resolves it. If the check fails again later, the same finding
                        opens again, with its history.
                    </li>
                    <li>
                        Each environment has its own security picture. A failure in <code>local</code> never shows up as
                        a problem in <code>production</code>.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="self-reported-vs-gait-verified" title="Self-reported vs Gait-verified">
                <p>Gait labels every finding and every piece of evidence by where it came from.</p>
                <DocTable caption="Self-reported compared with Gait-verified">
                    <thead>
                        <tr>
                            <th scope="col"><span className="doc-visually-hidden">Property</span></th>
                            <th scope="col">Self-reported</th>
                            <th scope="col">Gait-verified</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Comes from</th>
                            <td>The application's own checks, sent with its connection key</td>
                            <td>Checks Gait ran or confirmed itself</td>
                        </tr>
                        <tr>
                            <th scope="row">What it means</th>
                            <td>The app says so; Gait hasn't independently confirmed it</td>
                            <td>Gait has confirmed it</td>
                        </tr>
                        <tr>
                            <th scope="row">Closed by a self-reported PASS?</th>
                            <td>Yes</td>
                            <td><strong>No</strong></td>
                        </tr>
                    </tbody>
                </DocTable>
                <p>
                    Everything an application sends in a report's payload is kept as evidence for the finding, which
                    is why the payload should hold check names and results only.
                </p>
            </DocSection>

            <DocSection id="acting-on-a-finding" title="Acting on a finding">
                <p>Owners and Admins can:</p>
                <ul>
                    <li><strong>Acknowledge</strong>: "I've seen it and I'm on it."</li>
                    <li><strong>Accept the risk</strong>: "I've decided to live with this, and here's why."</li>
                </ul>
                <p>
                    Both need a written note of <strong>10 to 2,000 characters</strong>, and both are kept in the
                    finding's permanent history.
                </p>
                <ul>
                    <li>
                        An accepted risk stays accepted even if the application keeps reporting the same failure. The
                        new reports are still recorded.
                    </li>
                    <li>A PASS resolves the finding once it's actually fixed.</li>
                    <li>Marking a finding a <em>false positive</em> is reserved for Gait.</li>
                    <li>Members can see findings but can't act on them.</li>
                </ul>
                <p>
                    See who can do what in <DocLink to="teams-roles-and-invites#roles">Roles</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
