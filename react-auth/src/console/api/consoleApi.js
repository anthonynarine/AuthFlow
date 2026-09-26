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

// ---- F2: applications and connection keys ----------------------------------

const app = (slug, applicationId) => `${org(slug)}/applications/${encodeURIComponent(applicationId)}`;

/** Every application in the company (all environments); the console filters by environment. */
export async function fetchApplications(organizationSlug) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/applications/`);
    return data;
}

export async function createApplication(organizationSlug, { name, slug, environment }) {
    const { data } = await authAxios.post(`${org(organizationSlug)}/applications/`, { name, slug, environment });
    return data;
}

export async function fetchApplication(organizationSlug, applicationId) {
    const { data } = await authAxios.get(`${app(organizationSlug, applicationId)}/`);
    return data;
}

export async function renameApplication(organizationSlug, applicationId, name) {
    const { data } = await authAxios.patch(`${app(organizationSlug, applicationId)}/`, { name });
    return data;
}

/** action: "suspend" | "reactivate" | "retire" */
export async function changeApplicationStatus(organizationSlug, applicationId, action) {
    const { data } = await authAxios.post(`${app(organizationSlug, applicationId)}/${action}/`);
    return data;
}

export async function fetchApplicationActivity(organizationSlug, applicationId) {
    const { data } = await authAxios.get(`${app(organizationSlug, applicationId)}/activity/`);
    return data;
}

/** Key metadata (never secrets). Owners and Admins only; Gait answers 403 to anyone else. */
export async function fetchCredentials(organizationSlug, applicationId) {
    const { data } = await authAxios.get(`${app(organizationSlug, applicationId)}/credentials/`);
    return data;
}

/**
 * Issues a key. The response is the only time `raw_secret` exists anywhere:
 * callers must hand it straight to the one-time dialog and never cache it.
 */
export async function issueCredential(organizationSlug, applicationId, label) {
    const { data } = await authAxios.post(`${app(organizationSlug, applicationId)}/credentials/`, { label });
    return data;
}

export async function revokeCredential(organizationSlug, applicationId, credentialId) {
    await authAxios.post(
        `${app(organizationSlug, applicationId)}/credentials/${encodeURIComponent(credentialId)}/revoke/`
    );
}
