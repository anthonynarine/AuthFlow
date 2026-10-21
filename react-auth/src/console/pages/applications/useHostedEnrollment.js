import { useQuery } from "@tanstack/react-query";
import { fetchHostedEnrollment } from "../../api/consoleApi";

export function hostedEnrollmentKey(organizationSlug, application) {
    return ["console", organizationSlug, "all", "applications", application?.id || null, "hosted-enrollment", application?.environment || null];
}

export function useHostedEnrollmentCapability(organizationSlug, application, canManage) {
    return useQuery({
        queryKey: hostedEnrollmentKey(organizationSlug, application),
        queryFn: () => fetchHostedEnrollment(organizationSlug, application.id),
        enabled: Boolean(canManage && application?.id && application?.environment),
        retry: false,
    });
}

export function confirmedDeploymentMode(query, application) {
    const data = query.data;
    if (!query.isSuccess || query.isError || !application || data?.application_id !== String(application.id) || data?.environment !== application.environment) return null;
    return ["production", "hosted-development"].includes(data.deployment_mode) ? data.deployment_mode : null;
}
