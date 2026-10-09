import React from "react";
import { SequenceLesson } from "./SequenceLesson";

/*
 * "How an application gets its key": two scenes. A person sets things up
 * once in the console (1-4), then the backend reports on its own, whenever
 * it runs its checks (5-6). Same messages as the old mermaid sequence diagram.
 */

const LANES = [
    { id: "admin", label: "Owner or Admin", tone: "person" },
    { id: "console", label: "Gait console", tone: "console" },
    { id: "gait", label: "Gait", tone: "gait" },
    { id: "backend", label: "Lumen's backend", tone: "software" },
];

const BLOCKS = [
    {
        kind: "steps",
        label: "Set up once: steps 1 to 4",
        tone: "person",
        messages: [
            { n: 1, from: "admin", to: "console", text: "Add application (name, slug, environment)" },
            { n: 2, from: "admin", to: "console", text: "Issue a connection key (label)" },
            { n: 3, from: "gait", to: "admin", text: "Key shown once (Gait keeps only a fingerprint)" },
            { n: 4, from: "admin", to: "backend", text: "Store the key in the backend's secret settings" },
        ],
    },
    {
        kind: "frame",
        label: "Loop · whenever Lumen's backend runs its checks",
        branches: [
            {
                id: "loop",
                label: null,
                tone: "software",
                messages: [
                    { n: 5, from: "backend", to: "gait", text: "Report a security check (with the key)" },
                    { n: 6, from: "gait", to: "backend", text: "Recorded for lumen / lumen-api / production" },
                ],
            },
        ],
    },
];

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const BEATS = [
    {
        title: "Four lanes, two scenes",
        body: "First a person sets things up once, in the console. After that the app's backend talks to Gait on its own, whenever it runs its checks, with no person involved.",
        live: [],
        shown: [],
    },
    {
        title: "Add the application",
        body: "An Owner or Admin adds an application with a name, a slug and one environment. Lumen API in local and Lumen API in production are two separate applications.",
        live: [1],
        shown: [1],
    },
    {
        title: "Issue a connection key",
        body: "They issue a connection key for it, with a label that says where the key will live (for example \"prod server, Sept rotation\"), so the right key can be revoked later.",
        live: [2],
        shown: range(1, 2),
    },
    {
        title: "Shown exactly once",
        body: "Gait shows the key once and keeps only an irreversible fingerprint, so nobody, including Gait, can show it again. Lost it? Revoke it and issue a new one.",
        live: [3],
        shown: range(1, 3),
    },
    {
        title: "Store it in the backend",
        body: "The key goes into the backend's secret settings, as GAIT_APPLICATION_CREDENTIAL. From here on the backend holds the key; Gait holds only its fingerprint.",
        live: [4],
        shown: range(1, 4),
    },
    {
        title: "Whenever Lumen's backend runs its checks",
        body: "The backend reports a security check with the key. The key alone tells Gait which application, and so which workspace and environment, the result belongs to: lumen / lumen-api / production.",
        live: [5, 6],
        shown: range(1, 6),
    },
    {
        title: "Recap",
        body: "People set up; software reports. The key is shown once in the console, lives only in the backend, and is the only credential the backend needs to report.",
        live: [],
        shown: range(1, 6),
    },
];

export function AppGetsKeyLesson() {
    return (
        <SequenceLesson
            captionId="app-gets-key-caption"
            caption="An Owner or Admin adds an application with a name, slug and environment, then issues a connection key. Gait shows the key once and keeps only a fingerprint of it. The key goes into the backend's secret settings, and from then on the backend reports security checks with it, which Gait records for that workspace, application and environment."
            lanes={LANES}
            blocks={BLOCKS}
            beats={BEATS}
        />
    );
}
