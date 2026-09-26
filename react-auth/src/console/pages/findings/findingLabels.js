// Values Gait accepts for the findings filters (security/models.py).
export const FINDING_STATUS_OPTIONS = [
    ["OPEN", "Open"],
    ["ACKNOWLEDGED", "Acknowledged"],
    ["ACCEPTED_RISK", "Accepted risk"],
    ["RESOLVED", "Resolved"],
    ["FALSE_POSITIVE", "False positive"],
];

export const SEVERITY_OPTIONS = [
    ["CRITICAL", "Critical"],
    ["HIGH", "High"],
    ["WARNING", "Warning"],
    ["INFO", "Info"],
];

// Every finding note is 10-2000 characters after trimming (Gait's rule).
export const NOTE_MIN = 10;
export const NOTE_MAX = 2000;

/**
 * Which application a finding is about. Tenant findings record the
 * application's id in metadata and its slug in `affected_system`; the name
 * comes from the company's own application list when it has loaded.
 */
export function applicationLabel(finding, applications) {
    const id = finding.metadata?.application_id;
    const match = id && (applications || []).find((application) => application.id === id);
    if (match) return match.name;
    return finding.affected_system || "—";
}
