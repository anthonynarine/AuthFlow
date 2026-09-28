import React from "react";
import { SequenceLesson } from "./SequenceLesson";

/*
 * "How a person joins": the shared account spine (1-5), then an either/or
 * fork, start a workspace (A) or accept an invite (B). Same messages as the
 * old mermaid sequence diagram, one beat at a time.
 */

const LANES = [
    { id: "person", label: "Person", tone: "person" },
    { id: "console", label: "Gait console", tone: "console" },
    { id: "gait", label: "Gait", tone: "gait" },
];

const BLOCKS = [
    {
        kind: "steps",
        label: "Every account: steps 1 to 5",
        tone: "gait",
        messages: [
            { n: 1, from: "person", to: "console", text: "Create an account (email + password)" },
            { n: 2, from: "console", to: "gait", text: "Create account" },
            { n: 3, from: "gait", to: "person", text: "Email: \"Confirm your email address\"", dashed: true },
            { n: 4, from: "person", to: "console", text: "Open the link" },
            { n: 5, from: "console", to: "gait", text: "Email confirmed" },
        ],
    },
    {
        kind: "frame",
        label: "After the email is confirmed · one of these",
        separator: "or",
        branches: [
            {
                id: "a",
                label: "A · Start a new workspace",
                tone: "person",
                messages: [
                    { n: 6, from: "person", to: "console", text: "Create workspace \"acme\"" },
                    { n: 7, from: "gait", to: "person", text: "You are its Owner" },
                ],
            },
            {
                id: "b",
                label: "B · Invited to an existing workspace",
                tone: "invite",
                messages: [
                    { n: 8, from: "person", to: "console", text: "Open the invite link, signed in as the invited email" },
                    { n: 9, from: "gait", to: "person", text: "You are a Member, Admin or Owner, as invited" },
                ],
            },
        ],
    },
];

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const BEATS = [
    {
        title: "Three lanes, one person",
        body: "The person never talks to Gait directly. They use the console, and the console talks to Gait. Keep that in mind for every arrow that follows.",
        live: [],
        shown: [],
    },
    {
        title: "Create an account",
        body: "The person signs up with an email and password, and the console asks Gait to create the account.",
        live: [1, 2],
        shown: [1, 2],
    },
    {
        title: "Gait asks for proof of the email",
        body: "Gait emails a link: \"Confirm your email address\". The arrow is dashed because this step leaves the console and goes to the person's inbox.",
        live: [3],
        shown: range(1, 3),
    },
    {
        title: "Email confirmed",
        body: "The person opens the link and the console tells Gait the email is confirmed. There is now an identity, but no membership: this account belongs to no workspace yet.",
        live: [4, 5],
        shown: range(1, 5),
    },
    {
        title: "Fork A · Start a new workspace",
        body: "The person creates a workspace, acme, and becomes its Owner. Owner is what you get for creating the workspace, not a promotion that comes later.",
        live: [6, 7],
        shown: range(1, 7),
    },
    {
        title: "Fork B · Invited to an existing workspace",
        body: "The person opens the invite link while signed in with the invited, confirmed email, and joins with the role they were invited as. Once that email is confirmed, the invite also shows up in Gait itself, so the link isn't the only way in. Signed in as a different email, the invite doesn't work.",
        live: [8, 9],
        shown: [...range(1, 5), 8, 9],
    },
    {
        title: "Recap",
        body: "An account is not membership. Membership starts at step 6 (you create the workspace) or step 8 (you accept an invite), never before.",
        live: [],
        shown: range(1, 9),
    },
];

export function PersonJoinsLesson() {
    return (
        <SequenceLesson
            captionId="person-joins-caption"
            caption="A person creates an account and confirms their email from a link Gait sends. Then either they create a new workspace, and become its Owner, or they open an invite link while signed in with the invited email address and join an existing workspace with the role they were invited as."
            lanes={LANES}
            blocks={BLOCKS}
            beats={BEATS}
        />
    );
}
