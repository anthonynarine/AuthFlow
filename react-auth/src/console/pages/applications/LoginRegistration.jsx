import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, LoadingState } from "../../components/ui/primitives";
import { apiErrorMessage } from "../../utils/apiErrors";
import { fetchLoginRegistration, saveLoginRegistration, challengeLoginRegistration, verifyLoginRegistration, revokeLoginRegistration } from "../../api/consoleApi";

function RegistrationSettings({ application, data, pending, onSave, onChallenge, onVerify, onRevoke, error }) {
    const [backendUrl, setBackendUrl] = useState(data.backend_url || "");
    const [origin, setOrigin] = useState(data.login_origin || "");
    const [confirmEdit, setConfirmEdit] = useState(false);
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    const [copyStatus, setCopyStatus] = useState("");
    const pinsReady = data.status === "active" && typeof data.api_base_url === "string" && data.api_base_url && typeof data.issuer === "string" && data.issuer && typeof data.jwks_uri === "string" && data.jwks_uri && typeof data.audience === "string" && data.audience;
    const config = pinsReady ? `GAIT_TOKEN_VERIFIER=jwks\nGAIT_AUTH_URL=${data.api_base_url}\nGAIT_JWKS_URL=${data.jwks_uri}\nGAIT_ISSUER=${data.issuer}\nGAIT_AUDIENCE=${data.audience}` : null;
    const editingActive = data.status === "active";
    const dirty = backendUrl !== (data.backend_url || "") || origin !== (data.login_origin || "");
    const active = application.status === "ACTIVE";
    const copy = async () => {
        try { await navigator.clipboard.writeText(config); setCopyStatus("Copied verified registration pins. Configure the Gait SDK in your backend with these exact values."); }
        catch { setCopyStatus("Clipboard unavailable. Select the configuration and copy manually."); }
    };
    return <>
        <p><strong>Registration: {data.status || "unconfigured"}</strong></p>
        <p>Application keys identify your software. Human sign-in uses a separate audience and frontend origin. An active registration does not prove your backend login integration or current-session MFA works.</p>
        <form onSubmit={(event) => { event.preventDefault(); if (editingActive && !confirmEdit) return; onSave({ backend_url: backendUrl, login_origin: origin }); }}>
            <label htmlFor="gc-login-backend">Backend URL</label>
            <input id="gc-login-backend" className="gc-input" type="url" value={backendUrl} onChange={(event) => setBackendUrl(event.target.value)} disabled={pending || !active} required />
            <p className="gc-muted">Your backend service URL is informational and is not ownership-verified. Gait verifies control of the separate frontend login origin.</p>
            <label htmlFor="gc-login-origin">Frontend login origin</label>
            <input id="gc-login-origin" className="gc-input" type="url" value={origin} onChange={(event) => setOrigin(event.target.value)} disabled={pending || !active} required />
            <p className="gc-muted">Exact HTTPS origin, with no path, trailing slash or wildcard. Use a separate registration for each environment. After verification, changing to another host requires platform support in this release.</p>
            {editingActive ? <label><input type="checkbox" checked={confirmEdit} onChange={(event) => setConfirmEdit(event.target.checked)} disabled={pending} /> I understand saving changes resets ownership verification and revokes prior login sessions for this registration.</label> : null}
            <button type="submit" className="gc-button gc-button--primary" disabled={pending || !active || !backendUrl || !origin || (editingActive && !confirmEdit)}>Save pending registration</button>
        </form>
        <dl className="gc-meta"><div><dt>Gait API URL</dt><dd>{data.api_base_url || "Trusted server configuration unavailable"}</dd></div><div><dt>Audience</dt><dd>{data.audience || "Assigned by Gait after registration"}</dd></div><div><dt>Issuer</dt><dd>{data.issuer || "Trusted server configuration unavailable"}</dd></div><div><dt>Public JWKS</dt><dd>{data.jwks_uri || "Trusted server configuration unavailable"}</dd></div></dl>
        {data.ownership_challenge ? <section aria-label="Ownership verification"><h3>Prove control of your hosted application</h3>
            {dirty ? <p>Save your edited URLs before verifying ownership or generating a challenge.</p> : null}
            <p>Publish the server-generated challenge exactly as instructed. Only Gait can verify it and activate the registration.</p>
            <pre className="gc-snippet">{JSON.stringify(data.ownership_challenge, null, 2)}</pre>
            <button type="button" className="gc-button" disabled={pending || !active || data.status !== "pending" || dirty} onClick={onVerify}>Verify ownership with Gait</button>
        </section> : null}
        {data.status === "pending" ? <button type="button" className="gc-button" disabled={pending || !active || dirty} onClick={onChallenge}>Generate new ownership challenge</button> : null}
        {config ? <section aria-label="Backend login configuration"><h3>Backend Gait SDK configuration</h3><pre className="gc-snippet" tabIndex={0}>{config}</pre><button type="button" className="gc-button" onClick={copy}>Copy backend configuration</button><p role="status">{copyStatus}</p></section> : <p>Copyable backend configuration becomes available after Gait confirms ownership and supplies trusted issuer, audience and JWKS values.</p>}
        <p className="gc-muted">Access tokens use bearer transport. This registration does not enable Gait refresh/session cookie transport or CSRF trust. Keep the application credential separately in backend secret settings. Your backend must validate access tokens and enforce its own authorization.</p>
        <p><a href="/docs/connecting-your-software">Django and FastAPI backend configuration guide</a></p>
        <p className="gc-muted">Current-session MFA availability must be confirmed from the deployed session-assurance API. Registration alone is not MFA proof.</p>
        {data.status === "active" || data.status === "pending" ? <section aria-label="Revoke login registration"><label><input type="checkbox" checked={confirmRevoke} onChange={(event) => setConfirmRevoke(event.target.checked)} disabled={pending} /> I understand revocation stops this registration's sign-in and token acceptance under Gait's server policy.</label><button type="button" className="gc-button gc-button--danger" disabled={pending || !confirmRevoke} onClick={onRevoke}>Revoke login registration</button></section> : null}
        <p className="gc-muted">Registration edits, ownership checks and revocation are recorded by Gait. Application retirement and login registration are separate actions.</p>
        {error ? <p role="alert" className="gc-form-error">{(error.response?.data?.code === "reauthentication_required" || error.response?.data?.detail === "reauthentication_required") ? "Sign in again with password and TOTP before changing login registration." : apiErrorMessage(error)}</p> : null}
    </>;
}

/** Authenticated server data only. Scope remounts form and copy state; no persisted inputs. */
export function LoginRegistration({ organizationSlug, application, canManage }) {
    const queryClient = useQueryClient();
    const key = ["console", organizationSlug, "all", "applications", application.id, "login-registration"];
    const query = useQuery({ queryKey: key, queryFn: () => fetchLoginRegistration(organizationSlug, application.id), enabled: canManage, retry: false });
    const mutation = useMutation({ mutationFn: ({ action, values }) => action === "save" ? saveLoginRegistration(organizationSlug, application.id, values) : action === "challenge" ? challengeLoginRegistration(organizationSlug, application.id) : action === "verify" ? verifyLoginRegistration(organizationSlug, application.id) : revokeLoginRegistration(organizationSlug, application.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key, exact: true }) });
    let body;
    if (!canManage) body = <p>Only Owners and Admins can view and manage human-login registration.</p>;
    else if (query.isLoading) body = <LoadingState label="Loading login registration…" />;
    else if (query.isError || !query.data) body = <><p role="alert">Login registration is unavailable, or your role does not have access. No login readiness is confirmed.</p><button type="button" className="gc-button" onClick={() => query.refetch()}>Retry login registration</button></>;
    else body = <RegistrationSettings key={`${organizationSlug}/${application.id}/${application.environment}/${query.data.version || query.data.updated_at || "initial"}/${query.data.status}`} application={application} data={query.data} pending={mutation.isPending}
        onChallenge={() => mutation.mutate({ action: "challenge" })} onSave={(values) => mutation.mutate({ action: "save", values })} onVerify={() => mutation.mutate({ action: "verify" })} onRevoke={() => mutation.mutate({ action: "revoke" })} error={mutation.error} />;
    return <Card title="Human login settings" subtitle={`${application.name} · ${application.environment}`}>{body}</Card>;
}
