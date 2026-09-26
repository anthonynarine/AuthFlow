import React from "react";
import { DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { StatusCell } from "../components/StatusCell";
import { statusAsOfLabel } from "../featureStatus";

// [feature, what it does, status keys (a Pending item can wait on more than one screen)]
const WHAT_YOU_GET = [
    [
        "A private company space",
        "Your team's own area in the Gait console. Your people, applications, keys and findings live there, and nobody outside your company can see any of it.",
        ["core"],
    ],
    [
        "Security checks from your software",
        "Your application reports its own security checks to Gait using the gait-sdk and a connection key. Gait keeps the history and tracks what's healthy and what isn't.",
        ["core"],
    ],
    [
        "Findings",
        "When a check fails, Gait opens a finding for that application. It closes when a later check passes.",
        ["core"],
    ],
    [
        "Acting on findings in the console",
        "Acknowledge a finding, or accept the risk with a written reason.",
        ["findingsScreen"],
    ],
    ["Your team", "Invite teammates as Owner, Admin or Member.", ["membersAndInviteAccept", "emailVerification"]],
    [
        "Sign-in for your own product",
        "Your product can let its users sign in with Gait accounts and verify them with the gait-sdk, while your product keeps its own organizations and roles.",
        ["productSignIn"],
    ],
];

export default function WhatGaitIs() {
    return (
        <>
            <p className="doc-lede">
                Gait watches the security of your software and gives your team one private place to see it and act on
                it.
            </p>

            <DocSection id="what-you-get" title="What you get">
                <DocTable caption="What you get">
                    <thead>
                        <tr>
                            <th scope="col"><span className="doc-visually-hidden">Feature</span></th>
                            <th scope="col">What it does</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {WHAT_YOU_GET.map(([feature, description, features]) => (
                            <tr key={feature}>
                                <th scope="row">{feature}</th>
                                <td>{description}</td>
                                <td><StatusCell features={features} /></td>
                            </tr>
                        ))}
                    </tbody>
                </DocTable>
                <p className="doc-muted">Status as of {statusAsOfLabel()}.</p>
            </DocSection>

            <DocSection id="who-its-for" title="Who it's for">
                <ul>
                    <li>
                        <strong>Teams that build and run software</strong> and want an honest, always-current picture of
                        its security, per application and per environment.
                    </li>
                    <li>
                        <strong>The people who secure that software.</strong> The console is for your engineering and
                        security team, not for your product's end users.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="what-gait-is-not" title="What Gait is not">
                <ul>
                    <li>
                        <strong>Not a place for your product's users.</strong> Your customers never see the Gait
                        console. If your product uses Gait sign-in, Gait only answers "who is this?"; your product
                        decides what they can do.
                    </li>
                    <li>
                        <strong>Not a remote control for your software.</strong> A connection key can only report
                        security checks. Gait never changes your code, your servers or your data.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="where-to-go-next" title="Where to go next">
                <ul>
                    <li><DocLink to="how-it-works">How it works</DocLink>: the big picture in one diagram.</li>
                    <li>
                        <DocLink to="quickstart">Quickstart</DocLink>: company, application, key and first security check
                        in about 15 minutes.
                    </li>
                    <li>
                        <DocLink to="people-and-applications">People and applications</DocLink>: the one idea
                        everything else builds on.
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
