/**
 * Gait customer documentation — the list of pages.
 *
 * SOURCE OF TRUTH: the pages under src/docs/ ARE Gait's customer-facing
 * documentation (served at https://gaitobservatory.com/docs). The copies that
 * used to live in the Gait repo (docs/console/GETTING_STARTED.md and the
 * customer parts of IDENTITY_MODEL.md / INVITES_AND_JOINING.md) point here.
 * Change customer docs here, not there.
 *
 * Rules for everything under src/docs/:
 *   - Customer-facing only. Never copy operator/internal material (API
 *     internals, deployment, runbooks) into these pages.
 *   - Neutral examples only: workspace "acme", application "acme-api", a
 *     product's own users at "Example Clinic". No real customer names.
 *     docsContent.test.jsx enforces FORBIDDEN_TERMS.
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
                summary: "What Gait does for your team, who it's for, and what it isn't.",
            },
            {
                slug: "how-it-works",
                title: "How it works",
                summary: "The big picture in one diagram, step by step.",
            },
            {
                slug: "quickstart",
                title: "Quickstart",
                summary: "From nothing to your first security check in about 15 minutes.",
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
                summary: "How Gait keeps one customer apart from another, and the four journeys that make up a working setup.",
            },
        ],
    },
    {
        title: "Guides",
        pages: [
            {
                slug: "getting-started",
                title: "Getting started",
                summary: "Sign in, create your workspace, add an application and get its connection key.",
            },
            {
                slug: "local-to-production",
                title: "Go from local to production",
                summary: "Add production (or staging, test, CI) next to local: one application and one key per environment.",
            },
            {
                slug: "security-checks-and-findings",
                title: "Security checks & findings",
                summary: "What Gait does with what your application reports, and how to act on a finding.",
            },
            {
                slug: "handle-a-finding",
                title: "Handle a finding",
                summary: "Find it, acknowledge it or accept the risk, and let a passing check resolve it.",
            },
            {
                slug: "teams-roles-and-invites",
                title: "Teams, roles & invites",
                summary: "Who can do what in your workspace, and how people join it.",
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
                title: "Your product's organizations & invites",
                summary: "A pattern for your product's own customers, roles, invites and sites, when its users sign in with Gait.",
            },
        ],
    },
    {
        title: "For developers",
        pages: [
            {
                slug: "gait-sdk",
                title: "gait-sdk",
                summary: "Gait's Python package: install it, report a security check, verify a user.",
            },
            {
                slug: "connecting-your-software",
                title: "Connecting your software",
                summary: "Install the Gait SDK, configure it, and report your first security check.",
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
        title: "Gait's platform",
        pages: [
            {
                slug: "automated-security-response",
                title: "Automated security response",
                summary: "How Gait looks after its own platform, with people in charge of every change that matters.",
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
