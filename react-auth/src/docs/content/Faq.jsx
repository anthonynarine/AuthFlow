import React from "react";
import { DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";

// Only questions the rest of the docs already answer: each answer restates a
// page and links to it, so the FAQ can't say anything new or drift on its own.

function Faq({ items }) {
    return (
        <dl className="doc-glossary doc-faq">
            {items.map(([question, answer]) => (
                <React.Fragment key={question}>
                    <dt>{question}</dt>
                    <dd>{answer}</dd>
                </React.Fragment>
            ))}
        </dl>
    );
}

export default function FaqPage() {
    return (
        <>
            <p className="doc-lede">Short answers to common questions, each with a link to the page that explains it.</p>

            <DocSection id="your-data" title="Your data">
                <Faq
                    items={[
                        [
                            "Can another workspace see our findings, people or applications?",
                            <>
                                No. To anyone outside your workspace it doesn't exist: they get the same answer as for a
                                workspace that doesn't exist. See <DocLink to="isolation">Isolation and setup</DocLink>.
                            </>,
                        ],
                        [
                            "Does Gait change our code, servers or data?",
                            <>
                                No. A connection key can only report security checks. See{" "}
                                <DocLink to="what-gait-is#what-gait-is-not">What Gait is not</DocLink>.
                            </>,
                        ],
                        [
                            "How do we report a security problem?",
                            <>
                                Privately, never in public. For Gait itself, email the address on{" "}
                                <DocLink to="report-a-vulnerability">Report a vulnerability</DocLink>; for gait-sdk, use
                                the private channel listed there.
                            </>,
                        ],
                        [
                            "Do Gait's automated agents work on our software?",
                            <>
                                No. They look after Gait's own platform only. See{" "}
                                <DocLink to="automated-security-response">Automated security response</DocLink>.
                            </>,
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="applications-and-keys" title="Applications and keys">
                <Faq
                    items={[
                        [
                            "Why is the same software several applications?",
                            <>
                                Each environment is its own application, with its own keys and results, so a problem in{" "}
                                <code>local</code> never touches <code>production</code>. See{" "}
                                <DocLink to="local-to-production">Go from local to production</DocLink>.
                            </>,
                        ],
                        [
                            "We lost a connection key. Can Gait show it again?",
                            <>
                                No. It's shown once and Gait keeps only a fingerprint. Issue a new one and revoke the old
                                one. See <DocLink to="rotate-a-connection-key">Rotate a connection key</DocLink>.
                            </>,
                        ],
                        [
                            "Do connection keys expire?",
                            <>
                                Keys issued in the console don't expire. Rotate them on a schedule you choose. See{" "}
                                <DocLink to="rotate-a-connection-key">Rotate a connection key</DocLink>.
                            </>,
                        ],
                        [
                            "Can a connection key sign in to the console?",
                            <>
                                No. It can't sign in, invite anyone or read anything; it only reports checks for its own
                                application. See <DocLink to="people-and-applications">People and applications</DocLink>.
                            </>,
                        ],
                        [
                            "A key may have leaked. What now?",
                            <>
                                Revoke it straight away, then issue and deploy a new one. See{" "}
                                <DocLink to="applications-and-connection-keys#if-a-key-leaks">If a key leaks</DocLink>.
                            </>,
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="team-and-invites" title="Your team and invites">
                <Faq
                    items={[
                        [
                            "How long does an invite link work?",
                            <>
                                Once, for 7 days. See{" "}
                                <DocLink to="teams-roles-and-invites#inviting-your-team">Inviting your team</DocLink>.
                            </>,
                        ],
                        [
                            "Why can't I create a workspace or accept an invite?",
                            <>
                                Confirm your email address first, from the link Gait emailed you. See{" "}
                                <DocLink to="troubleshooting#signing-in-and-your-workspace">Troubleshooting</DocLink>.
                            </>,
                        ],
                        [
                            "Can a Member act on findings?",
                            <>
                                No. Members can see everything in the workspace; Owners and Admins act. See{" "}
                                <DocLink to="teams-roles-and-invites#roles">Roles</DocLink>.
                            </>,
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="findings" title="Findings">
                <Faq
                    items={[
                        [
                            "How does a finding close?",
                            <>
                                A later passing check from the same application and environment resolves it. You can't
                                resolve one by hand. See <DocLink to="handle-a-finding">Handle a finding</DocLink>.
                            </>,
                        ],
                        [
                            "If we accept a risk, will new failures reopen it?",
                            <>
                                No. It stays accepted, and the new reports are still recorded. See{" "}
                                <DocLink to="handle-a-finding#if-it-fails-again">If the check fails again</DocLink>.
                            </>,
                        ],
                        [
                            "What does \"self-reported\" mean?",
                            <>
                                Your software reported it about itself; "Gait-verified" means Gait ran or confirmed it.
                                Both count. See{" "}
                                <DocLink to="security-checks-and-findings#self-reported-vs-gait-verified">
                                    Self-reported vs Gait-verified
                                </DocLink>
                                .
                            </>,
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="your-products-users" title="Your product's users">
                <Faq
                    items={[
                        [
                            "Can our product's users sign in with Gait?",
                            <>
                                Yes: <StatusBadge feature="productSignIn" />. Gait says who they are; your
                                product decides what they can do. See{" "}
                                <DocLink to="product-organizations-and-invites">
                                    Your product's organizations &amp; invites
                                </DocLink>
                                .
                            </>,
                        ],
                        [
                            "Do our product's users see the Gait console?",
                            <>
                                No, and they never join your Gait workspace. See{" "}
                                <DocLink to="people-and-applications#your-products-own-users">
                                    Your product's own users
                                </DocLink>
                                .
                            </>,
                        ],
                        [
                            "Where is the full gait-sdk reference?",
                            <>
                                With the package, versioned with it. See <DocLink to="gait-sdk#full-reference">gait-sdk</DocLink>
                                .
                            </>,
                        ],
                    ]}
                />
            </DocSection>
        </>
    );
}
