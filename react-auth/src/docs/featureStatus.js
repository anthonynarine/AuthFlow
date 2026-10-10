/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live         it works in the console (or in an app such as Lumen) today
 *   pending      not yet, including an API that exists but has no console screen
 *   earlyAccess  in early use and may still change
 *   inDevelopment  works in an app that is itself still in development (not in production)
 *   inProgress     built but not yet running; not live
 *
 * Lumen is in development, not in production (GAIT-13 review). It signs in
 * through Gait with gait-sdk; its security-check reporting is built but not yet
 * running. Every claim about Lumen using Gait points at `lumenSignIn` or
 * `lumenChecks`, never at a live key.
 */
export const STATUS_AS_OF = "2026-09-28";

export const FEATURE_STATUS = {
    // Stage E1: confirming your email address. Live with the E1-E3 release.
    emailVerification: "live",
    // Stage F4: the console's Members screen and invite-accept page.
    // Shipped with F4.
    membersAndInviteAccept: "live",
    // Stage F3: the console's Findings screen (watch, acknowledge, accept
    // risk). Shipped with F3.
    findingsScreen: "live",
    // Two-step verification (authenticator codes) and recovery codes, from the
    // Account page. Shipped with the AUTH-B release on 2026-09-28.
    twoStepVerification: "live",
    // Sign-in for an app's own users with Gait accounts (gait-sdk), on Gait's side.
    productSignIn: "earlyAccess",
    // Lumen signs in through Gait with gait-sdk, but Lumen itself is still in
    // development. Flip to "live" only when Lumen is in production on it.
    lumenSignIn: "inDevelopment",
    // Lumen's gait-sdk self-check command exists but has never reported to Gait.
    lumenChecks: "inProgress",
    // CHK2a/2b: the built-in check packs (Django, FastAPI, deps via
    // `gait_check`) and the console's per-application checks grid. Flip to "live" once
    // gait-sdk 0.6.0 is on PyPI.
    checkPacks: "earlyAccess",
    // Everything else: accounts, workspaces, applications, keys, signals.
    core: "live",
};

/**
 * What each status key covers, for the "What's live" page: a public-facing
 * name, one line, and the docs page that explains it. Statuses themselves stay
 * in FEATURE_STATUS above. Every key there needs an entry here (a test checks).
 */
export const FEATURE_INFO = {
    core: {
        name: "Workspaces, applications, connection keys and security checks",
        summary: "A private workspace per app, one application per environment, keys shown once, and the checks each app reports.",
        doc: "getting-started",
    },
    emailVerification: {
        name: "Confirming your email address",
        summary: "Needed before you create a workspace or join one.",
        doc: "getting-started#step-1-sign-in",
    },
    membersAndInviteAccept: {
        name: "Members and invites in the console",
        summary: "Invite people into a workspace as Owner, Admin or Member, and accept an invite.",
        doc: "teams-roles-and-invites",
    },
    findingsScreen: {
        name: "Findings screen",
        summary: "See findings per environment, acknowledge them or accept the risk with a note.",
        doc: "handle-a-finding",
    },
    twoStepVerification: {
        name: "Two-step verification and recovery codes",
        summary: "A code from an authenticator app after your password, with 10 one-time recovery codes.",
        doc: "two-step-verification",
    },
    productSignIn: {
        name: "Sign-in for an app's own users",
        summary: "An app's users sign in with Gait accounts, verified with gait-sdk.",
        doc: "add-gait-sign-in",
    },
    lumenSignIn: {
        name: "Lumen signs in through Gait",
        summary: "Lumen, my clinical app, is in development. It signs in through Gait with gait-sdk.",
        doc: "what-gait-is#who-its-for",
    },
    lumenChecks: {
        name: "Lumen reports its security checks",
        summary: "Lumen's security-check reporting with gait-sdk is built but not yet running.",
        doc: "what-gait-is#who-its-for",
    },
    checkPacks: {
        name: "Built-in check packs",
        summary: "gait-sdk checks your Django or FastAPI settings and your dependencies; each application's results appear in the console.",
        doc: "gait-sdk",
    },
};

export const STATUS_LABELS = {
    live: "Live",
    pending: "Pending",
    earlyAccess: "Early access",
    inDevelopment: "In development",
    inProgress: "In progress",
};

/** STATUS_AS_OF as "28 September 2026". */
export function statusAsOfLabel() {
    const [year, month, day] = STATUS_AS_OF.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function statusOf(feature) {
    const status = FEATURE_STATUS[feature];
    if (!status) {
        throw new Error(`Unknown feature status: ${feature}`);
    }
    return status;
}
