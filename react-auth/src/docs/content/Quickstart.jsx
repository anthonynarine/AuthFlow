import React from "react";
import { CodeBlock, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { StatusCell } from "../components/StatusCell";
import { statusAsOfLabel } from "../featureStatus";
import { ENV_VARS, INSTALL, REPORT } from "./snippets";

// [step, status features, details link target, details link text]
const STEPS = [
    [<><strong>Create an account</strong> at gaitobservatory.com</>, ["core"], "getting-started", "Getting started"],
    [<><strong>Confirm your email</strong> from the link Gait sends</>, ["emailVerification"], "getting-started", "Getting started"],
    [
        <>
            <strong>Create your company</strong>: a name and a short slug such as <code>acme</code>. The slug can't be
            changed later. You become its Owner.
        </>,
        ["core"],
        "getting-started",
        "Getting started",
    ],
    [
        <>
            <strong>Add an application</strong>: name, slug and environment, e.g. Acme API · <code>local</code>.
        </>,
        ["core"],
        "applications-and-connection-keys",
        "Applications & connection keys",
    ],
    [
        <>
            <strong>Copy the connection key.</strong> It's shown once. Put it in your app's <code>.env</code> or your
            host's secret settings, never in code.
        </>,
        ["core"],
        "applications-and-connection-keys",
        "Applications & connection keys",
    ],
    [
        <>
            <strong>Install the SDK and set two variables</strong> (<code>GAIT_AUTH_URL</code>,{" "}
            <code>GAIT_APPLICATION_CREDENTIAL</code>).
        </>,
        ["core"],
        "connecting-your-software",
        "Connecting your software",
    ],
    [
        <><strong>Send your first security check</strong> (PASS or FAIL).</>,
        ["core"],
        "connecting-your-software#report-a-security-check",
        "Connecting your software",
    ],
    [
        <>
            <strong>See the result in the console.</strong> A FAIL opens a finding; a later PASS closes it.
        </>,
        ["findingsScreen"],
        "security-checks-and-findings",
        "Security checks & findings",
    ],
];

export default function Quickstart() {
    return (
        <>
            <p className="doc-lede">From nothing to your first security check in about 15 minutes.</p>

            <DocSection id="checklist" title="Checklist">
                <DocTable caption="Quickstart checklist">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Step</th>
                            <th scope="col">Status</th>
                            <th scope="col">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STEPS.map(([step, features, to, linkText], index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{step}</td>
                                <td><StatusCell features={features} /></td>
                                <td><DocLink to={to}>{linkText}</DocLink></td>
                            </tr>
                        ))}
                    </tbody>
                </DocTable>
                <p className="doc-muted">Status as of {statusAsOfLabel()}.</p>
            </DocSection>

            <DocSection id="step-6-install-and-configure" title="Step 6: Install and configure">
                <CodeBlock label="Shell" code={INSTALL} />
                <CodeBlock label="Environment" code={ENV_VARS} />
            </DocSection>

            <DocSection id="step-7-send-your-first-check" title="Step 7: Send your first check">
                <CodeBlock label="Python" code={REPORT} />
                <p>
                    Details: <DocLink to="connecting-your-software#report-a-security-check">Connecting your software</DocLink>.
                </p>
            </DocSection>

            <DocSection id="next" title="Next">
                <ul>
                    <li>
                        Add an application for each other environment you run (<code>staging</code>,{" "}
                        <code>production</code>), each with its own key.
                    </li>
                    <li>Run your checks on every deploy, or on a schedule.</li>
                    <li>
                        <DocLink to="teams-roles-and-invites">Invite your team</DocLink>{" "}
                        <StatusCell features={["membersAndInviteAccept"]} />
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
