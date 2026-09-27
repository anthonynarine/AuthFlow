import { authAxios, publicAxios } from "../../interceptors/axios";

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

// ---- F3: findings ------------------------------------------------------------

/**
 * One page of findings: {count, page, page_size, results}. Filters are
 * optional; an unknown value is a 400 {code: "INVALID_QUERY", field}.
 */
export async function fetchFindings(organizationSlug, { environment, status, severity, page, pageSize } = {}) {
    const params = { environment, status, severity, page, page_size: pageSize };
    Object.keys(params).forEach((key) => (params[key] === undefined || params[key] === "") && delete params[key]);
    const { data } = await authAxios.get(`${org(organizationSlug)}/security/findings/`, { params });
    return data;
}

/** One finding, with its `actions` history. */
export async function fetchFinding(organizationSlug, findingId) {
    const { data } = await authAxios.get(
        `${org(organizationSlug)}/security/findings/${encodeURIComponent(findingId)}/`
    );
    return data;
}

export async function fetchEvidence(organizationSlug, evidenceId) {
    const { data } = await authAxios.get(
        `${org(organizationSlug)}/security/evidence/${encodeURIComponent(evidenceId)}/`
    );
    return data;
}

/** action: "acknowledge" | "accept-risk". Owners/Admins only; `note` is 10-2000 characters. Returns the updated finding. */
export async function actOnFinding(organizationSlug, findingId, action, note) {
    const { data } = await authAxios.post(
        `${org(organizationSlug)}/security/findings/${encodeURIComponent(findingId)}/${action}/`,
        { note }
    );
    return data;
}

// ---- F4: members, invites, activity, company settings --------------------------

/** {your_role, members, invites}; `invites` (pending) only for Owners/Admins. */
export async function fetchMembers(organizationSlug) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/members/`);
    return data;
}

export async function changeMemberRole(organizationSlug, membershipId, orgRole) {
    const { data } = await authAxios.patch(
        `${org(organizationSlug)}/members/${encodeURIComponent(membershipId)}/`,
        { org_role: orgRole }
    );
    return data;
}

/** Remove a member, or leave (your own membership). */
export async function removeMember(organizationSlug, membershipId) {
    await authAxios.delete(`${org(organizationSlug)}/members/${encodeURIComponent(membershipId)}/`);
}

/** The pending invite plus `email_sent`. The token is never returned. */
export async function createInvite(organizationSlug, { email, orgRole }) {
    const { data } = await authAxios.post(`${org(organizationSlug)}/members/invites/`, {
        email,
        org_role: orgRole,
    });
    return data;
}

export async function revokeInvite(organizationSlug, inviteId) {
    await authAxios.post(`${org(organizationSlug)}/members/invites/${encodeURIComponent(inviteId)}/revoke/`);
}

/** Owners/Admins: {count, page, page_size, results}, newest first. */
export async function fetchMemberActivity(organizationSlug, { page, pageSize } = {}) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/members/activity/`, {
        params: { page, page_size: pageSize },
    });
    return data;
}

/** {id, name, slug, status, created_at, your_role}. */
export async function fetchOrganization(organizationSlug) {
    const { data } = await authAxios.get(`${org(organizationSlug)}/`);
    return data;
}

/** Owners only; `name` is the only editable field. */
export async function renameOrganization(organizationSlug, name) {
    const { data } = await authAxios.patch(`${org(organizationSlug)}/`, { name });
    return data;
}

/** No login needed: what an invite is for, only to the holder of a valid token. */
export async function previewInvite(token) {
    const { data } = await publicAxios.post("/organizations/invites/preview/", { token });
    return data;
}

/** Signed in with the invited, confirmed email: {organization_slug, organization_name, org_role}. */
export async function acceptInvite(token) {
    const { data } = await authAxios.post("/organizations/invites/accept/", { token });
    return data;
}
