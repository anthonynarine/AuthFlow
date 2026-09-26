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

/** One environment's posture: overall status, control counts, open findings by severity. */
export async function fetchPosture(organizationSlug, environment) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/security/posture/`, { params: { environment } });
    return data;
}

/** Every control that applies to this company, each with its state in `environment`. */
export async function fetchControls(organizationSlug, environment) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/security/controls/`, { params: { environment } });
    return data;
}

/**
 * The newest evidence for one control in one environment (or null). Its
 * `trust` (SELF_REPORTED / GAIT_VERIFIED) is what the console shows as
 * the source of that control's result.
 */
export async function fetchLatestEvidence(organizationSlug, environment, controlKey) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/security/evidence/`, {
        params: { environment, control: controlKey, page_size: 1 },
    });
    return data.results[0] || null;
}
