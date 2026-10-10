import React from "react";
import { DocLink, DocSection, DocTable, StatusBadge } from "../components/DocPrimitives";
import { StatusCell } from "../components/StatusCell";
import { statusAsOfLabel } from "../featureStatus";

// [feature, what it does, status keys (a Pending item can wait on more than one screen)]
const WHAT_IT_DOES = [
    [
        "Hardened sign-in",
        "Cookie sessions, refresh tokens that rotate on every use with replay detection, and two-step sign-in with one-time recovery codes.",
        ["twoStepVerification"],
    ],
    [
        "A private workspace per app",
        "Each app's people, applications, keys and findings live in its own workspace, and nobody outside that workspace can see any of it.",
        ["core"],
    ],
    [
        "Security checks from my apps",
        "An app reports its own security checks to Gait using gait-sdk and a connection key. Gait keeps the history and tracks what's healthy and what isn't.",
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
    ["Members and invites", "Invite people into a workspace as Owner, Admin or Member.", ["membersAndInviteAccept", "emailVerification"]],
    [
        "Sign-in for an app's own users",
        "An app's users sign in with Gait accounts, verified with gait-sdk, while the app keeps its own organizations and roles.",
        ["productSignIn"],
    ],
    [
        "Lumen signs in through Gait",
        "Lumen, my clinical app, is in development. It signs in through Gait with gait-sdk.",
        ["lumenSignIn"],
    ],
    [
        "Lumen reports its security checks",
        "Lumen's security-check reporting with gait-sdk is built but not yet running.",
        ["lumenChecks"],
    ],
];

export default function WhatGaitIs() {
    return (
        <>
            <p className="doc-lede">
                Gait is the internal security system I built to protect my own applications. It watches their security
                and gives me one private place to see it and act on it. Lumen, my clinical app, is in development. It signs in
                through Gait with gait-sdk; its security-check reporting is built but not yet running. In production
                today, Gait protects itself.
            </p>

            <DocSection id="what-you-get" title="What it does">
                <DocTable caption="What it does">
                    <thead>
                        <tr>
                            <th scope="col"><span className="doc-visually-hidden">Feature</span></th>
                            <th scope="col">What it does</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {WHAT_IT_DOES.map(([feature, description, features]) => (
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

            <DocSection id="who-its-for" title="What it protects">
                <ul>
                    <li>
                        <strong>Lumen</strong>, a clinical app. Gait was first built to secure it. Lumen is in
                        development, not in production. It signs in through Gait with gait-sdk{" "}
                        <StatusBadge feature="lumenSignIn" />; its security-check reporting is built but not yet
                        running <StatusBadge feature="lumenChecks" />.
                    </li>
                    <li>
                        <strong>Gait itself</strong>, in production today. AI agents investigate problems in Gait's own platform and prepare
                        fixes inside fixed boundaries; an independent validator checks each fix, and I approve every
                        production change. See <DocLink to="automated-security-response">Automated security
                        response</DocLink>.
                    </li>
                </ul>
                <p>
                    gait-sdk, the Python package my apps use to talk to Gait, is public and open source (MIT, on PyPI).
                </p>
            </DocSection>

            <DocSection id="what-gait-is-not" title="What Gait is not">
                <ul>
                    <li>
                        <strong>Not a product for other companies.</strong> Gait is the system I use to protect my own
                        software.
                    </li>
                    <li>
                        <strong>Not a place for an app's users.</strong> An app's users never see the Gait console. When
                        they sign in with Gait, Gait only answers "who is this?"; the app decides what they can do.
                    </li>
                    <li>
                        <strong>Not a remote control for my apps.</strong> A connection key can only report security
                        checks. Gait never changes an app's code, servers or data.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="where-to-go-next" title="Where to go next">
                <ul>
                    <li><DocLink to="how-it-works">How it works</DocLink>: the big picture in one diagram.</li>
                    <li>
                        <DocLink to="quickstart">Quickstart</DocLink>: how I add an app, from workspace and key to its
                        first security check, in about 15 minutes.
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
