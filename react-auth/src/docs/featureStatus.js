/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live         a customer can do it in the console (or their own product) today
 *   pending      not yet, including an API that exists but has no console screen
 *   earlyAccess  available to early-access customers only
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
    // Sign-in for your own product's users with Gait accounts (gait-sdk).
    productSignIn: "earlyAccess",
    // Everything else: accounts, workspaces, applications, keys, signals.
    core: "live",
};

/**
 * What each status key covers, for the "What's live" page: a customer-facing
 * name, one line, and the docs page that explains it. Statuses themselves stay
 * in FEATURE_STATUS above. Every key there needs an entry here (a test checks).
 */
export const FEATURE_INFO = {
    core: {
        name: "Workspaces, applications, connection keys and security checks",
        summary: "Your private workspace, one application per environment, keys shown once, and the checks your software reports.",
        doc: "getting-started",
    },
    emailVerification: {
        name: "Confirming your email address",
        summary: "Needed before you create a workspace or join one.",
        doc: "getting-started#step-1-sign-in",
    },
    membersAndInviteAccept: {
        name: "Members and invites in the console",
        summary: "Invite teammates as Owner, Admin or Member, and accept an invite.",
        doc: "teams-roles-and-invites",
    },
    findingsScreen: {
        name: "Findings screen",
        summary: "See findings per environment, acknowledge them or accept the risk with a note.",
        doc: "handle-a-finding",
    },
    productSignIn: {
        name: "Sign-in for your own product",
        summary: "Your product's users sign in with Gait accounts, verified with the gait-sdk.",
        doc: "product-organizations-and-invites",
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
