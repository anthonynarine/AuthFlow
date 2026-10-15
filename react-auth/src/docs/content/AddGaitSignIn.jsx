import React from "react";
import { Callout, CodeBlock, DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";
import { Diagram } from "../components/Diagram";
import {
    GAIT_API_URL,
    INSTALL,
    LINK_BY_INVITE,
    LINK_ON_FIRST_REQUEST,
    LIVE_SESSION_VIEW,
    SERVER_REFRESH_SIGN_OUT,
    SERVER_SIGN_IN,
    VERIFY_USER_SETTINGS,
    VERIFY_USER_VIEW,
} from "./snippets";

// Server-side bearer examples and explicitly enabled application cookie sessions are separate flows.

const HOW_IT_FITS = `sequenceDiagram
    autonumber
    actor P as Person
    participant S as App server
    participant G as Gait
    participant A as App API with gait-sdk

    P->>S: Email and password
    S->>G: Sign in
    G-->>S: Access token and refresh token
    Note over S: Kept in the server's session
    P->>S: Use the app
    S->>A: Request with the access token
    A->>G: Who is this? (remembered up to 45 s)
    G-->>A: Subject and email
    Note over A: The app's rules decide
    A-->>S: Answer
    S-->>P: Page`;

export default function AddGaitSignIn() {
    return (
        <>
            <p className="doc-lede">
                How an app of mine lets its users sign in with a Gait account, as Lumen (in development) does. Gait checks who they
                are; the app still decides what they may do.
            </p>
            <p>
                <StatusBadge feature="productSignIn" /> Background:{" "}
                <DocLink to="people-and-applications#your-products-own-users">An app's own users</DocLink>.
            </p>

            <DocSection id="application-cookie-sessions" title="Choose Bearer or supported Cookie sessions">
                <p>In Console → Applications → your application → Human login settings, register the exact HTTPS frontend origin and publish the server-issued ownership challenge. Choose whether frontend and backend share a host, and select AWS, Vercel, Netlify, Heroku, backend-served frontend or another host for publishing guidance. These choices change instructions only; the frontend login origin is the browser’s actual sign-in origin, while the backend URL is informational. Gait must verify ownership before the registration is active. Keep local and production registrations separate.
                </p>
                <p>For Netlify and Vercel, put the exact server-issued proof body in <code>public/.well-known/gait-domain-verification</code> and deploy the frontend. For AWS static hosting, publish the proof object through S3/CloudFront or Amplify; for EC2/ECS/Elastic Beanstalk or a backend-served frontend, add the shown Django or FastAPI route on that frontend host. Heroku environment values are useful only if your application already implements a proof route that reads them; they do not create an endpoint. The optional existing-route pattern shows GAIT_DOMAIN_VERIFICATION_CONTENT and GAIT_DOMAIN_VERIFICATION_EXPIRES_AT with the server expiry converted to Unix epoch seconds. Use your route’s actual variable names, then remove temporary settings after verification or expiry. Manual instructions, a downloadable proof file and a copyable Developer or AI handoff all use the saved server challenge’s exact destination and expiry. A generated file does not deploy itself. Expired challenges need a new challenge from Gait; only Verify ownership with Gait can activate the registration.</p>
                <p>Bearer is the default. Cookie becomes selectable only when Gait reports it available for your active, verified registration. Changing transport requires an Owner or Admin with a recent password and authenticator-code sign-in, increments the registration version, and ends existing sessions and pending MFA flows. Users must sign in again. Application keys and registration ownership are not proof of current-session MFA.</p>
                <p>Cookie mode keeps refresh tokens in server-controlled HttpOnly cookies; access tokens stay in memory. The browser must send <code>credentials: "include"</code> and <code>X-Gait-Auth: "1"</code>. It supplies the exact verified Origin automatically. Send <code>session_transport: "cookie"</code> with the login and two-factor-login JSON bodies. Cookie refresh and logout use <code>/api/auth/refresh/</code> and <code>/api/auth/logout/</code> with an empty body; do not send refresh tokens, application IDs or cookie names. Gait chooses cookie names and attributes.</p>
                <Callout title="Test your actual browser">
                    Secure cookies with SameSite=None do not bypass third-party-cookie blocking. If your app and Gait are on different sites, browser policy may block them. Test login, required MFA, refresh and logout in your deployed browser. An active registration does not confirm this round trip. Use a supported deployment topology and browser, or explicitly change to a Bearer integration whose MFA transport is supported. Bearer MFA can still require a temporary cookie, so it is not a guaranteed workaround for blocked cookies; there is no silent transport fallback.
                </Callout>
                <p>Editing the origin, changing transport, revoking registration or suspending the application invalidates its prior sessions under Gait’s server policy. Restoring a setting does not restore old sessions. These application settings do not grant Console cookie trust or change other applications.</p>
                <p>The server-side examples below describe Bearer integration. Do not combine their refresh-token handling with Cookie mode.</p>
            </DocSection>

            <DocSection id="what-gait-sets-up" title="What gets set up on Gait's side">
                <p>Early access: these are set up on Gait's side for each app:</p>
                <ul>
                    <li>
                        <strong>The app's application</strong>, so the app is known to its workspace (
                        <DocLink to="applications-and-connection-keys">Applications &amp; connection keys</DocLink>).
                    </li>
                    <li>
                        <strong>Sign-in limits for the app's server.</strong> Gait limits repeated failed sign-ins. The
                        app's server signs in for all its users, so this is set up for it.
                    </li>
                    <li>
                        <strong>Signing in from the browser</strong>, if the app's web page should call Gait directly
                        rather than go through its server. Verify its exact frontend origin in Human login settings and use only the transports Gait reports as available.
                    </li>
                    <li>
                        <strong>Emails.</strong> Password-reset and email-confirmation emails come from Gait, and their
                        links open Gait's pages.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="how-it-fits-together" title="How it fits together">
                <Diagram
                    source={HOW_IT_FITS}
                    description="A person gives the app's server their email and password. The server signs them in with Gait and keeps the access and refresh tokens in its own session. When the person uses the app, the server calls the app's API with the access token. gait-sdk in the API asks Gait who it is, remembering the answer for up to 45 seconds, and gets back the subject and email. The app's rules decide, and the API answers."
                />
                <p>
                    The server and the API can be the same application. In this server-side flow, the browser never holds Gait's tokens.
                </p>
            </DocSection>

            <DocSection id="sign-people-in" title="The app's server signs people in">
                <p>
                    Gait's address is <code>{GAIT_API_URL}/</code>.
                </p>
                <ul>
                    <li>
                        <strong>Sign up:</strong> <code>POST register/</code> with <code>email</code>,{" "}
                        <code>password</code>, <code>password_confirm</code>, <code>first_name</code> and{" "}
                        <code>last_name</code>. It doesn't sign the person in, so sign in next.
                    </li>
                    <li>
                        <strong>Sign in:</strong> <code>POST login/</code> with <code>email</code> and{" "}
                        <code>password</code>. You get <code>access_token</code> (15 minutes) and{" "}
                        <code>refresh_token</code> (7 days). A 429 means too many tries: wait for{" "}
                        <code>Retry-After</code>.
                    </li>
                </ul>
                <CodeBlock label="Python" code={SERVER_SIGN_IN} />
            </DocSection>

            <DocSection id="two-step-verification" title="Two-step verification">
                <p>
                    If the person has turned on <DocLink to="two-step-verification">two-step verification</DocLink>,{" "}
                    <code>login/</code> answers 401 with <code>"2fa_required": true</code> and a{" "}
                    <code>temp_token</code> cookie.
                </p>
                <ol>
                    <li>Keep the <code>temp_token</code> on the server with the pending sign-in. It lasts 10 minutes and works once.</li>
                    <li>Ask the person for the 6-digit code from their app, or one of their recovery codes.</li>
                    <li>
                        Send it to <code>POST two-factor-login/</code> as <code>otp</code> or{" "}
                        <code>recovery_code</code>, with the <code>temp_token</code> as a cookie. You get the same two
                        tokens.
                    </li>
                </ol>
            </DocSection>

            <DocSection id="stay-signed-in" title="Stay signed in, and sign out">
                <ul>
                    <li>
                        When the API answers 401, call <code>POST token-refresh/</code> once, then retry. If several
                        requests fail together, refresh once for all of them.
                    </li>
                    <li>
                        Save <strong>both</strong> tokens from every refresh. The refresh token changes each time, and
                        using an old one again signs the person out everywhere.
                    </li>
                    <li>
                        To sign out, call <code>POST logout/</code> with the refresh token, then clear the server's session.
                    </li>
                </ul>
                <CodeBlock label="Python" code={SERVER_REFRESH_SIGN_OUT} />
            </DocSection>

            <DocSection id="check-every-request" title="The app's API checks every request">
                <p>
                    gait-sdk checks each request's access token with Gait, for Django REST Framework and FastAPI.
                </p>
                <CodeBlock label="Shell" code={INSTALL} />
                <CodeBlock label="Python" code={VERIFY_USER_SETTINGS} />
                <CodeBlock label="Python" code={VERIFY_USER_VIEW} />
                <ul>
                    <li>
                        <code>request.user.id</code> is Gait's <strong>subject</strong>: a stable id for the person.
                        Store it; don't parse it.
                    </li>
                    <li>
                        A missing, bad or expired token gets <strong>401</strong>. If Gait can't be reached, the API
                        answers <strong>503</strong>; it never lets the request through.
                    </li>
                    <li>
                        gait-sdk remembers each answer for up to 45 seconds, so a sign-out can take that long to reach
                        the API. For sensitive actions (anything irreversible, or changing who can do what), call{" "}
                        <code>require_live_session</code>, which always asks Gait.
                    </li>
                </ul>
                <CodeBlock label="Python" code={LIVE_SESSION_VIEW} />
                <Callout kind="note" title="The connection key isn't part of sign-in">
                    An application's connection key identifies the app and reports its security checks. Signing
                    people in and checking their tokens never use it.
                </Callout>
            </DocSection>

            <DocSection id="link-to-your-users" title="Link Gait people to the app's users">
                <p>
                    Key the app's own records on the subject, never the email: people can change their email. Pick one of
                    two patterns.
                </p>
                <p>
                    <strong>Create on first sign-in</strong>, when anyone with a Gait account may use the app:
                </p>
                <CodeBlock label="Python" code={LINK_ON_FIRST_REQUEST} />
                <p>
                    <strong>Invite only</strong>, when people must be invited. Create the record when someone accepts
                    the app's invite, and refuse anyone without one:
                </p>
                <CodeBlock label="Python" code={LINK_BY_INVITE} />
                <Callout kind="warning" title="Use the app's own roles">
                    Don't grant access from Gait's <code>role</code> field. It's a legacy field; decide what people may
                    do from the app's own records.
                </Callout>
                <p>
                    Organizations, roles and invites inside the app:{" "}
                    <DocLink to="product-organizations-and-invites">An app's own organizations &amp; invites</DocLink>.
                </p>
            </DocSection>

            <DocSection id="troubleshooting" title="Troubleshooting">
                <ul>
                    <li>
                        <strong>A CORS error in the browser:</strong> the web page is calling Gait directly. Go
                        through the server, or check the exact verified frontend origin and transport availability in Human login settings. Console trust is configured separately.
                    </li>
                    <li>
                        <strong>Everything is 401 after 15 minutes:</strong> refresh isn't running, or the new refresh
                        token isn't being saved in the server-side Bearer flow. In Cookie mode, check whether the browser stored and returned the cookie; third-party-cookie policy can block it.
                    </li>
                    <li>
                        <strong>The API answers 503:</strong> check <code>GAIT_AUTH_URL</code>, and that the API can
                        reach it.
                    </li>
                    <li>
                        <strong>The code step never happens:</strong> handle the 401 with{" "}
                        <code>"2fa_required": true</code> from <code>login/</code>.
                    </li>
                    <li>
                        <strong><code>two-factor-login/</code> answers 400:</strong> the <code>temp_token</code> cookie
                        or the code wasn't sent.
                    </li>
                    <li>
                        <strong><code>two-factor-login/</code> answers 401:</strong> either the code was wrong (ask for
                        another), or more than 10 minutes passed or the sign-in was already finished (start again at{" "}
                        <code>login/</code>).
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
