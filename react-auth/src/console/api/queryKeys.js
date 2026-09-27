/**
 * Query keys for the Gait console.
 *
 * Isolation rule: everything that belongs to an organization is keyed
 * ["console", organizationSlug, environment, ...]. Two organizations (or
 * two environments of one organization) can therefore never share a cache
 * entry, even for the same endpoint shape. The only unscoped key is the
 * caller's own organization list.
 */
export const consoleKeys = {
    myOrganizations: () => ["console", "me", "organizations"],
    scope: (organizationSlug, environment) => ["console", organizationSlug, environment || "all"],
    postureOverview: (organizationSlug) => ["console", organizationSlug, "all", "posture-overview"],
    posture: (organizationSlug, environment) => ["console", organizationSlug, environment, "posture"],
    controls: (organizationSlug, environment) => ["console", organizationSlug, environment, "controls"],
    latestEvidence: (organizationSlug, environment, controlKey) => [
        "console",
        organizationSlug,
        environment,
        "evidence",
        "latest",
        controlKey,
    ],
    // The application list covers every environment (the console filters it),
    // so it's keyed "all"; everything about one application hangs off its id.
    applications: (organizationSlug) => ["console", organizationSlug, "all", "applications"],
    application: (organizationSlug, applicationId) => ["console", organizationSlug, "all", "applications", applicationId],
    applicationActivity: (organizationSlug, applicationId) => [
        ...consoleKeys.application(organizationSlug, applicationId),
        "activity",
    ],
    credentials: (organizationSlug, applicationId) => [
        ...consoleKeys.application(organizationSlug, applicationId),
        "credentials",
    ],
    // F3. The list is per environment and filter set; one finding or one
    // piece of evidence is addressed by id.
    findings: (organizationSlug, environment, filters) => ["console", organizationSlug, environment, "findings", filters],
    finding: (organizationSlug, findingId) => ["console", organizationSlug, "all", "findings", findingId],
    evidence: (organizationSlug, evidenceId) => ["console", organizationSlug, "all", "evidence", evidenceId],
    // F4. Membership and company settings don't depend on the environment.
    members: (organizationSlug) => ["console", organizationSlug, "all", "members"],
    memberActivity: (organizationSlug, page) => ["console", organizationSlug, "all", "member-activity", page],
    organization: (organizationSlug) => ["console", organizationSlug, "all", "organization"],
};

/** True for a cached query that belongs to an organization other than `organizationSlug`. */
export function belongsToOtherOrganization(queryKey, organizationSlug) {
    return queryKey[0] === "console" && queryKey[1] !== "me" && queryKey[1] !== organizationSlug;
}
