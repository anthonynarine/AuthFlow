import { QueryClient } from "@tanstack/react-query";

/**
 * The one TanStack Query client for the app.
 *
 * Tenant isolation rule for the Gait console: every console query key starts
 * with ["console", organizationSlug, environment, ...] (see
 * console/api/queryKeys.js), and the whole cache is cleared whenever a
 * session ends (logout, failed refresh) -- so data from one organization or
 * one signed-in user can never be served to another.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
                const status = error?.response?.status;
                // Never retry auth, permission, not-found or validation errors.
                if (status && status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: true,
        },
    },
});
