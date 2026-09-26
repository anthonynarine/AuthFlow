import React from "react";
import { Callout, CodeBlock, DocLink, DocSection } from "../components/DocPrimitives";
import { ENV_VARS, INSTALL, REPORT } from "./snippets";

export default function ConnectingYourSoftware() {
    return (
        <>
            <p className="doc-lede">
                Once your application has a connection key, it can report its own security checks to Gait. This page
                covers installing the SDK, configuring it, and sending your first report.
            </p>
            <p>
                You'll need an application and its connection key first. See{" "}
                <DocLink to="getting-started">Getting started</DocLink>.
            </p>

            <DocSection id="install-the-sdk" title="Install the SDK">
                <p>For Python services, install the Gait SDK from PyPI:</p>
                <CodeBlock label="Shell" code={INSTALL} />
            </DocSection>

            <DocSection id="configure-it" title="Configure it">
                <p>The SDK reads two environment variables:</p>
                <CodeBlock label="Environment" code={ENV_VARS} />
                <ul>
                    <li>
                        <code>GAIT_AUTH_URL</code> is always <code>https://api.gaitobservatory.com/api</code>.
                    </li>
                    <li>
                        <code>GAIT_APPLICATION_CREDENTIAL</code> is this application's connection key. Keep it in your
                        secret settings, never in source code.
                    </li>
                </ul>
                <Callout kind="warning" title="One key per environment">
                    Each environment is its own application with its own key. Give your production service the key of
                    your <code>production</code> application, your laptop the key of your <code>local</code>{" "}
                    application, and so on.
                </Callout>
            </DocSection>

            <DocSection id="report-a-security-check" title="Report a security check">
                <p>
                    Your application reports what it knows about its own security as <strong>signals</strong>. Today
                    Gait accepts one signal type, <code>APPLICATION_SELF_CHECK</code>: your application runs its own
                    checks and reports <strong>PASS</strong> or <strong>FAIL</strong>.
                </p>
                <CodeBlock label="Python" code={REPORT} />
                <ul>
                    <li>
                        <code>source_reference</code> must be <strong>unique per run</strong>. Sending the same one
                        twice is treated as a retry of the same report, not a new one.
                    </li>
                    <li>
                        The payload is stored as evidence. Put check <strong>names and results</strong> in it, never
                        secrets, hostnames or personal data.
                    </li>
                    <li>
                        A report can never choose your company, application or environment. Gait takes all of those
                        from the connection key alone.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="writing-a-self-check" title="Writing a self-check">
                <p>A pattern that works well:</p>
                <ul>
                    <li>
                        Put your checks in one command your deploy pipeline or a scheduler can run, e.g. "debug mode is
                        off", "HTTPS is enforced", "secure cookies are on".
                    </li>
                    <li>Report <strong>FAIL</strong> if any check fails, and list every check's result in the payload.</li>
                    <li>
                        Give it a <code>--dry-run</code> option that prints the results without reporting, so you can
                        try it safely.
                    </li>
                    <li>
                        Have it confirm which environment it's running in before reporting, and refuse if the key belongs
                        to a different environment's application. That catches a copied key early.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="what-happens-next" title="What happens next">
                <p>
                    A <strong>FAIL</strong> opens a finding; a later <strong>PASS</strong> resolves it. See{" "}
                    <DocLink to="security-checks-and-findings">Security checks &amp; findings</DocLink>. If a report is
                    rejected, see <DocLink to="troubleshooting">Troubleshooting</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
