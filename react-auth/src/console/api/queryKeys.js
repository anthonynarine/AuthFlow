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
};
