/**
 * Live/Pending status shown on docs pages. Update here when something ships;
 * pages only reference these keys.
 *
 *   live    works in production today
 *   pending built or planned, not deployed yet
 */
export const STATUS_AS_OF = "2026-09-26";

export const FEATURE_STATUS = {
    // Stage E1: confirming your email address.
    emailVerification: "pending",
    // Stage F4: the console's Members screen and invite-accept page.
    membersAndInviteAccept: "pending",
    // The invite API itself (create, revoke, preview, accept).
    inviteApi: "live",
    // Everything else in the journeys: accounts, companies, applications,
    // keys, signals, findings, and your product's own sign-in.
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
