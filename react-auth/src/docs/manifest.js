/**
 * Gait documentation — the list of pages.
 *
 * Gait is my internal security system: it protects Lumen and Gait itself, and
 * is not offered to other companies (GAIT-13). Write in the first person ("I",
 * "my apps") and use Lumen as the example app.
 *
 * SOURCE OF TRUTH: the pages under src/docs/ ARE Gait's public documentation
 * (served at https://gaitobservatory.com/docs). The copies that
 * used to live in the Gait repo (docs/console/GETTING_STARTED.md and the
 * public parts of IDENTITY_MODEL.md / INVITES_AND_JOINING.md) point here.
 * Change the public docs here, not there.
 *
 * Rules for everything under src/docs/:
 *   - Public-facing only. Never copy operator/internal material (API
 *     internals, deployment, runbooks) into these pages.
 *   - Examples use Lumen: workspace "lumen", application "lumen-api", and
 *     Lumen's own users at "Example Clinic". No real people or
 *     organization names. docsContent.test.js enforces FORBIDDEN_TERMS.
 *   - Example keys must never look like real keys.
 *   - Public pages: no session restore, no API calls.
 *
 * This file is plain data (no JSX) so RouteTitle can use it without pulling
 * in the page content.
 */

export const DOCS_BASE = "/docs";

// Sidebar groups, in reading order. Previous/next follows this order too.
export const DOC_GROUPS = [
    {
        title: "Start here",
        pages: [
            {
                slug: "what-gait-is",
                title: "What Gait is",
                summary: "The internal security system I built for my own apps: what it does, what it protects, and what it isn't.",
            },
            {
                slug: "how-it-works",
                title: "How it works",
                summary: "The big picture in one diagram, step by step.",
            },
            {
                slug: "quickstart",
                title: "Quickstart",
                summary: "How I take a new app from nothing to its first security check in about 15 minutes.",
            },
        ],
    },
    {
        title: "Concepts",
        pages: [
            {
                slug: "people-and-applications",
                title: "People and applications",
                summary: "The one idea to get right first: people and applications are different kinds of identity.",
            },
            {
                slug: "isolation",
                title: "Isolation and setup",
                summary: "How Gait keeps one workspace apart from another, and the four journeys that make up a working setup.",
            },
        ],
    },
    {
        title: "Guides",
        pages: [
            {
                slug: "getting-started",
                title: "Getting started",
                summary: "How I add an app: sign in, create its workspace, add an application and get its connection key.",
            },
            {
                slug: "two-step-verification",
                title: "Two-step verification",
                summary: "Turn it on, sign in with a code or a recovery code, and what to do if you lose your phone.",
            },
            {
                slug: "local-to-production",
                title: "Go from local to production",
                summary: "Add production (or staging, test, CI) next to local: one application and one key per environment.",
            },
            {
                slug: "security-checks-and-findings",
                title: "Security checks & findings",
                summary: "What Gait does with what an app reports, and how to act on a finding.",
            },
            {
                slug: "handle-a-finding",
                title: "Handle a finding",
                summary: "Find it, acknowledge it or accept the risk, and let a passing check resolve it.",
            },
            {
                slug: "teams-roles-and-invites",
                title: "Teams, roles & invites",
                summary: "Who can do what in a workspace, and how people join it.",
            },
            {
                slug: "applications-and-connection-keys",
                title: "Applications & connection keys",
                summary: "Environments, one-time keys, safe rotation, and suspending or retiring an application.",
            },
            {
                slug: "rotate-a-connection-key",
                title: "Rotate a connection key",
                summary: "Issue a new key, deploy it, check Last used, then revoke the old one.",
            },
            {
                slug: "product-organizations-and-invites",
                title: "An app's own organizations & invites",
                summary: "A pattern for an app's own organizations, roles, invites and sites, when its users sign in with Gait (as Lumen's do).",
            },
        ],
    },
    {
        title: "For developers",
        pages: [
            {
                slug: "add-gait-sign-in",
                title: "Add Gait sign-in to an app",
                summary: "How Lumen's users sign in with Gait: the app's server signs them in, gait-sdk checks each request.",
            },
            {
                slug: "gait-sdk",
                title: "gait-sdk",
                summary: "Gait's public, open-source Python package (MIT): install it, report a security check, and where to verify a user.",
            },
            {
                slug: "connecting-your-software",
                title: "Connecting an app",
                summary: "Install gait-sdk in an app, configure it, and report its first security check.",
            },
        ],
    },
    {
        title: "Security & trust",
        pages: [
            {
                slug: "how-gait-protects-your-data",
                title: "How Gait protects data",
                summary: "Workspace isolation, secrets Gait doesn't keep, the console session, and limits on repeated attempts.",
            },
            {
                slug: "report-a-vulnerability",
                title: "Report a vulnerability",
                summary: "How to tell me privately about a security problem in Gait or gait-sdk.",
            },
            {
                slug: "automated-security-response",
                title: "Automated security response",
                summary: "How Gait looks after its own platform, with a person approving every change that matters.",
            },
        ],
    },
    {
        title: "Reference",
        pages: [
            {
                slug: "glossary",
                title: "Glossary",
                summary: "The terms used across Gait, each linked to the page that explains it.",
            },
            {
                slug: "troubleshooting",
                title: "Troubleshooting",
                summary: "What an error means and what to do about it.",
            },
        ],
    },
    {
        title: "Help",
        pages: [
            {
                slug: "faq",
                title: "FAQ",
                summary: "Short answers to common questions, each linked to the page that explains it.",
            },
            {
                slug: "whats-live",
                title: "What's live & changelog",
                summary: "What works today, and what has changed recently.",
            },
        ],
    },
];

// Every page, flat, in reading order, each tagged with its group.
export const DOC_PAGES = DOC_GROUPS.flatMap((group) => group.pages.map((page) => ({ ...page, group: group.title })));

export function docPath(slug) {
    return `${DOCS_BASE}/${slug}`;
}

export function findDocPage(slug) {
    return DOC_PAGES.find((page) => page.slug === slug) || null;
}

export function docTitle(page) {
    return `${page.title} · Gait Docs`;
}
