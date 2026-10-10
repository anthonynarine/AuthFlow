import React from "react";
import { CodeBlock, DocLink, DocSection, DocTable } from "../components/DocPrimitives";

// Placeholder only. Never replace it with anything that looks like a real key.
const ENV_EXAMPLE = `# .env for lumen-api (production), kept out of source control
GAIT_APPLICATION_CREDENTIAL=<your connection key>`;

export default function ApplicationsAndConnectionKeys() {
    return (
        <>
            <p className="doc-lede">
                An application is one piece of an app, such as Lumen's API, in one environment. Its connection keys are how it proves
                to Gait who it is.
            </p>

            <DocSection id="environments" title="Environments">
                <p>
                    Every application belongs to exactly one environment: <code>local</code>, <code>test</code>,{" "}
                    <code>ci</code>, <code>staging</code> or <code>production</code>. The same software in two
                    environments is two applications, each with its own keys and its own security picture.
                </p>
                <DocTable caption="Example applications for one piece of software">
                    <thead>
                        <tr>
                            <th scope="col">Application</th>
                            <th scope="col">Slug</th>
                            <th scope="col">Environment</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Lumen API</td><td><code>lumen-api</code></td><td><code>local</code></td></tr>
                        <tr><td>Lumen API</td><td><code>lumen-api</code></td><td><code>staging</code></td></tr>
                        <tr><td>Lumen API</td><td><code>lumen-api</code></td><td><code>production</code></td></tr>
                    </tbody>
                </DocTable>
                <p>Owners and Admins can add and rename applications. Members can see them.</p>
            </DocSection>

            <DocSection id="connection-keys" title="Connection keys">
                <ul>
                    <li>
                        A key is shown <strong>exactly once</strong>, when it's issued. Gait keeps only an irreversible
                        fingerprint, so nobody, including Gait, can show it to you again.
                    </li>
                    <li>
                        Give each key a <strong>label</strong> that says where it lives, e.g.{" "}
                        <code>prod server, Sept rotation</code>.
                    </li>
                    <li>An application can have more than one active key at a time. That's what makes rotation safe.</li>
                    <li>
                        The key list shows each key's label, status, who created it and when, and when it was{" "}
                        <strong>last used</strong>.
                    </li>
                </ul>
                <p>Store it with the application's other secrets:</p>
                <CodeBlock label="Environment" code={ENV_EXAMPLE} />
                <p>
                    Never put a key in source code, tickets, chat or screenshots. To use it, see{" "}
                    <DocLink to="connecting-your-software">Connecting an app</DocLink>.
                </p>
            </DocSection>

            <DocSection id="rotating-keys" title="Rotating keys">
                <ol>
                    <li>Issue a new key with a clear label.</li>
                    <li>Deploy it to the application.</li>
                    <li>
                        In the key list, wait until the new key shows a recent <strong>Last used</strong> time and the
                        old one stops updating.
                    </li>
                    <li>Revoke the old key.</li>
                </ol>
                <p>
                    Revoking is immediate and permanent. Check <strong>Last used</strong> first: if a key was used
                    recently, something still depends on it.
                </p>
            </DocSection>

            <DocSection id="if-a-key-leaks" title="If a key leaks">
                <ol>
                    <li>
                        <strong>Revoke the leaked key.</strong> It stops working at once. The app stops
                        reporting until it has a new key.
                    </li>
                    <li>Issue a new key and deploy it.</li>
                </ol>
                <p>
                    Not sure which key leaked? Suspend the application (below) to stop all of its keys at once, revoke
                    every key that might be affected, then reactivate it. New keys can only be issued while the
                    application is active, so reactivate before issuing the replacement.
                </p>
                <p>
                    A leaked key can only report checks for its own application. It can't sign in, see your console or
                    reach another application.
                </p>
            </DocSection>

            <DocSection id="suspend-reactivate-retire" title="Suspend, reactivate, retire">
                <DocTable caption="Application states">
                    <thead>
                        <tr>
                            <th scope="col">Action</th>
                            <th scope="col">Effect</th>
                            <th scope="col">Who</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Suspend</th>
                            <td>All of the application's keys stop working immediately.</td>
                            <td>Owner, Admin</td>
                        </tr>
                        <tr>
                            <th scope="row">Reactivate</th>
                            <td>Its keys work again (except any that were revoked).</td>
                            <td>Owner, Admin</td>
                        </tr>
                        <tr>
                            <th scope="row">Retire</th>
                            <td>
                                <strong>Permanent.</strong> The application stops working and every one of its keys is
                                revoked.
                            </td>
                            <td>Owner only</td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>
        </>
    );
}
