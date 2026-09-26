import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchControls, fetchLatestEvidence, fetchPosture } from "../../api/consoleApi";
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
 * The newest evidence for each (environment, control) pair, keyed
 * "environment:control_key". Used to label every result with its source.
 */
export function useLatestEvidence(organizationSlug, pairs) {
    const results = useQueries({
        queries: pairs.map(([environment, controlKey]) => ({
            queryKey: consoleKeys.latestEvidence(organizationSlug, environment, controlKey),
            queryFn: () => fetchLatestEvidence(organizationSlug, environment, controlKey),
        })),
    });
    const byPair = {};
    pairs.forEach(([environment, controlKey], index) => {
        byPair[`${environment}:${controlKey}`] = results[index];
    });
    return byPair;
}

/** Total open findings across severities in a posture's `open_findings` counts. */
export function openFindingsTotal(posture) {
    return Object.values(posture?.open_findings || {}).reduce((sum, count) => sum + count, 0);
}
