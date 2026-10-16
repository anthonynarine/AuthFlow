import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, LoadingState } from "../../components/ui/primitives";
import { useLocation, useNavigate } from "react-router-dom";
import { safeReturnTo } from "../../../auth/returnTo";
import { RegistrationActionFeedback } from "./RegistrationActionFeedback";
import { fetchLoginRegistration, saveLoginRegistration, challengeLoginRegistration, verifyLoginRegistration, revokeLoginRegistration, changeLoginRegistrationTransport } from "../../api/consoleApi";

import { HostingChoices, OwnershipProofSetup, frontendOriginFeedback } from "./OwnershipProofSetup";
import { ENVIRONMENT_LABELS } from "../../hooks/useConsoleScope";
import { LoginTransportSettings } from "./LoginTransportSettings";

function RegistrationSettings({ application, data, pending, onSave, onChallenge, onVerify, onRevoke, onTransport, feedback, onSignIn }) {
    const [backendUrl, setBackendUrl] = useState(data.backend_url || "");
    const [origin, setOrigin] = useState(data.login_origin || "");
    const [layout, setLayout] = useState(data.backend_url === data.login_origin ? "same" : "separate");
    const [awsType, setAwsType] = useState("static");
    const [hosting, setHosting] = useState(data.backend_url === data.login_origin ? "backend" : "other");
    const originFeedback = frontendOriginFeedback(origin);
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
        <ol aria-label="Login setup steps" className="gc-login-progress"><li>1. Confirm URLs</li><li>2. Publish proof</li><li>3. Verify with Gait</li><li>4. Connect</li></ol>
        <HostingChoices layout={layout} setLayout={setLayout} hosting={hosting} setHosting={setHosting} awsType={awsType} setAwsType={setAwsType} />
        <p>Application keys identify your software. Human sign-in uses a separate audience and frontend origin. An active registration does not prove your backend login integration or current-session MFA works.</p>
        <form onSubmit={(event) => { event.preventDefault(); if (originFeedback || (editingActive && !confirmEdit)) return; onSave({ backend_url: backendUrl, login_origin: origin }); }}>
            <label htmlFor="gc-login-backend">Backend URL</label>
            <input id="gc-login-backend" className="gc-input" type="url" value={backendUrl} onChange={(event) => setBackendUrl(event.target.value)} disabled={pending || !active} required />
            <p className="gc-muted">Your backend service URL is informational and is not ownership-verified. Gait verifies control of the separate frontend login origin.</p>
            <label htmlFor="gc-login-origin">Frontend login origin</label>
            <input id="gc-login-origin" className="gc-input" type="url" value={origin} onChange={(event) => setOrigin(event.target.value)} disabled={pending || !active} required />
            {originFeedback ? <p role="alert">{originFeedback.message}{originFeedback.suggestion ? <> Suggested origin: <code>{originFeedback.suggestion}</code>. <button type="button" className="gc-button" onClick={() => setOrigin(originFeedback.suggestion)}>Use this origin</button></> : null}</p> : null}
            <p className="gc-muted">Exact HTTPS origin, with no path, trailing slash or wildcard. Use a separate registration for each environment. After verification, changing to another host requires platform support in this release.</p>
            {editingActive ? <label><input type="checkbox" checked={confirmEdit} onChange={(event) => setConfirmEdit(event.target.checked)} disabled={pending} /> I understand saving changes resets ownership verification and revokes prior login sessions for this registration.</label> : null}
            <button type="submit" className="gc-button gc-button--primary" disabled={pending || !active || !backendUrl || !origin || Boolean(originFeedback) || (editingActive && !confirmEdit)}>Save pending registration</button>
            <RegistrationActionFeedback action="save" feedback={feedback.save} onSignIn={onSignIn} />
        </form>
        <dl className="gc-meta"><div><dt>Gait API URL</dt><dd>{data.api_base_url || "Trusted server configuration unavailable"}</dd></div><div><dt>Audience</dt><dd>{data.audience || "Assigned by Gait after registration"}</dd></div><div><dt>Issuer</dt><dd>{data.issuer || "Trusted server configuration unavailable"}</dd></div><div><dt>Public JWKS</dt><dd>{data.jwks_uri || "Trusted server configuration unavailable"}</dd></div></dl>
        <OwnershipProofSetup data={data} hosting={hosting} layout={layout} awsType={awsType} pending={pending} dirty={dirty} active={active} onVerify={onVerify} onChallenge={onChallenge} feedback={feedback} onSignIn={onSignIn} />
        <h3>4. Connect your application</h3>
        {config ? <section aria-label="Backend login configuration"><h3>Backend Gait SDK configuration</h3><pre className="gc-snippet" tabIndex={0}>{config}</pre><button type="button" className="gc-button" onClick={copy}>Copy backend configuration</button><p role="status">{copyStatus}</p></section> : <p>Copyable backend configuration becomes available after Gait confirms ownership and supplies trusted issuer, audience and JWKS values.</p>}
        <LoginTransportSettings data={data} application={application} pending={pending} dirty={dirty} onSave={onTransport} />
        <RegistrationActionFeedback action="transport" feedback={feedback.transport} onSignIn={onSignIn} />
        <p className="gc-muted">Keep the application credential separately in backend secret settings. Your backend must validate access tokens and enforce its own authorization.</p>
        <p><a href="/docs/add-gait-sign-in#application-cookie-sessions">Application sign-in and transport guide</a></p>
        <p className="gc-muted">Current-session MFA availability must be confirmed from the deployed session-assurance API. Registration alone is not MFA proof.</p>
        {data.status === "active" || data.status === "pending" ? <section aria-label="Revoke login registration"><label><input type="checkbox" checked={confirmRevoke} onChange={(event) => setConfirmRevoke(event.target.checked)} disabled={pending} /> I understand revocation stops this registration's sign-in and token acceptance under Gait's server policy.</label><button type="button" className="gc-button gc-button--danger" disabled={pending || !confirmRevoke} onClick={onRevoke}>Revoke login registration</button><RegistrationActionFeedback action="revoke" feedback={feedback.revoke} onSignIn={onSignIn} /></section> : null}
        <p className="gc-muted">Registration edits, ownership checks and revocation are recorded by Gait. Application retirement and login registration are separate actions.</p>

    </>;
}

/** Authenticated server data only. Scope remounts form and copy state; no persisted inputs. */
export function LoginRegistration({ organizationSlug, application, canManage }) {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = safeReturnTo(location.pathname + location.search);
    const onSignIn = () => navigate("/login", { state: returnTo ? { returnTo } : undefined });
    const queryClient = useQueryClient();
    const key = ["console", organizationSlug, "all", "applications", application.id, "login-registration"];
    const query = useQuery({ queryKey: key, queryFn: () => fetchLoginRegistration(organizationSlug, application.id), enabled: canManage, retry: false });
    const mutation = useMutation({ mutationFn: ({ action, values }) => action === "transport" ? changeLoginRegistrationTransport(organizationSlug, application.id, values) : action === "save" ? saveLoginRegistration(organizationSlug, application.id, values) : action === "challenge" ? challengeLoginRegistration(organizationSlug, application.id) : action === "verify" ? verifyLoginRegistration(organizationSlug, application.id) : revokeLoginRegistration(organizationSlug, application.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key, exact: true }) });
    const feedback = Object.fromEntries(["save", "challenge", "verify", "transport", "revoke"].map((action) => [action, mutation.variables?.action === action ? { status: mutation.status, error: mutation.error } : { status: "idle" }]));
    let body;
    if (!canManage) body = <p>Only Owners and Admins can view and manage human-login registration.</p>;
    else if (query.isLoading) body = <LoadingState label="Loading login registration…" />;
    else if (query.isError || !query.data) body = <><p role="alert">Login registration is unavailable, or your role does not have access. No login readiness is confirmed.</p><button type="button" className="gc-button" onClick={() => query.refetch()}>Retry login registration</button></>;
    else body = <RegistrationSettings key={`${organizationSlug}/${application.id}/${application.environment}/${query.data.version || query.data.updated_at || "initial"}/${query.data.status}`} application={application} data={query.data} pending={mutation.isPending}
        onTransport={(values) => mutation.mutate({ action: "transport", values })} onChallenge={() => mutation.mutate({ action: "challenge" })} onSave={(values) => mutation.mutate({ action: "save", values })} onVerify={() => mutation.mutate({ action: "verify" })} onRevoke={() => mutation.mutate({ action: "revoke" })} feedback={feedback} onSignIn={onSignIn} />;
    return <Card title="Human login settings" subtitle={`${application.name} · Application environment: ${ENVIRONMENT_LABELS[application.environment] || application.environment}`}>{body}</Card>;
}
