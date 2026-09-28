import { ROLE_LABELS } from "./memberRules";

const role = (value) => ROLE_LABELS[value] || value;

// INV1: how an invite was accepted. Older rows have none.
const ACCEPTED_VIA = {
    LINK: " using the invite link",
    VERIFIED_EMAIL: " with their confirmed email",
};

/**
 * One membership activity row as a plain sentence. Gait records emails, not
 * names. A deleted actor is "a deleted account"; MEMBER_REMOVED where actor
 * and target are the same person means they left.
 */
export function activitySentence(row) {
    const actor = row.actor_email || "a deleted account";
    const target = row.target_email;
    switch (row.action) {
        case "INVITE_CREATED":
            return `${actor} invited ${target} as ${role(row.to_role)}`;
        case "INVITE_REVOKED":
            return `${actor} revoked the invite for ${target}`;
        case "INVITE_ACCEPTED":
            return `${target} joined as ${role(row.to_role)}${ACCEPTED_VIA[row.accepted_via] || ""}`;
        case "ROLE_CHANGED":
            return `${actor} changed ${target} from ${role(row.from_role)} to ${role(row.to_role)}`;
        case "MEMBER_REMOVED":
            return row.actor_email && row.actor_email === target
                ? `${target} left the company`
                : `${actor} removed ${target}`;
        case "ORGANIZATION_RENAMED":
            return `${actor} renamed the company from "${row.from_name}" to "${row.to_name}"`;
        default:
            return `${actor}: ${String(row.action || "").toLowerCase().replace(/_/g, " ")}`;
    }
}
