import React, { useState } from "react";
import { LessonCoach, LessonNav } from "./LessonParts";
import "./person-joins.css";

/*
 * "How a person joins" as a step-through sequence: three labeled lanes
 * (person, console, Gait), a spine of five messages everyone goes through,
 * then an either/or fork: start a workspace (A) or accept an invite (B).
 * Same messages as the old mermaid sequence diagram, one beat at a time.
 * Colors follow the other lessons: person teal, Gait cyan, the invite path
 * orange; Gait's email to the person is dashed because it leaves the app.
 */

const LANES = [
    { id: "person", label: "Person" },
    { id: "console", label: "Gait console" },
    { id: "gait", label: "Gait" },
];
const LANE_INDEX = { person: 0, console: 1, gait: 2 };

const SPINE = [
    { n: 1, from: "person", to: "console", text: "Create an account (email + password)" },
    { n: 2, from: "console", to: "gait", text: "Create account" },
    { n: 3, from: "gait", to: "person", text: "Email: \"Confirm your email address\"", email: true },
    { n: 4, from: "person", to: "console", text: "Open the link" },
    { n: 5, from: "console", to: "gait", text: "Email confirmed" },
];

const FORKS = [
    {
        id: "a",
        label: "A · Start a new workspace",
        messages: [
            { n: 6, from: "person", to: "console", text: "Create workspace \"acme\"" },
            { n: 7, from: "gait", to: "person", text: "You are its Owner" },
        ],
    },
    {
        id: "b",
        label: "B · Invited to an existing workspace",
        messages: [
            { n: 8, from: "person", to: "console", text: "Open the invite link, signed in as the invited email" },
            { n: 9, from: "gait", to: "person", text: "You are a Member, Admin or Owner, as invited" },
        ],
    },
];

const ALL_MESSAGES = [...SPINE, ...FORKS.flatMap((fork) => fork.messages)];
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

function lanesFor(beat) {
    if (beat.live.length === 0) return LANES.map((lane) => lane.id);
    const lanes = new Set();
    for (const message of ALL_MESSAGES.filter((m) => beat.live.includes(m.n))) {
        lanes.add(message.from);
        lanes.add(message.to);
    }
    return Array.from(lanes);
}

function Message({ message, beat, tone }) {
    const fromIndex = LANE_INDEX[message.from];
    const toIndex = LANE_INDEX[message.to];
    const first = Math.min(fromIndex, toIndex);
    const span = Math.abs(toIndex - fromIndex) + 1;
    const live = beat.live.includes(message.n);
    const state = live ? "is-live" : beat.shown.includes(message.n) ? "" : "is-dim";
    const direction = toIndex > fromIndex ? "right" : "left";
    const fromLabel = LANES[fromIndex].label;
    const toLabel = LANES[toIndex].label;
    return (
        <li className={`pj-message pj-message--${tone} ${state}`} aria-current={live ? "step" : undefined}>
            <span className="pj-number">{message.n}</span>
            <span className="pj-track">
                <span className="pj-span" style={{ gridColumn: `${first + 1} / span ${span}`, "--pj-span": span }}>
                    <span className="pj-route">
                        {fromLabel} → {toLabel}
                    </span>
                    <span className="pj-text">{message.text}</span>
                    <span
                        className={`pj-arrow pj-arrow--${direction}${message.email ? " is-dashed" : ""}`}
                        aria-hidden="true"
                    />
                </span>
            </span>
        </li>
    );
}

export function PersonJoinsLesson() {
    const [step, setStep] = useState(0);
    const beat = BEATS[step];
    const activeLanes = lanesFor(beat);

    return (
        <figure className="pj" aria-labelledby="pj-caption">
            <figcaption id="pj-caption" className="doc-visually-hidden">
                A person creates an account and confirms their email from a link Gait sends. Then either they create a
                new workspace, and become its Owner, or they open an invite link while signed in with the invited email
                address and join an existing workspace with the role they were invited as.
            </figcaption>

            <div className="pj-lanes">
                <span className="pj-number" aria-hidden="true" />
                <ul className="pj-track pj-lane-heads" aria-label="Lanes">
                    {LANES.map((lane) => (
                        <li
                            key={lane.id}
                            className={`pj-lane pj-lane--${lane.id}${activeLanes.includes(lane.id) ? "" : " is-dim"}`}
                        >
                            {lane.label}
                        </li>
                    ))}
                </ul>
            </div>

            <ol className="pj-messages" aria-label="Every account: steps 1 to 5">
                {SPINE.map((message) => (
                    <Message key={message.n} message={message} beat={beat} tone="spine" />
                ))}
            </ol>

            <div className="pj-fork">
                <p className="pj-fork-label">After the email is confirmed · one of these</p>
                {FORKS.map((fork, index) => (
                    <div key={fork.id} className={`pj-branch pj-branch--${fork.id}`}>
                        {index > 0 && (
                            <p className="pj-or" aria-hidden="true">
                                or
                            </p>
                        )}
                        <p className="pj-branch-label">{fork.label}</p>
                        <ol className="pj-messages" aria-label={fork.label}>
                            {fork.messages.map((message) => (
                                <Message key={message.n} message={message} beat={beat} tone={fork.id} />
                            ))}
                        </ol>
                    </div>
                ))}
            </div>

            <LessonCoach eyebrow={`Step ${step + 1} of ${BEATS.length}`} title={beat.title} body={beat.body} />
            <LessonNav steps={BEATS} step={step} onStep={setStep} />
        </figure>
    );
}
