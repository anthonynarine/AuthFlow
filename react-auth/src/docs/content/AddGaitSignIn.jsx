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

// Source brief: django_auth docs/public/ADD_GAIT_SIGN_IN.md; internals and the
// onboarding runbook: docs/console/PRODUCT_SIGN_IN.md. The documented path is
// server-side sign-in (the product's server talks to Gait); browser-direct is
// an "ask Gait" item. Every "what Gait sets up" item maps to a row in
// PRODUCT_SIGN_IN.md section 4. Deliberately not claimed: tokens tied to one
// product, a hosted sign-in page, branded emails or links, email confirmation
// reaching the app's API, JWKS verification. Voice: first person, Lumen as
// the example app (GAIT-13).

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
                        rather than go through its server. Gait then allows the site's address.
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
                    The server and the API can be the same application. Either way, the browser never holds Gait's
                    tokens.
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
                        through the server, or allow the site on Gait's side.
                    </li>
                    <li>
                        <strong>Everything is 401 after 15 minutes:</strong> refresh isn't running, or the new refresh
                        token isn't being saved.
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
