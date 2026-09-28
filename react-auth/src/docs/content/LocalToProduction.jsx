import React from "react";
import { Callout, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { GAIT_API_URL } from "./snippets";

export default function LocalToProduction() {
    return (
        <>
            <p className="doc-lede">
                Your software runs in more than one place. In Gait each place is its own application, with its own
                connection key and its own results. This guide adds production next to a local setup that already
                reports.
            </p>
            <p>
                You'll need an application in <code>local</code> that's already sending security checks (see{" "}
                <DocLink to="getting-started">Getting started</DocLink> and{" "}
                <DocLink to="connecting-your-software">Connecting your software</DocLink>), and the Owner or Admin role
                in your workspace.
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
                        Use the same name and slug as your local application (for example <code>acme-api</code>), with
                        environment <strong>Production</strong>. The same slug in another environment is a separate
                        application. The slug and environment can't be changed later.
                    </li>
                    <li>
                        Open the new application and issue a connection key, with a label that says where it will live
                        (for example <code>prod server</code>). The key is shown once: copy it straight into your
                        secret store.
                    </li>
                    <li>
                        Give your production service that key as <code>GAIT_APPLICATION_CREDENTIAL</code>, deploy, and
                        let it send a security check.
                    </li>
                </ol>
                <p>Only the key differs between environments:</p>
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
                                <code>{GAIT_API_URL}</code> (the same everywhere)
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <code>GAIT_APPLICATION_CREDENTIAL</code>
                            </th>
                            <td>the key of acme-api · local</td>
                            <td>the key of acme-api · production</td>
                        </tr>
                    </tbody>
                </DocTable>
                <Callout kind="warning" title="Never copy a key between environments">
                    Each environment gets a key issued for its own application. A production service given your
                    laptop's key would report as <code>local</code>, not <code>production</code>.
                </Callout>
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
                        For extra safety, have your software confirm which environment it's running in before
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
