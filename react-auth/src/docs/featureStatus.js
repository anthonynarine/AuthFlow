/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live         a customer can do it in the console (or their own product) today
 *   pending      not yet, including an API that exists but has no console screen
 *   earlyAccess  available to early-access customers only
 */
export const STATUS_AS_OF = "2026-09-26";

export const FEATURE_STATUS = {
    // Stage E1: confirming your email address.
    emailVerification: "pending",
    // Stage F4: the console's Members screen and invite-accept page.
    membersAndInviteAccept: "pending",
    // Stage F3: the console's Findings screen (watch, acknowledge, accept
    // risk). Shipped with F3.
    findingsScreen: "live",
    // Sign-in for your own product's users with Gait accounts (gait-sdk).
    productSignIn: "earlyAccess",
    // Everything else: accounts, companies, applications, keys, signals.
    core: "live",
};

export const STATUS_LABELS = {
    live: "Live",
    pending: "Pending",
    earlyAccess: "Early access",
};

/** STATUS_AS_OF as "26 September 2026". */
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
