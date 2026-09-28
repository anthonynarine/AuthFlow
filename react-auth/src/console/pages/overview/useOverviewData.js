import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchControls, fetchPosture } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";

export function usePosture(organizationSlug, environment, { enabled = true } = {}) {
    return useQuery({
        queryKey: consoleKeys.posture(organizationSlug, environment),
        queryFn: () => fetchPosture(organizationSlug, environment),
        enabled,
    });
}

export function useControls(organizationSlug, environment, { enabled = true } = {}) {
    return useQuery({
        queryKey: consoleKeys.controls(organizationSlug, environment),
        queryFn: () => fetchControls(organizationSlug, environment),
        enabled,
    });
}

/**
 * The controls of several environments, keyed by environment. Each control's
 * `state.trust` (H2) is the source of its latest evidence there, so one
 * request per environment labels every result; the selected environment's
 * request is the same cache entry useControls already made.
 */
export function useControlsByEnvironment(organizationSlug, environments) {
    const results = useQueries({
        queries: environments.map((environment) => ({
            queryKey: consoleKeys.controls(organizationSlug, environment),
            queryFn: () => fetchControls(organizationSlug, environment),
        })),
    });
    const byEnvironment = {};
    environments.forEach((environment, index) => {
        byEnvironment[environment] = results[index];
    });
    return byEnvironment;
}

/** Total open findings across severities in a posture's `open_findings` counts. */
export function openFindingsTotal(posture) {
    return Object.values(posture?.open_findings || {}).reduce((sum, count) => sum + count, 0);
}
