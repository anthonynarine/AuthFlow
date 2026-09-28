import React from "react";
import { Link } from "react-router-dom";
import { Callout, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { statusOf } from "../featureStatus";

export default function GettingStarted() {
    return (
        <>
            <p className="doc-lede">
                Gait watches the security of your software and helps you fix what it finds. This guide sets up your
                workspace in the Gait console and connects your first application.
            </p>

            <Callout kind="availability" title="What works today">
                Signing in, creating your workspace, inviting your team, managing applications and their connection
                keys, reporting security checks, and reviewing and acting on findings all work in the console now.
                Where something isn't available yet, the page describing it says so.
            </Callout>

            <p>
                New here? Read <DocLink to="people-and-applications">People and applications</DocLink> first. It's
                the one idea everything else builds on.
            </p>

            <DocSection id="the-four-things-youll-create" title="The four things you'll create">
                <DocTable caption="The four things you'll create">
                    <thead>
                        <tr>
                            <th scope="col">Thing</th>
                            <th scope="col">What it is</th>
                            <th scope="col">Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Workspace</th>
                            <td>
                                Your team's private space in Gait. Everything else belongs to it, and nobody outside it
                                can see any of it.
                            </td>
                            <td><code>Acme</code></td>
                        </tr>
                        <tr>
                            <th scope="row">Application</th>
                            <td>One piece of your software, in <strong>one</strong> environment.</td>
                            <td><code>Acme API</code> in <code>production</code></td>
                        </tr>
                        <tr>
                            <th scope="row">Environment</th>
                            <td>
                                Where that software runs: <code>local</code>, <code>test</code>, <code>ci</code>,{" "}
                                <code>staging</code> or <code>production</code>. The same software in two environments
                                is two applications.
                            </td>
                            <td><code>local</code> for your laptop, <code>production</code> for the live service</td>
                        </tr>
                        <tr>
                            <th scope="row">Connection key</th>
                            <td>The secret your application uses to prove to Gait that it is that application.</td>
                            <td>Shown once, when you issue it</td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>

            <DocSection id="step-1-sign-in" title="Step 1: Sign in">
                <p>
                    <Link to="/login">Sign in</Link>, or <Link to="/register">create an account</Link>.
                </p>
                <p>
                    Your browser never holds a long-lived login token that a script could read. Reloading the page
                    keeps you signed in, and <strong>Sign out</strong> ends the session on Gait's side, not just in
                    your browser.
                </p>
                {statusOf("emailVerification") === "live" ? (
                    <p>
                        When you create an account, Gait emails you a link. Confirm your email address with it before
                        you create a workspace or accept an invite; the link lasts 48 hours, and you can ask for a new
                        one from the console.
                    </p>
                ) : (
                    <Callout kind="availability">
                        Email confirmation is rolling out. Once it's live, Gait emails you a link when you create an
                        account, and you'll need to confirm your email address before you can create a workspace or
                        accept an invite.
                    </Callout>
                )}
            </DocSection>

            <DocSection id="step-2-create-your-company" title="Step 2: Create your workspace">
                <p>The first time you open the console, Gait asks you to create your workspace.</p>
                <ul>
                    <li><strong>Workspace name</strong>: what your team will see, e.g. <code>Acme</code>.</li>
                    <li>
                        <strong>Workspace URL slug</strong>: a short, lowercase identifier used in links, e.g.{" "}
                        <code>acme</code>. <strong>Choose carefully: it can't be changed later.</strong>
                    </li>
                </ul>
                <p>You become the workspace's <strong>Owner</strong>.</p>
            </DocSection>

            <DocSection id="step-3-add-an-application" title="Step 3: Add an application">
                <p>Add one application per piece of software <strong>per environment</strong>.</p>
                <ul>
                    <li><strong>Name</strong>: e.g. <code>Acme API</code>.</li>
                    <li>
                        <strong>Slug</strong>: e.g. <code>acme-api</code>. You can reuse the same slug in another
                        environment; that's a separate application.
                    </li>
                    <li>
                        <strong>Environment</strong>: where this copy runs. Gait keeps each environment's security
                        picture separate, so pick carefully.
                    </li>
                </ul>
                <p>
                    Tip: start with the environment you're working in today (often <code>local</code>), and add{" "}
                    <code>staging</code> and <code>production</code> applications when you deploy there.
                </p>
            </DocSection>

            <DocSection id="step-4-get-the-connection-key" title="Step 4: Get the connection key">
                <p>Gait shows the application's <strong>connection key exactly once</strong>.</p>
                <ol>
                    <li>Copy it immediately.</li>
                    <li>
                        Put it where your application reads secrets, such as its <code>.env</code> file or your hosting
                        provider's secret settings. Never put it in source code, tickets or chat.
                    </li>
                    <li>
                        If you lose it, issue a new key and revoke the old one. See{" "}
                        <DocLink to="applications-and-connection-keys#rotating-keys">Rotating keys</DocLink>.
                    </li>
                </ol>
            </DocSection>

            <DocSection id="next-steps" title="Next steps">
                <ul>
                    <li>
                        <DocLink to="connecting-your-software">Connect your software</DocLink>: install the SDK and send
                        your first security check.
                    </li>
                    <li>
                        <DocLink to="security-checks-and-findings">Security checks &amp; findings</DocLink>: what happens
                        after you report.
                    </li>
                    <li>
                        <DocLink to="teams-roles-and-invites">Teams, roles &amp; invites</DocLink>: bring your team in.
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
