/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live    a customer can do it in the console (or their own product) today
 *   pending not yet, including an API that exists but has no console screen
 */
export const STATUS_AS_OF = "2026-09-26";

export const FEATURE_STATUS = {
    // Stage E1: confirming your email address.
    emailVerification: "pending",
    // Stage F4: the console's Members screen and invite-accept page.
    membersAndInviteAccept: "pending",
    // Stage F3: the console's Findings screen (watch, acknowledge, accept
    // risk). The findings API is live, but without a screen it's pending.
    findingsScreen: "pending",
    // Everything else in the journeys: accounts, companies, applications,
    // keys, signals, and your product's own sign-in.
    core: "live",
};

export const STATUS_LABELS = {
    live: "Live",
    pending: "Pending",
};

export function statusOf(feature) {
    const status = FEATURE_STATUS[feature];
    if (!status) {
        throw new Error(`Unknown feature status: ${feature}`);
    }
    return status;
}
