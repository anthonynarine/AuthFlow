/**
 * Customer-visible changes, newest first, for the "What's live & changelog"
 * page. History only: current status always comes from featureStatus.js
 * (`features` lists the keys whose badges the page shows next to an entry).
 *
 * A date is when the change reached customers, with evidence noted per entry:
 * the website (gaitobservatory.com) deploys when a pull request merges to main,
 * so its merge date is its release date; the Gait API is released separately,
 * so an API change is dated only from a recorded production release. Leave out
 * anything without that evidence, and anything internal to Gait.
 */
export const CHANGELOG = [
    {
        date: "2026-09-28",
        // API INV1 (release v126) + console INV-UX (AuthFlow #14, merged 2026-09-28).
        change: "Accept an invite from the email address you've confirmed, without needing the link.",
        features: ["membersAndInviteAccept"],
        doc: "teams-roles-and-invites#joining-needs-proof",
    },
    {
        date: "2026-09-28",
        // AuthFlow #15 (merged 2026-09-28); API wording released the same day.
        change: "\"Company\" is now \"workspace\" everywhere you read it: the console, emails and these docs.",
        features: [],
        doc: null,
    },
    {
        date: "2026-09-28",
        // AuthFlow #18 (merged 2026-09-28).
        change: "One Docs home, with a For developers group and a gait-sdk page.",
        features: [],
        doc: "gait-sdk",
    },
    {
        date: "2026-09-27",
        // AuthFlow #9 (F4) + DEVELOPER_HANDBOOK: "Production at that date [2026-09-27]: ... F1-F4 and email verification live".
        change: "Members in the console: invite teammates, see recent activity, and accept an invite.",
        features: ["membersAndInviteAccept"],
        doc: "teams-roles-and-invites",
    },
    {
        date: "2026-09-27",
        // DEVELOPER_HANDBOOK (production at 2026-09-27, API release v125, "email verification live").
        change: "Confirm your email address. It's needed before you create a workspace or join one.",
        features: ["emailVerification"],
        doc: "getting-started#step-1-sign-in",
    },
    {
        date: "2026-09-26",
        // AuthFlow #7 (F1-F3, merged 2026-09-26); the API they use was live from release v121 (2026-09-25).
        change: "Console screens for your workspace: Overview, Applications and connection keys, and Findings (acknowledge or accept the risk).",
        features: ["core", "findingsScreen"],
        doc: "handle-a-finding",
    },
    {
        date: "2026-09-26",
        // AuthFlow #3 (merged 2026-09-26).
        change: "Customer documentation at gaitobservatory.com/docs.",
        features: [],
        doc: "what-gait-is",
    },
    {
        date: "2026-09-25",
        // PyPI uploads dated 2026-09-25; gait-sdk tags v0.5.0 and v0.5.1.
        change: "gait-sdk 0.5.0 and 0.5.1 on PyPI (pip install gait-sdk).",
        features: [],
        doc: "gait-sdk",
    },
];
