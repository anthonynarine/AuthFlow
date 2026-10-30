import React from "react";
import { Callout, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { GAIT_API_URL } from "./snippets";

export default function LocalToProduction() {
    return (
        <>
            <p className="doc-lede">
                Each of my apps runs in more than one place. In Gait each place is its own application, with its own
                connection key and its own results. Security reporting and hosted user sign-in have separate
                setup steps below.
            </p>
            <p>
                You'll need an application in <code>local</code> that's already sending security checks (see{" "}
                <DocLink to="getting-started">Getting started</DocLink> and{" "}
                <DocLink to="connecting-your-software">Connecting an app</DocLink>), and the Owner or Admin role
                in the app's workspace.
            </p>

            <DocSection id="why-one-application-per-environment" title="Why one application per environment">
                <ul>
                    <li>
                        <strong>Separate keys.</strong> A key reports only for its own application, so the key on a
                        laptop can never report as production.
                    </li>
                    <li>
                        <strong>Separate results.</strong> A failing check in <code>local</code> never opens, changes or
                        closes a finding in <code>production</code>, and the other way round.
                    </li>
                    <li>
                        <strong>The key decides.</strong> Gait takes the workspace and environment from the key. Nothing
                        in a report can point it at another environment.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="add-production" title="Add production">
                <ol>
                    <li>
                        In the console, choose <strong>Production</strong> in the <strong>Environment</strong> switch at
                        the top.
                    </li>
                    <li>
                        Open <strong>Applications</strong> and choose <strong>Add application</strong>. The environment
                        starts as the one you're looking at.
                    </li>
                    <li>
                        Use the same name and slug as the local application (for example <code>lumen-api</code>), with
                        environment <strong>Production</strong>. The same slug in another environment is a separate
                        application. The slug and environment can't be changed later.
                    </li>
                    <li>
                        Open the new application and issue a connection key, with a label that says where it will live
                        (for example <code>prod server</code>). The key is shown once: copy it straight into the
                        secret store.
                    </li>
                    <li>
                        Save the key in the production backend's hosting secret settings as{" "}
                        <code>GAIT_APPLICATION_CREDENTIAL</code>. For security reporting within the same Gait deployment,
                        keep <code>GAIT_AUTH_URL</code> the same. Hosted development sign-in uses the separate settings
                        below. Restart or deploy the backend so it loads the new values.
                    </li>
                    <li>
                        Run the <DocLink to="connecting-your-software#verify-the-connection">connection check</DocLink>{" "}
                        with <code>EXPECTED_ENVIRONMENT = "production"</code> and the application's workspace and slug.
                        It must confirm the production application before sending a security check.
                    </li>
                </ol>
                <p>For security reporting within one Gait deployment, the key identifies the environment:</p>
                <DocTable caption="Settings per environment">
                    <thead>
                        <tr>
                            <th scope="col">Setting</th>
                            <th scope="col">
                                <code>local</code>
                            </th>
                            <th scope="col">
                                <code>production</code>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">
                                <code>GAIT_AUTH_URL</code>
                            </th>
                            <td colSpan={2}>
                                <code>{GAIT_API_URL}</code> (the same reporting deployment)
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <code>GAIT_APPLICATION_CREDENTIAL</code>
                            </th>
                            <td>the key of lumen-api · local</td>
                            <td>the key of lumen-api · production</td>
                        </tr>
                    </tbody>
                </DocTable>
                <Callout kind="warning" title="Never copy a key between environments">
                    Each environment gets a key issued for its own application. A production service given a
                    laptop's key would report as <code>local</code>, not <code>production</code>.
                </Callout>
                <p>
                    The organization stays the same. Local and Production are separate registrations of the app;
                    production replicas can share that production application. The registration identifies the
                    application and environment, not a server hostname. For backend configuration, use the{" "}
                    <DocLink to="connecting-your-software#django">Django</DocLink> or{" "}
                    <DocLink to="connecting-your-software#fastapi">FastAPI</DocLink> instructions.
                </p>
            </DocSection>

            <DocSection id="hosted-development-sign-in" title="Hosted development sign-in">
                <Callout kind="availability">
                    Hosted development is a controlled pilot. A loaded Console page does not mean its API is ready
                    for sign-in. Complete account verification, application setup and browser testing before using it.
                </Callout>
                <p>
                    Use the development Console for an app running on localhost. The production Console's Local
                    environment filter does not switch to the development service. Development has separate accounts,
                    applications, keys and sessions. You can register the same email address in both services, but
                    must verify each account separately; its password and MFA enrollment are not copied.
                </p>
                <DocTable caption="Hosted authentication settings per environment">
                    <thead>
                        <tr><th scope="col">Setting</th><th scope="col">Development</th><th scope="col">Production</th></tr>
                    </thead>
                    <tbody>
                        <tr><th scope="row">Console</th><td><code>https://dev.gaitobservatory.com</code></td><td><code>https://gaitobservatory.com</code></td></tr>
                        <tr><th scope="row">API</th><td><code>https://api.dev.gaitobservatory.com/api</code></td><td><code>{GAIT_API_URL}</code></td></tr>
                        <tr><th scope="row">Issuer</th><td><code>https://api.dev.gaitobservatory.com</code></td><td><code>https://api.gaitobservatory.com</code></td></tr>
                        <tr><th scope="row">JWKS URL</th><td><code>https://api.dev.gaitobservatory.com/.well-known/jwks.json</code></td><td><code>https://api.gaitobservatory.com/.well-known/jwks.json</code></td></tr>
                        <tr><th scope="row">Application, audience and credential</th><td>Use the development registration's values.</td><td>Use the production registration's values.</td></tr>
                    </tbody>
                </DocTable>
                <p>
                    Enroll the exact browser origin, including its port, such as <code>http://localhost:5173</code>.
                    Development accepts supported HTTP loopback origins with explicit owner acknowledgment.
                    Production continues to require a verified public HTTPS origin. A development token cannot be
                    used as a production token.
                </p>
                <p>
                    Your application's backend handles confidential sign-in and stores Gait tokens and credentials.
                    The browser uses your own application's session cookie and CSRF protection. A Vite proxy can
                    route browser calls to that backend; proxying Gait cookies alone is not this integration.
                    The same application code can select either service through environment settings once this
                    backend transport is implemented.
                </p>
                <p>
                    Serialize refresh requests and save each replacement token pair. Send activity only for real
                    foreground interaction; polling and automatic refresh do not extend the idle deadline. Test
                    sign-in, any enabled MFA, activity, refresh and logout in your actual browser.
                </p>
                <p>
                    New registrations default to Optional MFA in both services. Enabled MFA still requires a second
                    factor, and an application can explicitly choose Required. See{" "}
                    <DocLink to="add-gait-sign-in#two-step-verification">Application MFA policy</DocLink>.
                </p>
            </DocSection>

            <DocSection id="check-it-arrived" title="Check it arrived">
                <ul>
                    <li>
                        With <strong>Production</strong> selected, <strong>Overview</strong> and{" "}
                        <strong>Applications</strong> show the new application's results. Each environment in the
                        switch says whether it has data yet.
                    </li>
                    <li>
                        Nothing there? Check that production has the production key, not the local one. A missing,
                        revoked or wrong key is refused. See{" "}
                        <DocLink to="troubleshooting">Troubleshooting</DocLink>.
                    </li>
                    <li>
                        For extra safety, have the app confirm which environment it's running in before
                        reporting, as described in{" "}
                        <DocLink to="connecting-your-software#writing-a-self-check">Writing a self-check</DocLink>.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="other-environments" title="Staging, test and CI">
                <p>
                    Gait has five environments: <code>local</code>, <code>test</code>, <code>ci</code>,{" "}
                    <code>staging</code> and <code>production</code>. Add each one you run the same way: its own
                    application, its own key. Nothing is copied or promoted from one environment to another, so each is
                    set up on its own.
                </p>
            </DocSection>

            <DocSection id="when-an-environment-goes-away" title="When an environment goes away">
                <p>
                    Suspend the application to stop its keys at once, or retire it (Owner only, permanent) when it's
                    gone for good. Its history stays visible either way. See{" "}
                    <DocLink to="applications-and-connection-keys#suspend-reactivate-retire">
                        Suspend, reactivate, retire
                    </DocLink>
                    .
                </p>
            </DocSection>
        </>
    );
}
