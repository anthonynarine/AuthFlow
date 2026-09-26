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
 *   - Neutral examples only: company "acme", application "acme-api", a
 *     product's own users at "Example Clinic". No real customer names.
 *     docsContent.test.jsx enforces FORBIDDEN_TERMS.
 *   - Example keys must never look like real keys.
 *   - Public pages: no session restore, no API calls.
 *
 * This file is plain data (no JSX) so RouteTitle can use it without pulling
 * in the page content.
 */

export const DOCS_BASE = "/docs";

export const DOC_PAGES = [
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
    {
        slug: "getting-started",
        title: "Getting started",
        summary: "Sign in, create your company, add an application and get its connection key.",
    },
    {
        slug: "connecting-your-software",
        title: "Connecting your software",
        summary: "Install the Gait SDK, configure it, and report your first security check.",
    },
    {
        slug: "security-checks-and-findings",
        title: "Security checks & findings",
        summary: "What Gait does with what your application reports, and how to act on a finding.",
    },
    {
        slug: "teams-roles-and-invites",
        title: "Teams, roles & invites",
        summary: "Who can do what in your company, and how people join it.",
    },
    {
        slug: "applications-and-connection-keys",
        title: "Applications & connection keys",
        summary: "Environments, one-time keys, safe rotation, and suspending or retiring an application.",
    },
    {
        slug: "troubleshooting",
        title: "Troubleshooting",
        summary: "What an error means and what to do about it.",
    },
];

export function docPath(slug) {
    return `${DOCS_BASE}/${slug}`;
}

export function findDocPage(slug) {
    return DOC_PAGES.find((page) => page.slug === slug) || null;
}

export function docTitle(page) {
    return `${page.title} · Gait Docs`;
}
