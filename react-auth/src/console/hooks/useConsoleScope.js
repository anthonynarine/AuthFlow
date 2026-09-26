import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchMyOrganizations, fetchPostureOverview } from "../api/consoleApi";
import { belongsToOtherOrganization, consoleKeys } from "../api/queryKeys";

export const ENVIRONMENTS = ["production", "staging", "test", "ci", "local"];
export const ENVIRONMENT_LABELS = {
    production: "Production",
    staging: "Staging",
    test: "Test",
    ci: "CI",
    local: "Local",
};

/** The caller's own organizations (ACTIVE memberships only, per Gait). */
export function useMyOrganizations({ enabled = true } = {}) {
    return useQuery({
        queryKey: consoleKeys.myOrganizations(),
        queryFn: fetchMyOrganizations,
        enabled,
    });
}

/**
 * The organization + environment the console is currently showing.
 *
 * - organization: from the URL (/console/:orgSlug/...). `membership` is the
 *   caller's own row for it, or null if they are not a member -- the layout
 *   refuses to render tenant pages in that case (and Gait would 404 anyway).
 * - environment: from ?env=, defaulting to the first environment that has
 *   data, then production.
 */
export function useConsoleScope() {
    const { orgSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const organizations = useMyOrganizations();
    const queryClient = useQueryClient();

    // Switching company drops everything cached for any other company, so
    // one company's data can never be shown (even briefly) under another.
    useEffect(() => {
        queryClient.removeQueries({ predicate: (query) => belongsToOtherOrganization(query.queryKey, orgSlug) });
    }, [queryClient, orgSlug]);

    const membership = useMemo(
        () => (organizations.data || []).find((row) => row.slug === orgSlug) || null,
        [organizations.data, orgSlug]
    );

    const overview = useQuery({
        queryKey: consoleKeys.postureOverview(orgSlug),
        queryFn: () => fetchPostureOverview(orgSlug),
        enabled: Boolean(membership),
    });

    const environmentsWithData = useMemo(
        () => (overview.data?.environments || []).filter((row) => row.has_data).map((row) => row.environment),
        [overview.data]
    );

    const requested = searchParams.get("env");
    const environment = ENVIRONMENTS.includes(requested)
        ? requested
        : environmentsWithData[0] || "production";

    const setEnvironment = useCallback(
        (next) => {
            const params = new URLSearchParams(searchParams);
            params.set("env", next);
            setSearchParams(params, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    return {
        orgSlug,
        membership,
        organizations,
        overview,
        environment,
        environmentsWithData,
        setEnvironment,
        canManage: membership ? ["OWNER", "ADMIN"].includes(membership.org_role) : false,
        isOwner: membership?.org_role === "OWNER",
    };
}
