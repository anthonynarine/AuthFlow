/*
 * Who may do what to whom, mirroring Gait's own checks
 * (organizations/membership_services.py). The UI hides what a role can't
 * do; Gait still enforces it (403 / 409 LAST_OWNER).
 */
export const ROLES = ["OWNER", "ADMIN", "MEMBER"];

export const ROLE_LABELS = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

export const ROLE_DESCRIPTIONS = {
    OWNER: "Full control, including other Owners and retiring applications.",
    ADMIN: "Manages applications, keys, findings and people, except Owners.",
    MEMBER: "Sees the company's applications, findings and members, but can't change them.",
};

const isManager = (role) => role === "OWNER" || role === "ADMIN";

export function ownerCount(members) {
    return members.filter((member) => member.org_role === "OWNER").length;
}

/** The roles this actor may give anyone (Owner only for Owners). */
export function assignableRoles(actorRole) {
    if (actorRole === "OWNER") return ROLES;
    if (actorRole === "ADMIN") return ["ADMIN", "MEMBER"];
    return [];
}

/** Can the actor change this member's role at all? (Only Owners touch Owners.) */
export function canChangeRole(actorRole, target) {
    if (!isManager(actorRole)) return false;
    return target.org_role !== "OWNER" || actorRole === "OWNER";
}

/** Remove someone else (leaving is always allowed, subject to last-owner). */
export function canRemove(actorRole, target) {
    if (target.is_you) return false;
    if (!isManager(actorRole)) return false;
    return target.org_role !== "OWNER" || actorRole === "OWNER";
}

/** Would this change leave the company without an Owner? */
export function wouldRemoveLastOwner(members, target) {
    return target.org_role === "OWNER" && ownerCount(members) <= 1;
}

export function canManageInvites(actorRole) {
    return isManager(actorRole);
}

/** Owner invites can only be revoked (or resent) by Owners. */
export function canRevokeInvite(actorRole, invite) {
    if (!isManager(actorRole)) return false;
    return invite.org_role !== "OWNER" || actorRole === "OWNER";
}

export const LAST_OWNER_HELP =
    "A company always keeps at least one Owner. Make someone else an Owner first, then try again.";

export function memberName(member) {
    const name = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
    return name || member.email;
}

/** "in 6 days", "in 1 day", "today". */
export function expiresIn(expiresAt, now = Date.now()) {
    const days = Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "today";
    return days === 1 ? "in 1 day" : `in ${days} days`;
}
