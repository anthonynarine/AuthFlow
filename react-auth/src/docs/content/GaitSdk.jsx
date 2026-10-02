import React from "react";
import { Link } from "react-router-dom";
import { CodeBlock, DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";
import {
    ENV_VARS,
    INSTALL,
    REPORT,
    SDK_VERSION,
    installCommand,
} from "./snippets";

// The website's one page about the package. The full reference (every setting,
// function and exception) lives with the package, versioned with it, so nothing
// here repeats it: install, the two common jobs, and links out.
const REPO = "https://github.com/anthonynarine/gait-sdk";
const PYPI = "https://pypi.org/project/gait-sdk/";

const FULL_INSTALL = `${INSTALL}
${installCommand("fastapi")}  # FastAPI services`;

export default function GaitSdk() {
    return (
        <>
            <p className="doc-lede">
                gait-sdk is Gait's Python package for Django REST Framework and FastAPI services. It reports your
                application's security checks to your workspace, and it can check who your product's users are when
                they sign in with Gait.
            </p>
            <ul>
                <li>
                    Version <strong>{SDK_VERSION}</strong>, on <a href={PYPI}>PyPI</a>. Source on{" "}
                    <a href={REPO}>GitHub</a>.
                </li>
                <li>Python 3.10 or later. MIT licence.</li>
            </ul>

            <DocSection id="install" title="Install">
                <CodeBlock label="Shell" code={FULL_INSTALL} />
                <p>Pin the exact version, as above, so an upgrade is always a change you chose.</p>
            </DocSection>

            <DocSection id="report-a-security-check" title="Report a security check">
                <p>
                    <StatusBadge feature="core" /> Your application runs its own checks and sends PASS or FAIL to
                    Gait, using its connection key:
                </p>
                <CodeBlock label="Environment" code={ENV_VARS} />
                <CodeBlock label="Python" code={REPORT} />
                <p>
                    Step by step, including where the key comes from and what Gait does with each result:{" "}
                    <DocLink to="connecting-your-software">Connecting your software</DocLink>.
                </p>
            </DocSection>

            <DocSection id="verify-a-user" title="Verify a user">
                <p>
                    <StatusBadge feature="productSignIn" /> Your product can let its users sign in with Gait accounts,
                    and gait-sdk checks each request's sign-in with Gait. The whole setup, both your server and your
                    API, is in <DocLink to="add-gait-sign-in">Add Gait sign-in to your product</DocLink>.
                </p>
                <p>
                    Want to use it? <Link to="/early-access">Request early access</Link>.
                </p>
            </DocSection>

            <DocSection id="full-reference" title="Full reference">
                <p>
                    Every setting, function and exception is documented with the package and versioned with it, so it
                    always matches the version you install:
                </p>
                <ul>
                    <li>
                        <a href={`${REPO}#readme`}>README</a>: configuration, both frameworks, and the full API.
                    </li>
                    <li>
                        <a href={`${REPO}/blob/main/docs/CHANGELOG.md`}>Changelog</a>: what changed in each version.
                    </li>
                    <li>
                        <a href={`${REPO}/blob/main/docs/SECURITY.md`}>Security</a>: what the package protects against, and how to
                        report a vulnerability privately.
                    </li>
                    <li>
                        <a href={`${REPO}/tree/main/examples`}>Runnable examples</a> for Django and FastAPI.
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
