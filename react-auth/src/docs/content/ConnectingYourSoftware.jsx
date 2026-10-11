import React from "react";
import { Callout, CodeBlock, DocLink, DocSection } from "../components/DocPrimitives";
import {
    DJANGO_APPLICATION_SETTINGS, ENV_VARS, INSTALL, REPORT, VERIFY_APPLICATION, installCommand,
} from "./snippets";

export default function ConnectingYourSoftware() {
    return (
        <>
            <p className="doc-lede">
                Once an application has a connection key, it can report its own security checks to Gait. This is how I
                connect an app: save the key, configure Django or FastAPI, verify the connection, and send a first
                report. Lumen's reporting is built this way but not yet running.
            </p>
            <p>
                You'll need an application and its connection key first. See{" "}
                <DocLink to="getting-started">Getting started</DocLink>.
            </p>

            <DocSection id="install-the-sdk" title="Install the SDK">
                <p>For Python services, install the Gait SDK from PyPI:</p>
                <CodeBlock label="Shell" code={INSTALL} />
                <CodeBlock label="FastAPI install" code={installCommand("fastapi")} />
                <p>
                    Use the command for the backend framework, inside its virtual environment. The core package also
                    works in standalone Python services. Other backends can use Gait's HTTP APIs, but do not have a
                    built-in SDK integration here.
                </p>
            </DocSection>

            <DocSection id="configure-it" title="Configure it">
                <p>
                    Save these values in the backend project's <code>.env</code> file for local development. Replace
                    the placeholder with the connection key shown once in the console. Add <code>.env</code> to{" "}
                    <code>.gitignore</code>; commit only a template with placeholders, such as <code>.env.example</code>.
                </p>
                <CodeBlock label="Backend .env" code={ENV_VARS} />
                <ul>
                    <li>
                        <code>GAIT_AUTH_URL</code> is always <code>https://api.gaitobservatory.com/api</code>.
                    </li>
                    <li>
                        <code>GAIT_APPLICATION_CREDENTIAL</code> is this application's connection key. Keep it in your
                        backend secret settings, never in source code, frontend code, tickets or chat. Do not use a
                        browser-exposed variable prefix such as <code>VITE_</code>, <code>NEXT_PUBLIC_</code> or{" "}
                        <code>REACT_APP_</code> for this key.
                    </li>
                </ul>
                <Callout kind="warning" title="One key per environment">
                    Each environment is its own application with its own key. Give the production service the key of
                    the <code>production</code> application, the laptop the key of the <code>local</code>{" "}
                    application, and so on.
                </Callout>
                <p>
                    Choose the matching configuration below: <DocLink to="connecting-your-software#django">Django</DocLink>{" "}
                    or <DocLink to="connecting-your-software#fastapi">FastAPI</DocLink>.
                </p>
            </DocSection>

            <DocSection id="django" title="Django configuration">
                <p>
                    Expose both values through <code>settings.py</code>. This example uses python-decouple, which the
                    SDK depends on. If the project already uses another environment loader, use that instead.
                </p>
                <CodeBlock label="Django settings.py" code={DJANGO_APPLICATION_SETTINGS} />
                <p>
                    Django settings take precedence over environment values. Do not leave an old hard-coded key in
                    settings. Restart the backend after changing configuration.
                </p>
            </DocSection>

            <DocSection id="fastapi" title="FastAPI configuration">
                <p>
                    No Django settings file is needed. The SDK reads process environment variables first, then uses
                    python-decouple to search for <code>.env</code> from the process's working directory and its parents.
                    Run the backend from the project root containing that file; no extra dotenv loader is required.
                </p>
                <p>
                    If the app already loads its own environment file, load it before importing SDK modules. The SDK
                    reads configuration when imported, so restart the backend after changing values. In production,
                    use environment variables supplied by the host's secret settings.
                </p>
            </DocSection>

            <DocSection id="verify-the-connection" title="Verify the connection">
                <p>
                    Replace the workspace and application slug placeholders with the values in the console, and set
                    the expected environment (<code>local</code> for development). Save this as{" "}
                    <code>check_gait.py</code> in the backend project root.
                </p>
                <CodeBlock label="Connection check" code={VERIFY_APPLICATION} />
                <p>Run it from that directory in the backend's virtual environment:</p>
                <CodeBlock label="Django connection command" code="python manage.py shell --interface python < check_gait.py" />
                <CodeBlock label="FastAPI connection command" code="python check_gait.py" />
                <p>
                    Success prints <code>Connected: &lt;application slug&gt; · local</code>. The check refuses a key
                    belonging to a different workspace, app or environment. Verification does not send a security
                    report; the next step does that.
                </p>
                <Callout title="Application identity and user sign-in are separate">
                    This key identifies the application. It does not sign in users or protect API routes by itself.
                    For user authentication, follow <DocLink to="add-gait-sign-in">Add Gait sign-in</DocLink>.
                </Callout>
                <p>
                    Key missing or rejected? Check backend configuration and the key's status. Gait unavailable?
                    Check the API URL and network connection, then retry. Do not bypass verification or print the
                    key while debugging. See <DocLink to="troubleshooting">Troubleshooting</DocLink>.
                </p>
            </DocSection>

            <DocSection id="report-a-security-check" title="Report a security check">
                <p>
                    An application reports what it knows about its own security as <strong>signals</strong>. Today
                    Gait accepts one signal type, <code>APPLICATION_SELF_CHECK</code>: the application runs its own
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
                        A report can never choose its workspace, application or environment. Gait takes all of those
                        from the connection key alone.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="writing-a-self-check" title="Writing a self-check">
                <p>A pattern that works well:</p>
                <ul>
                    <li>
                        Put the checks in one command the deploy pipeline or a scheduler can run, e.g. "debug mode is
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
