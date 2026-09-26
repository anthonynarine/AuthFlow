import { authAxios } from "../../interceptors/axios";

/**
 * Gait console API calls. Transport only: every call goes through
 * authAxios (in-memory Bearer token, silent refresh from the HttpOnly
 * cookie). The organization is always part of the URL path -- Gait resolves
 * membership from it on every request and answers 404 for anything the
 * caller may not see.
 */

const org = (slug) => `/organizations/${encodeURIComponent(slug)}`;

export async function fetchMyOrganizations() {
    const { data } = await authAxios.get("/organizations/");
    return data;
}

export async function fetchPostureOverview(organizationSlug) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/security/posture/overview/`);
    return data;
}
