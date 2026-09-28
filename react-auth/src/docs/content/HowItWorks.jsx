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
