import React, { useState } from "react";
import { statusOf } from "../featureStatus";
import { LessonCoach, LessonNav } from "./LessonParts";
import "./how-it-works.css";

/*
 * "How it works" as a lesson instead of a poster: the same four boxes and
 * three paths as the old mermaid diagram, but shown one path at a time.
 * Every box, path and step carries its own label. One color per actor,
 * matching the rest of the docs:
 *   people (me) teal   app (Lumen) purple
 *   Lumen's users orange (dashed)   Gait cyan
 * (the --gd-* tokens in ../tokens.css)
 * Plain HTML/CSS, no mermaid, so it renders the same in search's static pass.
 */

// Sign-in for Lumen's own users: its status comes from featureStatus.js
// (read at render time), so this lesson stops saying "early access" the day that
// changes. Copy that depends on it is a function of `earlyAccess`.
const isEarlyAccess = () => statusOf("productSignIn") === "earlyAccess";
const resolve = (value, earlyAccess) => (typeof value === "function" ? value(earlyAccess) : value);

const NODES = {
    team: { kicker: "Humans in the console", title: "Me", detail: "Owner · Admin · Member roles" },
    software: {
        kicker: "Production runtime",
        title: "Lumen",
        detail: "Lumen API · production",
        credential: "gait-sdk + connection key",
    },
    users: {
        kicker: (earlyAccess) => (earlyAccess ? "Sign-in with Gait · early access" : "Sign-in with Gait"),
        title: "Lumen's users",
        detail: "People who use Lumen, not people who run it",
    },
    hub: { kicker: "Gait", title: "Workspace: Lumen" },
};

const HUB_ITEMS = ["applications", "keys", "findings"];

const PATHS = {
    team: { number: 1, label: "signs in to the console" },
    software: { number: 2, label: "reports security checks" },
    users: { number: 3, label: "signs in with Gait · Lumen decides access", optional: true },
};

const ALL_NODES = ["team", "software", "users", "hub"];
const ALL_PATHS = ["team", "software", "users"];

const TOUR = [
    {
        title: "The whole map",
        body: "Four boxes, three paths. Gait isn't a fourth actor next to the others: it's the workspace where the other three meet.",
        nodes: ALL_NODES,
        paths: ALL_PATHS,
        items: HUB_ITEMS,
    },
    {
        title: "Start with the hub",
        body: "Lumen's workspace in Gait holds three things: the applications I register, their connection keys, and the findings their reports produce. Every path ends here.",
        nodes: ["hub"],
        paths: [],
        items: ["applications", "keys"],
    },
    {
        title: "Path 1 · I configure",
        body: "I sign in to the Gait console and work inside Lumen's workspace. Owners and Admins add applications, issue connection keys and act on findings. Members can see all of it but not change it.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: ["applications", "keys"],
    },
    {
        title: "Path 2 · Lumen reports",
        body: "Lumen API runs its own checks (for example \"debug mode is off\") and sends PASS or FAIL with gait-sdk. The connection key it holds tells Gait which application, and so which workspace, the report belongs to. A FAIL opens a finding; a later PASS closes it.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: HUB_ITEMS,
    },
    {
        title: "Path 3 · Lumen's users sign in",
        body: (earlyAccess) => `${earlyAccess ? "In early access, Lumen" : "Lumen"} lets its own users sign in with Gait accounts. Gait tells Lumen who someone is; Lumen still decides what they can open. Authentication is Gait's job, authorization stays Lumen's.`,
        nodes: ["users", "software"],
        paths: ["users"],
        items: [],
    },
    {
        title: "Recap",
        body: "I configure. Lumen reports. Lumen's users authenticate. All of it lands in the same workspace. In this map I and Lumen don't connect to each other: both connect to Lumen's workspace in Gait.",
        nodes: ALL_NODES,
        paths: ALL_PATHS,
        items: HUB_ITEMS,
    },
];

const EXPLORE = {
    team: {
        title: "Me",
        body: "Signs in to the console. Owners and Admins add applications, issue and revoke connection keys, and act on findings. Members can see the workspace's applications, security and members.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    software: {
        title: "Lumen",
        body: "Holds a connection key for one application in one environment. It can report security checks for that application and nothing else: a key can't sign in, invite anyone or read anything.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: ["findings"],
    },
    users: {
        title: "Lumen's users",
        body: (earlyAccess) => `${earlyAccess ? "Early access." : ""} They sign in to Lumen with a Gait account; Lumen decides what they can do. They aren't members of Lumen's Gait workspace.`.trim(),
        nodes: ["users", "software"],
        paths: ["users"],
        items: [],
    },
    hub: {
        title: "Workspace: Lumen",
        body: "Lumen's workspace in Gait: applications (one per app per environment), their connection keys, and findings. Other workspaces can't see any of it.",
        nodes: ["hub", "team", "software"],
        paths: ["team", "software"],
        items: HUB_ITEMS,
    },
};

const EXPLORE_IDLE = {
    title: "Click any box",
    body: "Pick a box in the map to see what it does and which path it uses. Everything else dims.",
    nodes: ALL_NODES,
    paths: ALL_PATHS,
    items: HUB_ITEMS,
};

const ROLES = [
    {
        id: "owner",
        label: "Owner",
        body: "Everything an Admin can do, plus inviting or making Owners and retiring applications. A workspace always keeps at least one Owner.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    {
        id: "admin",
        label: "Admin",
        body: "Adds and renames applications, issues and revokes connection keys, invites Members and Admins, and acknowledges findings or accepts their risk.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    {
        id: "member",
        label: "Member",
        body: "Sees the workspace's applications, security and members. Can't change them.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    {
        id: "engineer",
        label: "Engineer shipping Lumen API",
        body: "Puts the connection key in Lumen API's environment and reports checks with gait-sdk. An Owner or Admin issues the key, and it's shown exactly once, so it goes straight into the secret store.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: ["keys", "findings"],
    },
    {
        id: "end-user",
        label: "End user",
        body: (earlyAccess) => `Signs in to Lumen with a Gait account${earlyAccess ? " (early access)" : ""}. Lumen, not Gait, decides which of its organizations and roles they get.`,
        nodes: ["users", "software"],
        paths: ["users"],
        items: [],
    },
];

const MODES = [
    { id: "tour", label: "Guided tour" },
    { id: "explore", label: "Explore" },
    { id: "role", label: "By role" },
];

function Node({ id, view, onSelect, selected, earlyAccess }) {
    const node = NODES[id];
    const dim = !view.nodes.includes(id);
    const className = `hiw-node hiw-node--${id}${dim ? " is-dim" : ""}${selected ? " is-selected" : ""}`;
    const content = (
        <>
            <span className="hiw-kicker">{resolve(node.kicker, earlyAccess)}</span>
            <span className="hiw-title">{node.title}</span>
            {node.detail && <span className="hiw-detail">{node.detail}</span>}
            {node.credential && <span className="hiw-credential">{node.credential}</span>}
            {id === "hub" && (
                <span className="hiw-hub-items">
                    {HUB_ITEMS.map((item) => (
                        <span key={item} className={`hiw-hub-item${view.items.includes(item) ? "" : " is-dim"}`}>
                            {item}
                        </span>
                    ))}
                </span>
            )}
        </>
    );
    if (onSelect) {
        return (
            <button type="button" className={className} aria-pressed={selected} onClick={() => onSelect(id)}>
                {content}
            </button>
        );
    }
    return <div className={className}>{content}</div>;
}

function Path({ id, view }) {
    const path = PATHS[id];
    const on = view.paths.includes(id);
    return (
        <div className={`hiw-path hiw-path--${id}${path.optional ? " is-optional" : ""}${on ? " is-on" : " is-dim"}`}>
            <span className="hiw-path-line" aria-hidden="true">
                <span className="hiw-path-packet" />
            </span>
            <span className="hiw-path-label">
                <span className="hiw-path-number">Path {path.number}</span>
                {path.label}
                <span aria-hidden="true"> ↓</span>
            </span>
        </div>
    );
}

export function HowItWorksLesson() {
    const [mode, setMode] = useState("tour");
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState(null);
    const [role, setRole] = useState(ROLES[0].id);
    const earlyAccess = isEarlyAccess();

    let view;
    let eyebrow;
    if (mode === "tour") {
        view = TOUR[step];
        eyebrow = `Guided tour · step ${step + 1} of ${TOUR.length}`;
    } else if (mode === "explore") {
        view = picked ? EXPLORE[picked] : EXPLORE_IDLE;
        eyebrow = "Explore";
    } else {
        const current = ROLES.find((entry) => entry.id === role);
        view = { ...current, title: current.label };
        eyebrow = "By role";
    }

    const onSelect = mode === "explore" ? (id) => setPicked((prev) => (prev === id ? null : id)) : null;

    return (
        <figure className="hiw" aria-labelledby="hiw-caption">
            <figcaption id="hiw-caption" className="doc-visually-hidden">
                I sign in to the console and work in Lumen's workspace inside Gait, which holds applications, keys and
                findings. Lumen, for example Lumen API in production, uses gait-sdk and a connection key to report
                security checks to that workspace. {earlyAccess ? "In early access, " : ""}Lumen's own users sign in
                with Gait, and Lumen decides what they can access.
            </figcaption>

            <div className="lesson-chrome hiw-modes" role="group" aria-label="Lesson mode">
                {MODES.map((entry) => (
                    <button
                        key={entry.id}
                        type="button"
                        className="hiw-mode"
                        aria-pressed={mode === entry.id}
                        onClick={() => setMode(entry.id)}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            {mode === "role" && (
                <div className="lesson-chrome hiw-roles" role="group" aria-label="Role">
                    {ROLES.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            className="hiw-role"
                            aria-pressed={role === entry.id}
                            onClick={() => setRole(entry.id)}
                        >
                            {entry.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="hiw-map">
                <ul className="lesson-chrome hiw-legend" aria-label="Legend">
                    <li className="hiw-legend-item hiw-legend-item--team">Me</li>
                    <li className="hiw-legend-item hiw-legend-item--software">Lumen</li>
                    <li className="hiw-legend-item hiw-legend-item--users">Lumen's users (dashed)</li>
                    <li className="hiw-legend-item hiw-legend-item--hub">Gait</li>
                </ul>
                <div className="hiw-area-users">
                    <Node id="users" view={view} onSelect={onSelect} selected={picked === "users"} earlyAccess={earlyAccess} />
                </div>
                <div className="hiw-area-path-users">
                    <Path id="users" view={view} />
                </div>
                <div className="hiw-area-team">
                    <Node id="team" view={view} onSelect={onSelect} selected={picked === "team"} earlyAccess={earlyAccess} />
                </div>
                <div className="hiw-area-software">
                    <Node id="software" view={view} onSelect={onSelect} selected={picked === "software"} earlyAccess={earlyAccess} />
                </div>
                <div className="hiw-area-path-team">
                    <Path id="team" view={view} />
                </div>
                <div className="hiw-area-path-software">
                    <Path id="software" view={view} />
                </div>
                <div className="hiw-area-hub">
                    <Node id="hub" view={view} onSelect={onSelect} selected={picked === "hub"} earlyAccess={earlyAccess} />
                </div>
            </div>

            <LessonCoach eyebrow={eyebrow} title={view.title} body={resolve(view.body, earlyAccess)} />

            {mode === "tour" && <LessonNav steps={TOUR} step={step} onStep={setStep} />}
        </figure>
    );
}
