import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { actOnFinding, fetchEvidence, fetchFinding, fetchFindings } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";

export const PAGE_SIZE = 50;

/** One page of findings for an environment and filter set. */
export function useFindings(organizationSlug, environment, { status, severity, page }) {
    const filters = { status: status || "", severity: severity || "", page };
    return useQuery({
        queryKey: consoleKeys.findings(organizationSlug, environment, filters),
        queryFn: () =>
            fetchFindings(organizationSlug, { environment, status, severity, page, pageSize: PAGE_SIZE }),
        placeholderData: keepPreviousData,
    });
}

export function useFinding(organizationSlug, findingId) {
    return useQuery({
        queryKey: consoleKeys.finding(organizationSlug, findingId),
        queryFn: () => fetchFinding(organizationSlug, findingId),
    });
}

/** Each linked piece of evidence, newest first. */
export function useFindingEvidence(organizationSlug, evidenceIds = []) {
    const results = useQueries({
        queries: evidenceIds.map((evidenceId) => ({
            queryKey: consoleKeys.evidence(organizationSlug, evidenceId),
            queryFn: () => fetchEvidence(organizationSlug, evidenceId),
        })),
    });
    const loaded = results.map((result) => result.data).filter(Boolean);
    loaded.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
    return {
        evidence: loaded,
        isLoading: results.some((result) => result.isLoading),
        failed: results.filter((result) => result.isError).length,
    };
}

/**
 * action: "acknowledge" | "accept-risk". On success the returned finding
 * (with its new action history) replaces the cached one, and every list and
 * posture for this company refreshes.
 */
export function useFindingAction(organizationSlug, findingId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ action, note }) => actOnFinding(organizationSlug, findingId, action, note),
        onSuccess: (finding) => {
            queryClient.setQueryData(consoleKeys.finding(organizationSlug, findingId), finding);
            queryClient.invalidateQueries({
                predicate: ({ queryKey }) =>
                    queryKey[0] === "console" &&
                    queryKey[1] === organizationSlug &&
                    (queryKey[3] === "findings" || queryKey[3] === "posture" || queryKey[3] === "posture-overview"),
            });
        },
    });
}
