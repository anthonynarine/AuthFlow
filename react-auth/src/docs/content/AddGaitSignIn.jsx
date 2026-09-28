import React from "react";
import { Link } from "react-router-dom";
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
// reaching your API, JWKS verification.

const HOW_IT_FITS = `sequenceDiagram
    autonumber
    actor P as Person
    participant S as Your server
    participant G as Gait
    participant A as Your API with gait-sdk

    P->>S: Email and password
    S->>G: Sign in
    G-->>S: Access token and refresh token
    Note over S: Kept in your server's session
    P->>S: Use your product
    S->>A: Request with the access token
    A->>G: Who is this? (remembered up to 45 s)
    G-->>A: Subject and email
    Note over A: Your rules decide
    A-->>S: Answer
    S-->>P: Page`;

export default function AddGaitSignIn() {
    return (
        <>
            <p className="doc-lede">
                Let your product's users sign in with a Gait account. Gait checks who they are; your product still
                decides what they may do.
            </p>
            <p>
                <StatusBadge feature="productSignIn" /> <Link to="/early-access">Request early access</Link>.
                Background: <DocLink to="people-and-applications#your-products-own-users">Your product's own
                users</DocLink>.
            </p>

            <DocSection id="what-gait-sets-up" title="What Gait sets up for you">
                <p>Early access: Gait sets up your access. Ask us for:</p>
                <ul>
                    <li>
                        <strong>Your application</strong>, so your product is known to your workspace (
                        <DocLink to="applications-and-connection-keys">Applications &amp; connection keys</DocLink>).
                    </li>
                    <li>
                        <strong>Sign-in limits for your server.</strong> Gait limits repeated failed sign-ins. Your
                        server signs in for all your users, so we set this up for it.
                    </li>
                    <li>
                        <strong>Signing in from the browser</strong>, if you'd rather your web page called Gait
                        directly than go through your server. We allow your site's address.
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
                    description="A person gives your server their email and password. Your server signs them in with Gait and keeps the access and refresh tokens in its own session. When the person uses your product, your server calls your API with the access token. gait-sdk in your API asks Gait who it is, remembering the answer for up to 45 seconds, and gets back the subject and email. Your rules decide, and your API answers."
                />
                <p>
                    Your server and your API can be the same application. Either way, the browser never holds Gait's
                    tokens.
                </p>
            </DocSection>

            <DocSection id="sign-people-in" title="Your server signs people in">
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
                    <li>Keep the <code>temp_token</code> on your server with the pending sign-in. It lasts 10 minutes and works once.</li>
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
                        When your API answers 401, call <code>POST token-refresh/</code> once, then retry. If several
                        requests fail together, refresh once for all of them.
                    </li>
                    <li>
                        Save <strong>both</strong> tokens from every refresh. The refresh token changes each time, and
                        using an old one again signs the person out everywhere.
                    </li>
                    <li>
                        To sign out, call <code>POST logout/</code> with the refresh token, then clear your session.
                    </li>
                </ul>
                <CodeBlock label="Python" code={SERVER_REFRESH_SIGN_OUT} />
            </DocSection>

            <DocSection id="check-every-request" title="Your API checks every request">
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
                        A missing, bad or expired token gets <strong>401</strong>. If Gait can't be reached, your API
                        answers <strong>503</strong>; it never lets the request through.
                    </li>
                    <li>
                        gait-sdk remembers each answer for up to 45 seconds, so a sign-out can take that long to reach
                        your API. For sensitive actions (anything irreversible, or changing who can do what), call{" "}
                        <code>require_live_session</code>, which always asks Gait.
                    </li>
                </ul>
                <CodeBlock label="Python" code={LIVE_SESSION_VIEW} />
                <Callout kind="note" title="The connection key isn't part of sign-in">
                    Your application's connection key identifies your software and reports its security checks. Signing
                    people in and checking their tokens never use it.
                </Callout>
            </DocSection>

            <DocSection id="link-to-your-users" title="Link Gait people to your users">
                <p>
                    Key your own records on the subject, never the email: people can change their email. Pick one of
                    two patterns.
                </p>
                <p>
                    <strong>Create on first sign-in</strong>, when anyone with a Gait account may use your product:
                </p>
                <CodeBlock label="Python" code={LINK_ON_FIRST_REQUEST} />
                <p>
                    <strong>Invite only</strong>, when people must be invited. Create the record when someone accepts
                    your invite, and refuse anyone without one:
                </p>
                <CodeBlock label="Python" code={LINK_BY_INVITE} />
                <Callout kind="warning" title="Use your own roles">
                    Don't grant access from Gait's <code>role</code> field. It's a legacy field; decide what people may
                    do from your own records.
                </Callout>
                <p>
                    Organizations, roles and invites inside your product:{" "}
                    <DocLink to="product-organizations-and-invites">Your product's organizations &amp; invites</DocLink>.
                </p>
            </DocSection>

            <DocSection id="troubleshooting" title="Troubleshooting">
                <ul>
                    <li>
                        <strong>A CORS error in the browser:</strong> your web page is calling Gait directly. Go
                        through your server, or ask us to allow your site.
                    </li>
                    <li>
                        <strong>Everything is 401 after 15 minutes:</strong> refresh isn't running, or the new refresh
                        token isn't being saved.
                    </li>
                    <li>
                        <strong>Your API answers 503:</strong> check <code>GAIT_AUTH_URL</code>, and that your API can
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
