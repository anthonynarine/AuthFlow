/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live         it works in the console (or in an app such as Lumen) today
 *   pending      not yet, including an API that exists but has no console screen
 *   earlyAccess  in early use and may still change
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
    // Sign-in for an app's own users (Lumen's) with Gait accounts (gait-sdk).
    productSignIn: "earlyAccess",
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
        name: "Sign-in for Lumen",
        summary: "Lumen's users sign in with Gait accounts, verified with gait-sdk.",
        doc: "add-gait-sign-in",
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
