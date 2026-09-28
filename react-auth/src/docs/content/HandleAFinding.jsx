import React from "react";
import { DocLink, DocSection, DocTable, StatusBadge } from "../components/DocPrimitives";

export default function HandleAFinding() {
    return (
        <>
            <p className="doc-lede">
                A failing check opened a finding. This guide takes it from <strong>Open</strong> to{" "}
                <strong>Resolved</strong>, or to a decision your team has written down.
            </p>
            <p>
                The Findings screen is <StatusBadge feature="findingsScreen" />. Everyone in your workspace can see
                findings; only Owners and Admins can act on them. Background:{" "}
                <DocLink to="security-checks-and-findings">Security checks &amp; findings</DocLink>.
            </p>

            <DocSection id="find-it" title="Find it">
                <ol>
                    <li>
                        In the console, open <strong>Findings</strong>. Pick the environment in the switch at the top:
                        each environment has its own findings.
                    </li>
                    <li>
                        Narrow the list with <strong>Status</strong> and <strong>Severity</strong>. The most recently
                        seen findings come first.
                    </li>
                    <li>
                        Open a finding. <strong>What happened</strong> says what failed and when it was first and last
                        seen, <strong>Reports</strong> lists the checks behind it, and <strong>Decisions</strong> shows
                        what your team has decided so far.
                    </li>
                </ol>
            </DocSection>

            <DocSection id="decide" title="Decide what to do">
                <DocTable caption="Actions on a finding">
                    <thead>
                        <tr>
                            <th scope="col">Action</th>
                            <th scope="col">Use it when</th>
                            <th scope="col">Available from</th>
                            <th scope="col">Your note answers</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Acknowledge</th>
                            <td>You've seen it and you're fixing it.</td>
                            <td>Open</td>
                            <td>"What are you doing about it?"</td>
                        </tr>
                        <tr>
                            <th scope="row">Accept risk</th>
                            <td>You've decided to live with it for now.</td>
                            <td>Open or Acknowledged</td>
                            <td>"Why is this risk acceptable?"</td>
                        </tr>
                    </tbody>
                </DocTable>
                <ul>
                    <li>
                        Both need a note of <strong>10 to 2,000 characters</strong> (spaces at either end don't count).
                    </li>
                    <li>
                        Every decision goes into the finding's permanent history: who decided, when, the note, and the
                        change (for example open → acknowledged). Anyone in your workspace can read it under{" "}
                        <strong>Decisions</strong>.
                    </li>
                    <li>A decision can't be edited or undone.</li>
                </ul>
            </DocSection>

            <DocSection id="fix-it" title="Fix it and let a check pass">
                <ol>
                    <li>Fix the problem in your software.</li>
                    <li>
                        Let your application report the same check again, and PASS: from <strong>the same
                        application</strong> (its own key), in <strong>the same environment</strong>, with a{" "}
                        <strong>new</strong> <code>source_reference</code>. A reused one counts as a retry and changes
                        nothing.
                    </li>
                    <li>
                        The finding becomes <strong>Resolved</strong>, whether it was Open, Acknowledged or Accepted
                        risk. Its history stays.
                    </li>
                </ol>
                <p>
                    How to report: <DocLink to="connecting-your-software">Connecting your software</DocLink>.
                </p>
            </DocSection>

            <DocSection id="if-it-fails-again" title="If the check fails again">
                <DocTable caption="A new FAIL, by the finding's state">
                    <thead>
                        <tr>
                            <th scope="col">The finding is</th>
                            <th scope="col">After another FAIL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Open</th>
                            <td>Stays open. The report is added and "last seen" updates; no second finding appears.</td>
                        </tr>
                        <tr>
                            <th scope="row">Acknowledged</th>
                            <td>Stays acknowledged, with the new report added.</td>
                        </tr>
                        <tr>
                            <th scope="row">Accepted risk</th>
                            <td>Stays accepted. The new reports are still recorded, so the continuing failure is visible.</td>
                        </tr>
                        <tr>
                            <th scope="row">Resolved</th>
                            <td>Opens again: the same finding, with its earlier history.</td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>

            <DocSection id="what-you-cant-do" title="What you can't do">
                <ul>
                    <li>Resolve a finding by hand: only a passing check resolves it.</li>
                    <li>Reopen a finding, or take back an acknowledgement or an accepted risk.</li>
                    <li>
                        Mark a finding a <em>false positive</em>: that's reserved for Gait.
                    </li>
                </ul>
                <p>
                    A PASS that didn't close a finding? See{" "}
                    <DocLink to="troubleshooting#reporting-security-checks">Troubleshooting</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
