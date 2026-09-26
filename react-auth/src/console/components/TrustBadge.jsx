import React from "react";
import { Badge } from "./ui/primitives";

/*
 * Where a result came from. Gait derives `trust` from each piece of evidence:
 * SELF_REPORTED when the company's own software reported it, GAIT_VERIFIED
 * when Gait produced or confirmed it. Always shown next to a result so a
 * self-reported PASS is never mistaken for independent verification.
 */
export const TRUST_LABELS = {
    SELF_REPORTED: "Self-reported",
    GAIT_VERIFIED: "Gait-verified",
};

const TRUST_EXPLANATIONS = {
    SELF_REPORTED: "Your software reported this about itself. Gait hasn't independently confirmed it.",
    GAIT_VERIFIED: "Gait produced or confirmed this evidence itself.",
};

export function TrustBadge({ trust }) {
    if (!trust) {
        return (
            <span title="Nothing has been reported for this yet.">
                <Badge value="UNKNOWN" label="No evidence yet" tone="muted" />
            </span>
        );
    }
    return (
        <span title={TRUST_EXPLANATIONS[trust] || ""}>
            <Badge value={trust} label={TRUST_LABELS[trust] || trust} />
        </span>
    );
}

/** One badge per distinct source, e.g. both when an environment mixes them. */
export function TrustSummary({ trusts, loading }) {
    if (loading) {
        return <span className="gc-muted">Checking source…</span>;
    }
    const distinct = Array.from(new Set(trusts.filter(Boolean)));
    if (distinct.length === 0) {
        return <TrustBadge trust={null} />;
    }
    return (
        <span className="gc-badge-row">
            {distinct.map((trust) => (
                <TrustBadge key={trust} trust={trust} />
            ))}
        </span>
    );
}

export default TrustBadge;
