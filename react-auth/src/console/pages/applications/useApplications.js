import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    changeApplicationStatus,
    createApplication,
    fetchApplication,
    fetchApplicationActivity,
    fetchApplications,
    fetchCredentials,
    renameApplication,
    revokeCredential,
} from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";

export function useApplications(organizationSlug) {
    return useQuery({
        queryKey: consoleKeys.applications(organizationSlug),
        queryFn: () => fetchApplications(organizationSlug),
    });
}

export function useApplication(organizationSlug, applicationId) {
    return useQuery({
        queryKey: consoleKeys.application(organizationSlug, applicationId),
        queryFn: () => fetchApplication(organizationSlug, applicationId),
    });
}

export function useApplicationActivity(organizationSlug, applicationId) {
    return useQuery({
        queryKey: consoleKeys.applicationActivity(organizationSlug, applicationId),
        queryFn: () => fetchApplicationActivity(organizationSlug, applicationId),
    });
}

/** Activity for each listed application, keyed by application id. */
export function useActivities(organizationSlug, applicationIds) {
    const results = useQueries({
        queries: applicationIds.map((applicationId) => ({
            queryKey: consoleKeys.applicationActivity(organizationSlug, applicationId),
            queryFn: () => fetchApplicationActivity(organizationSlug, applicationId),
        })),
    });
    return Object.fromEntries(applicationIds.map((applicationId, index) => [applicationId, results[index]]));
}

/** Key metadata. Only fetched for Owners/Admins (`enabled`); Gait refuses anyone else with 403. */
export function useCredentials(organizationSlug, applicationId, { enabled }) {
    return useQuery({
        queryKey: consoleKeys.credentials(organizationSlug, applicationId),
        queryFn: () => fetchCredentials(organizationSlug, applicationId),
        enabled,
    });
}

function useInvalidateApplication(organizationSlug) {
    const queryClient = useQueryClient();
    return (applicationId) => {
        queryClient.invalidateQueries({ queryKey: consoleKeys.applications(organizationSlug), exact: true });
        if (applicationId) {
            queryClient.invalidateQueries({ queryKey: consoleKeys.application(organizationSlug, applicationId) });
        }
        // Posture "has data" depends on which environments have applications.
        queryClient.invalidateQueries({ queryKey: consoleKeys.postureOverview(organizationSlug) });
    };
}

export function useCreateApplication(organizationSlug) {
    const invalidate = useInvalidateApplication(organizationSlug);
    return useMutation({
        mutationFn: (values) => createApplication(organizationSlug, values),
        onSuccess: () => invalidate(),
    });
}

export function useRenameApplication(organizationSlug, applicationId) {
    const invalidate = useInvalidateApplication(organizationSlug);
    return useMutation({
        mutationFn: (name) => renameApplication(organizationSlug, applicationId, name),
        onSuccess: () => invalidate(applicationId),
    });
}

/** action: "suspend" | "reactivate" | "retire" (retiring also revokes every key). */
export function useChangeApplicationStatus(organizationSlug, applicationId) {
    const invalidate = useInvalidateApplication(organizationSlug);
    return useMutation({
        mutationFn: (action) => changeApplicationStatus(organizationSlug, applicationId, action),
        onSuccess: () => invalidate(applicationId),
    });
}

export function useRevokeCredential(organizationSlug, applicationId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (credentialId) => revokeCredential(organizationSlug, applicationId, credentialId),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: consoleKeys.credentials(organizationSlug, applicationId) }),
    });
}
