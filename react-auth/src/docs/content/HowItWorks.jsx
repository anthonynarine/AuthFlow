import React from "react";
import { DocLink, DocSection } from "../components/DocPrimitives";
import { StatusCell } from "../components/StatusCell";
import { HowItWorksLesson } from "../components/HowItWorksLesson";

export default function HowItWorks() {
    return (
        <>
            <DocSection id="the-big-picture" title="The big picture">
                <HowItWorksLesson />
            </DocSection>

            <DocSection id="step-by-step" title="Step by step">
                <ol>
                    <li>
                        <strong>I sign in</strong> to the Gait console and work inside the app's workspace. Each
                        person in a workspace has a role: Owner, Admin or Member.
                    </li>
                    <li>
                        <strong>I register each app, per environment.</strong> Lumen API in{" "}
                        <code>local</code> and Lumen API in <code>production</code> are two applications, each with its
                        own connection key.
                    </li>
                    <li>
                        <strong>My apps report security checks.</strong> Lumen runs its own checks (for example
                        "debug mode is off") and sends PASS or FAIL to Gait with gait-sdk. The connection key tells
                        Gait which application, and so which workspace, the report belongs to. Nothing in the report can
                        point it anywhere else.
                    </li>
                    <li>
                        <strong>Gait keeps score.</strong> Every report is stored as evidence. A FAIL opens a finding for
                        that application; a later PASS closes it. Each environment has its own picture, so a problem in{" "}
                        <code>local</code> never muddies <code>production</code>.
                    </li>
                    <li>
                        <strong>I act on findings.</strong> Acknowledge a finding while I fix it, or accept the risk
                        with a written reason. <StatusCell features={["findingsScreen"]} />
                    </li>
                </ol>
            </DocSection>

            <DocSection id="two-things-always-hold" title="Two things always hold">
                <ul>
                    <li>
                        <strong>Each workspace is private.</strong> Other workspaces can't see its people, applications
                        or findings; to them it doesn't exist. See{" "}
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
                    Checks an app reports about itself are labelled <strong>self-reported</strong>. Checks Gait ran or
                    confirmed itself are labelled <strong>Gait-verified</strong>. Both count, and the console always
                    shows which is which, so it's clear how much weight a result carries.
                </p>
            </DocSection>
        </>
    );
}
