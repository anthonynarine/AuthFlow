import React, { useState } from "react";
import "./how-it-works.css";

/*
 * "How it works" as a lesson instead of a poster: the same four boxes and
 * three paths as the old mermaid diagram, but shown one path at a time.
 * Every box, path and step carries its own label. One color per actor,
 * matching the rest of the docs:
 *   team #1abc9c (teal)   software #a78bfa (purple)
 *   users #fb8a5c (orange, dashed: optional)   Gait #38bdf8 (cyan)
 * Plain HTML/CSS, no mermaid, so it renders the same in search's static pass.
 */

const NODES = {
    team: { kicker: "Humans in the console", title: "Your team", detail: "Owner · Admin · Member" },
    software: {
        kicker: "Production runtime",
        title: "Your software",
        detail: "Acme API · production",
        credential: "gait-sdk + connection key",
    },
    users: {
        kicker: "Optional · early access",
        title: "Your product's users",
        detail: "People who use your product, not your team",
    },
    hub: { kicker: "Gait", title: "Company: Acme" },
};

const HUB_ITEMS = ["applications", "keys", "findings"];

const PATHS = {
    team: { number: 1, label: "signs in to the console" },
    software: { number: 2, label: "reports security checks" },
    users: { number: 3, label: "signs in with Gait · your product decides access", optional: true },
};

const ALL_NODES = ["team", "software", "users", "hub"];
const ALL_PATHS = ["team", "software", "users"];

const TOUR = [
    {
        title: "The whole map",
        body: "Four boxes, three paths. Gait isn't a fourth actor next to the others: it's the company workspace where the other three meet.",
        nodes: ALL_NODES,
        paths: ALL_PATHS,
        items: HUB_ITEMS,
    },
    {
        title: "Start with the hub",
        body: "Your company in Gait (here, Acme) holds three things: the applications you register, their connection keys, and the findings their reports produce. Every path ends here.",
        nodes: ["hub"],
        paths: [],
        items: ["applications", "keys"],
    },
    {
        title: "Path 1 · Your team configures",
        body: "People sign in to the Gait console and work inside Acme. Owners and Admins add applications, issue connection keys and act on findings. Members can see all of it but not change it.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: ["applications", "keys"],
    },
    {
        title: "Path 2 · Your software reports",
        body: "Acme API runs its own checks (for example \"debug mode is off\") and sends PASS or FAIL with the gait-sdk. The connection key it holds tells Gait which application, and so which company, the report belongs to. A FAIL opens a finding; a later PASS closes it.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: HUB_ITEMS,
    },
    {
        title: "Path 3 · Your users may sign in (optional)",
        body: "In early access, your product can let its own users sign in with Gait accounts. Gait tells your product who someone is; your product still decides what they can open. Authentication is Gait's job, authorization stays yours.",
        nodes: ["users", "software"],
        paths: ["users"],
        items: [],
    },
    {
        title: "Recap",
        body: "Team configures. Software reports. Users may authenticate. All of it lands in the same company workspace, and your team never talks to your software directly: they only meet inside Gait.",
        nodes: ALL_NODES,
        paths: ALL_PATHS,
        items: HUB_ITEMS,
    },
];

const EXPLORE = {
    team: {
        title: "Your team",
        body: "Signs in to the console. Owners and Admins add applications, issue and revoke connection keys, and act on findings. Members can see the company's applications, security and members.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    software: {
        title: "Your software",
        body: "Holds one connection key, for one application in one environment. It can report security checks for that application and nothing else: a key can't sign in, invite anyone or read anything.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: ["findings"],
    },
    users: {
        title: "Your product's users",
        body: "Optional, early access. They sign in to your product with a Gait account; your product decides what they can do. They aren't members of your Gait company.",
        nodes: ["users", "software"],
        paths: ["users"],
        items: [],
    },
    hub: {
        title: "Company: Acme",
        body: "Your company workspace in Gait: applications (one per piece of software per environment), their connection keys, and findings. Other companies can't see any of it.",
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
        body: "Everything an Admin can do, plus inviting or making Owners and retiring applications. A company always keeps at least one Owner.",
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
        body: "Sees the company's applications, security and members. Can't change them.",
        nodes: ["team", "hub"],
        paths: ["team"],
        items: HUB_ITEMS,
    },
    {
        id: "engineer",
        label: "Engineer shipping Acme API",
        body: "Puts the connection key in Acme API's environment and reports checks with the gait-sdk. An Owner or Admin issues the key, and it's shown exactly once, so it goes straight into your secret store.",
        nodes: ["software", "hub"],
        paths: ["software"],
        items: ["keys", "findings"],
    },
    {
        id: "end-user",
        label: "End user",
        body: "Signs in to your product with a Gait account (early access). Your product, not Gait, decides which of your organizations and roles they get.",
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

function Node({ id, view, onSelect, selected }) {
    const node = NODES[id];
    const dim = !view.nodes.includes(id);
    const className = `hiw-node hiw-node--${id}${dim ? " is-dim" : ""}${selected ? " is-selected" : ""}`;
    const content = (
        <>
            <span className="hiw-kicker">{node.kicker}</span>
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
                Your team (Owner, Admin, Member) signs in to the console and works in the company Acme inside Gait,
                which holds applications, keys and findings. Your software, such as Acme API in production, uses the
                gait-sdk and a connection key to report security checks to that company. Optionally, in early access,
                your product's own users sign in with Gait, and your product decides what they can access.
            </figcaption>

            <div className="hiw-chrome hiw-modes" role="group" aria-label="Lesson mode">
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
                <div className="hiw-chrome hiw-roles" role="group" aria-label="Role">
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
                <ul className="hiw-chrome hiw-legend" aria-label="Legend">
                    <li className="hiw-legend-item hiw-legend-item--team">Team</li>
                    <li className="hiw-legend-item hiw-legend-item--software">Software</li>
                    <li className="hiw-legend-item hiw-legend-item--users">Users (dashed: optional)</li>
                    <li className="hiw-legend-item hiw-legend-item--hub">Gait</li>
                </ul>
                <div className="hiw-area-users">
                    <Node id="users" view={view} onSelect={onSelect} selected={picked === "users"} />
                </div>
                <div className="hiw-area-path-users">
                    <Path id="users" view={view} />
                </div>
                <div className="hiw-area-team">
                    <Node id="team" view={view} onSelect={onSelect} selected={picked === "team"} />
                </div>
                <div className="hiw-area-software">
                    <Node id="software" view={view} onSelect={onSelect} selected={picked === "software"} />
                </div>
                <div className="hiw-area-path-team">
                    <Path id="team" view={view} />
                </div>
                <div className="hiw-area-path-software">
                    <Path id="software" view={view} />
                </div>
                <div className="hiw-area-hub">
                    <Node id="hub" view={view} onSelect={onSelect} selected={picked === "hub"} />
                </div>
            </div>

            <div className="hiw-coach" aria-live="polite">
                <p className="hiw-chrome hiw-eyebrow">{eyebrow}</p>
                <p className="hiw-coach-title">{view.title}</p>
                <p className="hiw-coach-body">{view.body}</p>
            </div>

            {mode === "tour" && (
                <div className="hiw-chrome hiw-nav">
                    <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                        Back
                    </button>
                    <ol className="hiw-dots" aria-label="Tour steps">
                        {TOUR.map((entry, index) => (
                            <li key={entry.title}>
                                <button
                                    type="button"
                                    className="hiw-dot"
                                    aria-label={`Step ${index + 1}: ${entry.title}`}
                                    aria-current={index === step ? "step" : undefined}
                                    onClick={() => setStep(index)}
                                />
                            </li>
                        ))}
                    </ol>
                    <button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === TOUR.length - 1}>
                        Next
                    </button>
                </div>
            )}
        </figure>
    );
}
