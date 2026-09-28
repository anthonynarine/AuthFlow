import React from "react";
import { DocLink, DocSection } from "../components/DocPrimitives";
import { findDocPage } from "../manifest";

// [term, meaning, "slug" or "slug#section"]. Kept alphabetical (tested).
export const GLOSSARY = [
    [
        "Accept risk",
        "Deciding not to fix a finding for now, with a written reason (10 to 2,000 characters). It stays accepted even if the check fails again.",
        "security-checks-and-findings",
    ],
    ["Acknowledge", "Marking a finding as seen and being worked on.", "security-checks-and-findings"],
    ["Admin", "A workspace role that can manage applications, keys and people, except Owners.", "teams-roles-and-invites"],
    [
        "Application",
        "One piece of your software in one environment, e.g. Acme API · production.",
        "applications-and-connection-keys",
    ],
    [
        "Connection key",
        "The secret an application uses to prove to Gait which application it is. Shown once; Gait stores only a fingerprint of it. It can report security checks and nothing else.",
        "applications-and-connection-keys",
    ],
    ["Console", "The Gait web app where your team works.", "getting-started"],
    [
        "Control",
        "One security property Gait tracks for your applications, such as \"the application's own security checks pass\".",
        "security-checks-and-findings",
    ],
    [
        "Environment",
        "Where a copy of your software runs: local, test, ci, staging or production. Each has its own security picture.",
        "getting-started",
    ],
    [
        "Evidence",
        "A stored record behind a control's status, such as one security-check report.",
        "security-checks-and-findings",
    ],
    [
        "Finding",
        "An open problem for one application, opened when a check fails and closed when a later check passes.",
        "security-checks-and-findings",
    ],
    [
        "Gait account",
        "A person's login. On its own it belongs to no workspace and sees nothing.",
        "people-and-applications",
    ],
    [
        "gait-sdk",
        "Gait's Python package for reporting security checks and, for early-access sign-in, verifying users.",
        "connecting-your-software",
    ],
    ["Gait-verified", "Evidence Gait produced or confirmed itself, as opposed to self-reported.", "how-it-works"],
    [
        "Invite",
        "An invitation to join a workspace, sent to one email address and valid for 7 days. Accept it from the emailed link, or in Gait once you're signed in with that address confirmed.",
        "teams-roles-and-invites",
    ],
    [
        "Isolation",
        "The guarantee that one workspace can never see or affect another's people, applications or findings.",
        "isolation",
    ],
    [
        "Member",
        "A workspace role that can see the workspace's applications and findings but can't change them.",
        "teams-roles-and-invites",
    ],
    [
        "Owner",
        "The workspace role with full control, including other Owners. A workspace always has at least one.",
        "teams-roles-and-invites",
    ],
    ["Security check", "A test your application runs on itself and reports as PASS or FAIL.", "connecting-your-software"],
    ["Self-reported", "Evidence your application reported about itself.", "how-it-works"],
    [
        "Site / facility",
        "A way your own product may split one customer organization into locations. It's your product's concept; Gait doesn't enforce it.",
        "teams-roles-and-invites#sites-inside-an-org",
    ],
    [
        "Workspace",
        "Your team's private space in Gait. Everything else belongs to exactly one workspace.",
        "people-and-applications",
    ],
];

export function termId(term) {
    return `term-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export default function Glossary() {
    return (
        <DocSection id="terms" title="Terms">
            <dl className="doc-glossary">
                {GLOSSARY.map(([term, meaning, target]) => {
                    const page = findDocPage(target.split("#")[0]);
                    return (
                        <div key={term} className="doc-glossary-entry" id={termId(term)} data-search-title={term}>
                            <dt>{term}</dt>
                            <dd>
                                {meaning}{" "}
                                <span className="doc-glossary-more">
                                    More: <DocLink to={target}>{page ? page.title : target}</DocLink>
                                </span>
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </DocSection>
    );
}
