import React from "react";
import { StatusBadge } from "./DocPrimitives";
import { statusOf } from "../featureStatus";

// What a Pending item is waiting for, in customer words.
const WAITING_ON = {
    findingsScreen: "Findings screen",
    membersAndInviteAccept: "Members screen",
    emailVerification: "email confirmation",
};

/**
 * A status for a table cell. Pending if any listed feature is pending, with
 * what it's waiting on ("Members screen, email confirmation"); otherwise the
 * first feature's status. Flipping a key in featureStatus.js updates both.
 */
export function StatusCell({ features }) {
    const pending = features.filter((feature) => statusOf(feature) === "pending");
    const status = pending.length > 0 ? "pending" : statusOf(features[0]);
    const waitingOn = pending.map((feature) => WAITING_ON[feature]).filter(Boolean);
    return (
        <span className="doc-status-cell">
            <StatusBadge status={status} />
            {waitingOn.length > 0 && <span className="doc-status-note">{waitingOn.join(", ")}</span>}
        </span>
    );
}

export default StatusCell;
