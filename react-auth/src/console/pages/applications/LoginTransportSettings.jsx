import React, { useState } from "react";

/** Server capabilities control availability. Selection never changes Console transport. */
export function LoginTransportSettings({ data, application, pending, dirty, onSave }) {
    const current = data.session_transport === "cookie" ? "cookie" : "bearer";
    const [selected, setSelected] = useState(current);
    const [confirmed, setConfirmed] = useState(false);
    const active = application.status === "ACTIVE" && data.status === "active";
    const cookieAvailable = active && data.cookie_transport_available === true
        && Array.isArray(data.supported_session_transports) && data.supported_session_transports.includes("cookie");
    const changed = selected !== current;
    const choose = (value) => { setSelected(value); setConfirmed(false); };
    return (
        <section aria-label="Application session transport">
            <h3>Session transport</h3>
            <p>Saved transport: <strong>{current === "cookie" ? "Cookie" : "Bearer (default)"}</strong>. Access tokens remain bearer tokens in either mode. This setting controls this application’s refresh sessions, separately from Gait Console.</p>
            <fieldset disabled={pending || !active || dirty}>
                <legend>Choose this application’s transport</legend>
                <label><input type="radio" name="gait-session-transport" value="bearer" checked={selected === "bearer"} onChange={() => choose("bearer")} /> Bearer (default)</label>
                <label><input type="radio" name="gait-session-transport" value="cookie" checked={selected === "cookie"} disabled={!cookieAvailable} onChange={() => choose("cookie")} /> Cookie</label>
            </fieldset>
            {!active ? <p>Verify the exact frontend login origin and activate this registration before changing transport.</p> : null}
            {!cookieAvailable ? <p>Cookie transport is unavailable for this registration. Gait must enable support and confirm an active, ownership-verified registration. Bearer remains the default for new registrations.</p> : null}
            {dirty ? <p>Save or discard edited URLs before changing the saved registration’s transport.</p> : null}
            <p>Only an Owner or Admin with a recent password and authenticator-code sign-in can change transport. A change increments the registration version, ends its existing login sessions and pending MFA flows, and requires users to sign in again. Origin verification alone does not prove current-session MFA.</p>
            {changed ? <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={pending || !active || dirty} /> I understand changing transport ends this registration’s sessions and pending MFA flows.</label> : null}
            <button type="button" className="gc-button gc-button--primary"
                disabled={pending || !active || dirty || !changed || !confirmed || (selected === "cookie" && !cookieAvailable)}
                onClick={() => onSave(selected)}>Save session transport</button>
            <h4>Browser support and verification</h4>
            <p>Secure, HttpOnly cookies with SameSite=None still depend on browser policy. Browsers can block third-party cookies when your app and Gait are on different sites. Registration activation is not a browser cookie test.</p>
            <p>Test sign-in, MFA when required, refresh and logout in your actual browser and deployment. If third-party cookies are blocked, use a supported same-site deployment or explicitly select a Bearer integration whose MFA transport your browser supports. Bearer MFA can still require a temporary cookie, so changing transport alone may not fix third-party-cookie blocking. Gait does not silently switch transports.</p>
            {current === "cookie" && cookieAvailable ? <p>For supported cookie requests, send credentials: "include" and X-Gait-Auth: "1". The browser supplies the exact verified Origin. Gait owns cookie names and attributes; keep access tokens in memory and never copy refresh tokens into JavaScript storage. Follow the connection guide and verify the complete browser round trip before enabling sign-in for users.</p> : null}
        </section>
    );
}
